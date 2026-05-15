# PLAN D'EXÉCUTION TECHNIQUE — MIGRATION MULTI-TENANT

> Document de pilotage pour transformer le projet "Saint-Jacques-de-Compostelle" en template maître multi-tenant, sans interruption de la production.
>
> Stratégie : **incrémentale, réversible, validation à chaque étape, zéro big-bang**.
> Principe directeur : **chaque phase doit pouvoir être déployée et rollbackée indépendamment**, le site SJC continuant à fonctionner en mode mono-tenant tant que la phase N+1 n'a pas validé.

---

## TABLE DES MATIÈRES

- Phase 0 — Préparation
- Phase 1 — Création du système tenants
- Phase 2 — Migration Saint-Jacques vers tenant officiel
- Phase 3 — Introduction des `school_id`
- Phase 4 — Migration du catalogue produits en base
- Phase 5 — TenantProvider + sous-domaines
- Phase 6 — Théming dynamique
- Phase 7 — Variants de composants
- Phase 8 — Refactor routing catalogue
- Phase 9 — Refactor emails multi-tenant
- Phase 10 — RLS multi-tenant sécurisées
- Phase 11 — Validation isolation sécurité
- Phase 12 — Création du premier établissement test
- Phase 13 — Déploiement progressif production
- Pièges critiques à éviter
- Architecture cible finale
- Stratégie de tests / CI / Staging

---

## PHASE 0 — PRÉPARATION

**Objectif** : Mettre en place un filet de sécurité avant toute modification (backup, branches, env staging, observabilité).

**Pourquoi** : Une migration multi-tenant touche RLS, JWT, DNS, paiement, emails. Sans backup vérifié et sans environnement staging, aucun rollback n'est sérieux.

**Ordre** : Strictement avant tout le reste.
**Impact prod** : Aucun.
**Risque de régression** : Nul.
**Temps estimé** : 1 à 2 jours.

### Actions
1. **Backup base** : export complet `pg_dump` (schéma + données) stocké hors-ligne, daté. Vérifier la restauration sur un projet Supabase vierge.
2. **Snapshot storage** : copier `incident-photos` et `email-assets` dans un bucket d'archive.
3. **Branche Git dédiée** `feat/multi-tenant` + protection main.
4. **Environnement staging** : nouveau projet Lovable Cloud (`*-staging`), DB clonée depuis le dump.
5. **Variables d'environnement** documentées (`ESTABLISHMENT_CODE`, `PAYPLUG_SECRET_KEY`, `MAILER_*`, `RESEND_*`, `EMAIL_WEBHOOK_SECRET`).
6. **Inventaire hardcoding** : grep `Saint-Jacques`, `compostelle`, `SJC`, `code_etablissement` (33 fichiers identifiés dans l'audit).
7. **Mise en place feature flags** simple : table `feature_flags(key text pk, enabled bool, tenant_id uuid null)` ou variable `VITE_MULTI_TENANT_ENABLED`.
8. **Observabilité** : activer logs serveur (Cloud → Logs), brancher Sentry côté client/SSR si possible.

### Rollback
- Aucun changement runtime, donc rollback = ne rien faire.

### Critères de validation
- Restore du dump validé sur staging.
- Staging fonctionnel à 100% avec les mêmes données qu'en prod.
- Feature flag `multi_tenant_enabled = false` en prod.

---

## PHASE 1 — CRÉATION DU SYSTÈME TENANTS

**Objectif** : Créer la table `tenants` + helpers SQL **sans encore l'utiliser**. Aucun code applicatif ne la référence.

**Pourquoi** : Poser la fondation. Si la fondation est buggée, on s'en aperçoit avant d'avoir touché 14 tables.

**Ordre** : Après Phase 0.
**Impact prod** : Nul (table créée, non lue).
**Risque** : Nul si on ne change pas le code.
**Rollback** : `DROP TABLE public.tenants CASCADE;`
**Temps estimé** : 0.5 jour.

### Tables créées
- `public.tenants`
- `public.tenant_domains` (multi-domaines / sous-domaines / domaines custom)

### Migration SQL

```sql
CREATE TABLE public.tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,                 -- 'sjc', 'demo', 'lycee-x'
  name text NOT NULL,                        -- 'Saint-Jacques-de-Compostelle'
  legal_name text,
  code_etablissement text UNIQUE,
  status text NOT NULL DEFAULT 'active',     -- 'active' | 'suspended' | 'archived'
  theme jsonb NOT NULL DEFAULT '{}'::jsonb,  -- tokens OKLCH, fonts, motifs
  branding jsonb NOT NULL DEFAULT '{}'::jsonb, -- logo_url, favicon_url, og_image
  seo jsonb NOT NULL DEFAULT '{}'::jsonb,    -- title, description, keywords
  contact jsonb NOT NULL DEFAULT '{}'::jsonb,-- email, phone, address
  payment jsonb NOT NULL DEFAULT '{}'::jsonb,-- {provider:'payplug', secret_ref:'PAYPLUG_SECRET_KEY_SJC'}
  email_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  features jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.tenant_domains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  domain text UNIQUE NOT NULL,               -- 'sjc.example.com', 'compostelle-uniformes.fr'
  is_primary boolean NOT NULL DEFAULT false,
  verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_tenant_domains_domain ON public.tenant_domains(lower(domain));
CREATE INDEX idx_tenants_slug ON public.tenants(slug);

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_domains ENABLE ROW LEVEL SECURITY;

-- Lecture publique limitée (pour résolution sous-domaine côté SSR)
CREATE POLICY "tenants_public_read" ON public.tenants
  FOR SELECT TO anon, authenticated USING (status = 'active');
CREATE POLICY "tenant_domains_public_read" ON public.tenant_domains
  FOR SELECT TO anon, authenticated USING (true);

-- Écriture admin uniquement
CREATE POLICY "tenants_admin_write" ON public.tenants
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "tenant_domains_admin_write" ON public.tenant_domains
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Helper : tenant courant via JWT claim 'tenant_id' (sera peuplé en Phase 5)
CREATE OR REPLACE FUNCTION public.current_tenant_id()
RETURNS uuid LANGUAGE sql STABLE AS $$
  SELECT NULLIF(
    current_setting('request.jwt.claims', true)::jsonb ->> 'tenant_id',
    ''
  )::uuid
$$;

-- Helper : appartenance d'un user à un tenant (pour future RLS)
CREATE OR REPLACE FUNCTION public.user_belongs_to_tenant(_user uuid, _tenant uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = _user AND p.tenant_id = _tenant
  )
$$;

CREATE TRIGGER trg_tenants_updated_at BEFORE UPDATE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
```

### Tests
- `INSERT` d'un tenant fictif `_test`, lecture par anon → OK.
- `current_tenant_id()` retourne `NULL` quand le claim n'existe pas.
- Lien linter Supabase : 0 warning.

### Critères de validation
- Tables créées, RLS activée, helpers déployés.
- Aucune régression observée sur le site (rien ne lit ces tables).

---

## PHASE 2 — MIGRATION SAINT-JACQUES VERS TENANT OFFICIEL

**Objectif** : Créer le tenant `sjc` à partir de l'existant. C'est un INSERT, sans rien casser.

**Pourquoi** : Avant d'introduire `school_id` (Phase 3), il faut une cible vers laquelle backfiller.

**Ordre** : Après Phase 1.
**Impact prod** : Nul.
**Risque** : Nul.
**Rollback** : `DELETE FROM public.tenants WHERE slug = 'sjc';`
**Temps estimé** : 0.5 jour (dont la collecte du contenu existant : couleurs, logos, copy).

### Données à collecter (inventaire)
- **Branding** : logos `src/assets/*sjc*`, favicon `public/favicon.ico`, og-image.
- **Theme** : tokens OKLCH lus dans `src/styles.css` (primary, secondary, accent, background, gradients, shadows, motifs `ShellMotif`).
- **SEO** : title/description par route (audit 33 fichiers).
- **Contact** : email, téléphone, adresse, IBAN, SIREN si présents.
- **Payment** : clé Payplug (référence le secret existant `PAYPLUG_SECRET_KEY`).
- **Email** : `RESEND_FROM`, `SMTP_FROM`, signature.

### Insertion (via tool insert)

```sql
INSERT INTO public.tenants (slug, name, code_etablissement, theme, branding, seo, contact, payment, email_config)
VALUES (
  'sjc',
  'Saint-Jacques-de-Compostelle',
  COALESCE(current_setting('app.establishment_code', true), 'SJC'),
  '{"primary":"oklch(...)","secondary":"oklch(...)","fonts":{"display":"...","body":"..."}}'::jsonb,
  '{"logo_url":"/assets/sjc-logo.svg","favicon_url":"/favicon.ico"}'::jsonb,
  '{"title":"...","description":"..."}'::jsonb,
  '{"email":"contact@...","phone":"...","address":"..."}'::jsonb,
  '{"provider":"payplug","secret_ref":"PAYPLUG_SECRET_KEY"}'::jsonb,
  '{"from":"...","reply_to":"..."}'::jsonb
);

INSERT INTO public.tenant_domains (tenant_id, domain, is_primary, verified)
SELECT id, 'compostelle-uniformes.fr', true, true FROM public.tenants WHERE slug='sjc';
```

### Rollback
- `DELETE FROM tenant_domains WHERE tenant_id = (SELECT id FROM tenants WHERE slug='sjc'); DELETE FROM tenants WHERE slug='sjc';`

### Critères de validation
- Tenant `sjc` lisible : `SELECT * FROM tenants WHERE slug='sjc'`.
- JSON theme/branding validés contre un schéma Zod côté app (test unitaire).

---

## PHASE 3 — INTRODUCTION DES `school_id` (TENANT_ID)

> ⚠️ **Renommage** : on utilise `tenant_id` partout (plus générique que `school_id`).

**Objectif** : Ajouter `tenant_id uuid NULL REFERENCES tenants(id)` sur toutes les tables métier, **sans contrainte NOT NULL**, puis backfill vers SJC, puis NOT NULL.

**Pourquoi** : Migration progressive sans casser les inserts existants.

**Ordre** : Après Phase 2.
**Impact prod** : Nul tant que le code n'écrit pas `tenant_id` (la valeur reste NULL).
**Risque** : Faible. Le backfill est idempotent.
**Temps estimé** : 1 jour.

### Tables impactées (14)
`profiles`, `children`, `family_parents`, `orders`, `order_items`, `order_status_history`, `order_incidents`, `delivery_options`, `client_counters`, `order_sequences`, `user_roles`, `email_send_log`, `email_unsubscribe_tokens`, `suppressed_emails`.

### Étape 3.1 — Ajout colonnes (NULL)

```sql
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'profiles','children','family_parents','orders','order_items',
    'order_status_history','order_incidents','delivery_options',
    'client_counters','order_sequences','user_roles',
    'email_send_log','email_unsubscribe_tokens','suppressed_emails'
  ] LOOP
    EXECUTE format(
      'ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id)',
      t
    );
    EXECUTE format(
      'CREATE INDEX IF NOT EXISTS %I ON public.%I(tenant_id)',
      'idx_'||t||'_tenant_id', t
    );
  END LOOP;
END $$;
```

### Étape 3.2 — Backfill vers SJC

```sql
WITH sjc AS (SELECT id FROM public.tenants WHERE slug='sjc')
UPDATE public.profiles SET tenant_id = sjc.id FROM sjc WHERE tenant_id IS NULL;
-- répéter pour les 13 autres tables
```

### Étape 3.3 — Vérification

```sql
SELECT 'profiles' AS t, count(*) FILTER (WHERE tenant_id IS NULL) FROM profiles
UNION ALL SELECT 'children', count(*) FILTER (WHERE tenant_id IS NULL) FROM children
-- ... toutes les tables
;
-- Toutes les lignes doivent retourner 0.
```

### Étape 3.4 — Passage NOT NULL + DEFAULT (différé, après Phase 5)

> **NE PAS FAIRE TOUT DE SUITE.** À programmer en fin de Phase 5, quand le code écrit `tenant_id` à l'INSERT.

```sql
ALTER TABLE public.profiles ALTER COLUMN tenant_id SET NOT NULL;
-- etc.
```

### Rollback
- `ALTER TABLE ... DROP COLUMN tenant_id;` sur chaque table (les colonnes étant NULL et non lues, pas de perte fonctionnelle).

### Tests
- Toutes les requêtes app actuelles fonctionnent (le code ignore `tenant_id`).
- Vérifier les 14 tables : 0 ligne avec `tenant_id IS NULL`.

### Cas limites
- `handle_new_user` trigger : à modifier en Phase 5 pour assigner `tenant_id` à la création de profil. Pour l'instant, NULL puis backfill périodique.

---

## PHASE 4 — MIGRATION DU CATALOGUE PRODUITS EN BASE

**Objectif** : Sortir le catalogue des fichiers TSX (`maternelle.tsx`, `college.tsx`, `lycee.tsx`) vers la base de données.

**Pourquoi** : Un tenant ne peut pas avoir son propre catalogue tant qu'il est en dur dans le code.

**Ordre** : Peut se faire en parallèle de Phase 5 (indépendant).
**Impact prod** : Moyen. La page catalogue change de source de données.
**Risque** : Régression d'affichage produit, prix, tailles.
**Rollback** : Feature flag `catalog_source = 'static' | 'db'`. En cas d'incident, basculer sur 'static' (les fichiers TSX restent dans le repo une release de plus).
**Temps estimé** : 2 à 3 jours.

### Tables créées

```sql
CREATE TABLE public.product_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  slug text NOT NULL,                  -- 'maternelle', 'college', 'lycee'
  label text NOT NULL,
  position int NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  UNIQUE (tenant_id, slug)
);

CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES public.product_categories(id),
  ref text NOT NULL,                   -- référence produit
  name text NOT NULL,
  description text,
  base_price numeric(10,2) NOT NULL,
  images jsonb NOT NULL DEFAULT '[]'::jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  active boolean NOT NULL DEFAULT true,
  position int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, ref)
);

CREATE TABLE public.product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  size text NOT NULL,
  variant text,                        -- 'fille', 'garcon', etc.
  price_override numeric(10,2),
  stock int,
  active boolean NOT NULL DEFAULT true,
  UNIQUE (product_id, size, variant)
);

ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

-- Lecture publique du catalogue actif du tenant courant
CREATE POLICY "products_public_read" ON public.products
  FOR SELECT TO anon, authenticated
  USING (active = true AND tenant_id = public.current_tenant_id());
-- (idem categories / variants)

-- Admin du tenant écrit
CREATE POLICY "products_admin_write" ON public.products
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') AND tenant_id = public.current_tenant_id())
  WITH CHECK (public.has_role(auth.uid(),'admin') AND tenant_id = public.current_tenant_id());
```

### Backfill
- Script Node/TS qui lit les arrays statiques de `maternelle.tsx`, `college.tsx`, `lycee.tsx` et les insère via `supabaseAdmin`.
- Script idempotent (`ON CONFLICT (tenant_id, ref) DO UPDATE`).
- Stocké dans `scripts/seed-sjc-catalog.ts`.

### Code impacté
- Routes `src/routes/maternelle.tsx`, `college.tsx`, `lycee.tsx` → server fn `getCatalog({ categorySlug })`.
- `src/lib/store.tsx` (panier) : ajouter le `tenant_id` du produit dans la ligne panier (clé d'invalidation).

### Tests
- Pages `/maternelle`, `/college`, `/lycee` affichent strictement le même contenu qu'avant (snapshot DOM).
- Ajout au panier identique (snapshot localStorage).
- Commande passée sur staging : montant total identique.

### Cas limites
- Image manquante → fallback prévu.
- Produit sans variant → ne pas casser.
- Devise / arrondi numeric(10,2) vs Number JS.

---

## PHASE 5 — TENANT PROVIDER + SOUS-DOMAINES

**Objectif** : Détecter le tenant à chaque requête (host header) et l'injecter dans le contexte serveur + JWT.

**Pourquoi** : Sans détection runtime, RLS et theming dynamique ne peuvent pas fonctionner.

**Ordre** : Après Phase 4 (catalogue prêt à être filtré).
**Impact prod** : Élevé (chaque requête passe par la résolution).
**Risque** : Si la résolution échoue, écran blanc.
**Rollback** : Feature flag `tenant_resolution_enabled`. Fallback vers tenant `sjc` par défaut.
**Temps estimé** : 2 jours.

### Code créé
- `src/lib/tenant/resolve-tenant.server.ts` : `resolveTenantFromHost(host: string)` → `Tenant | null` (cache LRU 60s).
- `src/lib/tenant/tenant-middleware.ts` : middleware serveur qui peuple `context.tenant`.
- `src/lib/tenant/TenantProvider.tsx` : Context React, `useTenant()`.
- `src/start.ts` : enregistrer le middleware tenant globalement (avant `attachSupabaseAuth`).
- `src/routes/__root.tsx` : loader qui retourne le tenant et passe à `<TenantProvider>`.

### JWT custom claim
- Hook Auth Supabase (`auth.users` access token hook) : ajouter `tenant_id` au JWT en lookup `profiles.tenant_id`.
- Mise à jour `handle_new_user` :

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _tenant uuid;
BEGIN
  -- Tenant fourni dans raw_user_meta_data ou résolu côté app puis injecté
  _tenant := COALESCE(
    (NEW.raw_user_meta_data->>'tenant_id')::uuid,
    (SELECT id FROM public.tenants WHERE slug='sjc')
  );
  INSERT INTO public.profiles (id, email, tenant_id, civilite, prenom, nom, telephone, adresse, code_postal, ville, code_etablissement)
  VALUES (NEW.id, NEW.email, _tenant,
    COALESCE(NEW.raw_user_meta_data->>'civilite','Mme'),
    COALESCE(NEW.raw_user_meta_data->>'prenom',''),
    COALESCE(NEW.raw_user_meta_data->>'nom',''),
    NEW.raw_user_meta_data->>'telephone',
    NEW.raw_user_meta_data->>'adresse',
    NEW.raw_user_meta_data->>'code_postal',
    NEW.raw_user_meta_data->>'ville',
    NEW.raw_user_meta_data->>'code_etablissement');
  RETURN NEW;
END $$;
```

### Tests
- `curl -H "Host: compostelle-uniformes.fr" /` → tenant `sjc`.
- `curl -H "Host: unknown.example" /` → 404 ou tenant fallback (selon config).
- Login : JWT contient `tenant_id`.

### Cas limites
- Localhost dev → fallback sur tenant via env `VITE_DEV_TENANT_SLUG=sjc`.
- Preview Lovable (`*.lovable.app`) → mapping spécial.
- Cache CDN : `Vary: Host` obligatoire.

---

## PHASE 6 — THÉMING DYNAMIQUE

**Objectif** : Injecter `tenants.theme` (JSONB) sous forme de CSS variables au runtime.

**Pourquoi** : Permet à chaque tenant d'avoir sa charte sans rebuild.

**Ordre** : Après Phase 5.
**Impact prod** : Visuel (testable visuellement immédiatement).
**Risque** : FOUC (flash of unstyled content) si injection tardive.
**Rollback** : Si theme JSON cassé, fallback hardcodé dans `styles.css`.
**Temps estimé** : 1 jour.

### Code
- `src/lib/tenant/ThemeInjector.tsx` : composant rendu côté SSR dans `<head>` qui émet `<style>:root{--primary:...;--secondary:...}</style>`.
- `src/styles.css` : tokens deviennent `var(--primary, oklch(...))` (fallback = SJC).
- Schéma Zod du theme : validation au chargement.

### Tests
- Modifier `tenants.theme` en DB → reload → couleurs changent.
- SSR : HTML initial contient déjà les variables (vérifier `view-source`).

### Cas limites
- Theme partiel → merge avec defaults.
- Mode dark : prévoir `theme.dark` séparé.

---

## PHASE 7 — VARIANTS DE COMPOSANTS

**Objectif** : Permettre à un tenant de choisir une variante visuelle de Header/Footer/HeroSection.

**Pourquoi** : Personnalisation au-delà des couleurs, sans forker.

**Ordre** : Après Phase 6. Optionnel pour MVP multi-tenant.
**Impact prod** : Faible (variants par défaut = comportement actuel).
**Temps estimé** : 1 à 2 jours.

### Pattern
- `tenants.theme.variants = { header: 'classic'|'minimal', hero: 'split'|'centered' }`.
- Composants `SiteHeader`, `SiteFooter`, `Hero` lisent `useTenant().theme.variants.header` et switchent.
- Convention : un dossier `src/components/header/{ClassicHeader,MinimalHeader}.tsx` + un export `SiteHeader.tsx` qui dispatch.

### Tests
- Snapshot DOM par variant.

---

## PHASE 8 — REFACTOR ROUTING CATALOGUE

**Objectif** : Remplacer `/maternelle`, `/college`, `/lycee` par `/catalogue/$niveau` dynamique.

**Pourquoi** : Permet à chaque tenant de définir ses propres niveaux/catégories.

**Ordre** : Après Phase 4 (catalogue en DB).
**Impact prod** : SEO (URLs changent).
**Risque** : Pertes de référencement si pas de redirects 301.
**Rollback** : Garder les anciennes routes en alias 301.
**Temps estimé** : 1 jour.

### Actions
- Créer `src/routes/catalogue.$niveau.tsx`.
- Ajouter `src/routes/maternelle.tsx` → `<Navigate to="/catalogue/maternelle" replace />` + `Link` rel canonical.
- 301 côté serveur via middleware.
- Sitemap.xml dynamique par tenant.

### Tests SEO
- Old URL → 301 vers new URL.
- `<link rel="canonical">` correct.
- Sitemap regénéré.

---

## PHASE 9 — REFACTOR EMAILS MULTI-TENANT

**Objectif** : Que chaque email envoyé soit contextualisé au tenant (logo, from, signature, couleurs).

**Pourquoi** : Un parent du Lycée X ne doit pas recevoir un email "Saint-Jacques".

**Ordre** : Après Phase 5.
**Impact prod** : Élevé (deliverability).
**Risque** : Mauvais "from" → bounces / spam.
**Rollback** : Fallback sur `RESEND_FROM` global.
**Temps estimé** : 2 jours.

### Modifications
- `enqueue_email(queue_name, payload)` : payload doit contenir `tenant_id`.
- `process-email-queue` : lire `tenants.email_config` pour `from`, `reply_to`, `signature`.
- Templates React Email reçoivent `tenant: Tenant` en props.
- `email_send_log.tenant_id` (déjà ajouté Phase 3).

### Domaines d'envoi
- Plan A : un sous-domaine par tenant (`notify.tenantX.fr`) → setup DNS par tenant.
- Plan B : domaine partagé `notify.template.com` avec `from: "Tenant X <noreply@notify.template.com>"`.

### Tests
- Envoi test sur staging par tenant.
- Vérifier headers SPF/DKIM/DMARC.
- Webhook bounces : `suppressed_emails.tenant_id` correctement renseigné.

---

## PHASE 10 — RLS MULTI-TENANT SÉCURISÉES

**Objectif** : Réécrire toutes les RLS pour isoler par `tenant_id`, en plus de l'isolation par `user_id`.

**Pourquoi** : Un admin d'un tenant ne doit JAMAIS voir les données d'un autre tenant.

**Ordre** : Après Phase 5 (JWT contient `tenant_id`).
**Impact prod** : Critique. Mauvaise policy = data leak.
**Risque** : Élevé. Faire en staging avec audit.
**Rollback** : Conserver l'ancienne policy nommée `_legacy`, basculer via `ALTER POLICY`.
**Temps estimé** : 2 jours + 1 jour audit.

### Pattern (exemple `orders`)

```sql
-- DROP des anciennes
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can insert own orders" ON public.orders;

-- Nouvelles, scopées tenant
CREATE POLICY "orders_user_select" ON public.orders FOR SELECT TO authenticated
  USING (auth.uid() = user_id AND tenant_id = public.current_tenant_id());
CREATE POLICY "orders_user_insert" ON public.orders FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND tenant_id = public.current_tenant_id());
CREATE POLICY "orders_admin_select" ON public.orders FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') AND tenant_id = public.current_tenant_id());
CREATE POLICY "orders_admin_update" ON public.orders FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') AND tenant_id = public.current_tenant_id())
  WITH CHECK (public.has_role(auth.uid(),'admin') AND tenant_id = public.current_tenant_id());
```

> Appliquer le même pattern aux 14 tables. Mettre à jour aussi `apel_families_overview` (ajouter `WHERE tenant_id = current_tenant_id()`).

### Cas limite : super-admin cross-tenant
- Ajouter rôle `superadmin` dans l'enum `app_role`.
- Policies `superadmin` : ignorent `tenant_id`.

### Tests
- 2 tenants, 2 admins. Admin A se connecte → ne voit que les commandes A.
- Test SQL direct via `set local request.jwt.claims = '{"sub":"...","tenant_id":"..."}'`.

---

## PHASE 11 — VALIDATION ISOLATION SÉCURITÉ

**Objectif** : Auditer formellement qu'aucune fuite cross-tenant n'existe.

**Ordre** : Après Phase 10.
**Temps estimé** : 1 jour.

### Checklist
- Suite de tests d'intégration (Vitest) : 2 tenants seedés, vérifier que toutes les server fn renvoient bien des données scopées.
- `pgTAP` ou requêtes manuelles : pour chaque table, simuler `request.jwt.claims` du tenant B et vérifier `SELECT count(*) WHERE tenant_id = (tenant A)` = 0.
- Linter Supabase : 0 erreur.
- Audit Storage : `incident-photos` doit isoler par tenant (préfixe `{tenant_id}/{user_id}/...`).
- Audit JWT : décodage manuel d'un access_token, claim `tenant_id` présent.

---

## PHASE 12 — CRÉATION DU PREMIER ÉTABLISSEMENT TEST

**Objectif** : Onboarder un tenant fictif `demo` end-to-end.

**Ordre** : Après Phase 11.
**Temps estimé** : 0.5 jour.

### Workflow d'onboarding (UI admin)
1. Form admin → INSERT `tenants`, `tenant_domains`.
2. Upload logo / favicon → bucket `tenant-assets/{tenant_id}/`.
3. Theme via colorpicker → JSONB.
4. Seed catalogue : copie depuis tenant template ou import CSV.
5. Création du premier user admin (Auth invite).

### Tests
- DNS `demo.template.com` → CNAME → app → résolution OK.
- Login admin → ne voit que ses données.
- Passer une commande de bout en bout (Payplug en mode test).

---

## PHASE 13 — DÉPLOIEMENT PROGRESSIF PRODUCTION

**Objectif** : Basculer la prod sur la version multi-tenant sans interruption.

**Ordre** : Après Phase 12 validée en staging pendant 1 semaine.
**Temps estimé** : 1 jour + monitoring.

### Stratégie
1. Déploiement avec feature flag `multi_tenant_enabled = true` mais **un seul tenant existant (sjc)**.
2. DNS : ajouter `compostelle-uniformes.fr` à `tenant_domains` (déjà fait Phase 2).
3. Garder ancien code path en fallback pendant 1 release.
4. Monitoring 48h : taux d'erreur, latence SSR, volume emails, paiements OK.
5. Onboarder `demo` → `lycee-x` → ...

### Rollback global
- Toggle env `VITE_MULTI_TENANT_ENABLED=false` + redeploy → comportement strictement mono-tenant. Données `tenant_id` restent en DB (inutilisées).

---

## PIÈGES CRITIQUES À ÉVITER

### RLS
- ❌ Oublier `tenant_id = current_tenant_id()` dans une policy = data leak.
- ❌ `current_tenant_id()` retourne NULL si JWT mal forgé → `tenant_id = NULL` matche... rien (bon) MAIS avec `OR` malheureux, peut tout matcher. Toujours `AND`.
- ❌ Bypass via `supabaseAdmin` côté serveur sans filtrer manuellement par `tenant_id`.

### Cache Cloudflare / CDN
- ❌ Mettre en cache `/` sans `Vary: Host` → tenant A reçoit la home de tenant B.
- ✅ `Vary: Host, Cookie` sur toutes les pages dynamiques.
- ✅ Invalidation du cache theme/branding quand `tenants.updated_at` change.

### Payplug
- ❌ Une seule clé `PAYPLUG_SECRET_KEY` partagée → impossible de tracer les paiements par tenant.
- ✅ Stocker `payment.secret_ref` par tenant ; chaque tenant a sa propre clé secret (référencée via secrets nommés `PAYPLUG_KEY_<TENANT_SLUG>`).
- ❌ Webhook `/api/public/payplug-webhook` sans vérification `tenant_id` → risque cross-tenant.
- ✅ Inclure `tenant_id` dans `metadata` Payplug, valider au callback.

### SSR
- ❌ `tenant` lu dans un module global → mémoïsation cross-request → fuite.
- ✅ Toujours via `context` de la requête, jamais via variable globale.

### JWT
- ❌ Custom claim `tenant_id` non signé → un user pourrait modifier son token. Supabase signe l'access_token, donc OK, mais ne pas faire confiance à un claim manipulable côté client.
- ❌ `tenant_id` désynchronisé après changement de `profiles.tenant_id` (cas migration user) → forcer reauth.

### Cross-tenant
- ❌ ID auto-incrément partagé (ex: `client_number_seq`) → fuite d'information sur le volume des autres tenants.
- ✅ Sequences scopées par tenant ou UUID purs.

### SEO
- ❌ Sitemap unique partagé entre tenants → confusion Google.
- ✅ Sitemap par domaine. `robots.txt` par domaine. Canonical par domaine.
- ❌ `og:image` du tenant SJC servie sur le domaine du tenant X.

### DNS Wildcard
- ❌ Wildcard `*.template.com` sans validation côté app → un attaquant crée `evil.template.com` et reçoit du trafic.
- ✅ App rejette tout host non présent dans `tenant_domains.verified = true`.
- ✅ Certificat SSL wildcard ou ACM/Let's Encrypt par domaine.

---

## ARCHITECTURE CIBLE FINALE

### Arborescence

```
src/
  components/
    header/ClassicHeader.tsx, MinimalHeader.tsx, index.tsx
    footer/...
    ui/   # shadcn (inchangé)
  features/
    catalog/  (composants + hooks + server fn)
    cart/
    checkout/
    orders/
    auth/
    apel/
    admin/
  lib/
    tenant/
      resolve-tenant.server.ts
      tenant-middleware.ts
      TenantProvider.tsx
      ThemeInjector.tsx
      schema.ts          # Zod du theme/branding
    payments/
      payplug.server.ts
    emails/
      render.ts
  routes/
    __root.tsx
    index.tsx
    catalogue.$niveau.tsx
    _authenticated/
      compte.tsx
      commandes.tsx
    admin/
      index.tsx
      tenants.tsx       # (superadmin)
      products.tsx
    api/public/
      payplug-webhook.ts
      email-webhook.ts
  integrations/supabase/  # auto-généré, ne pas toucher
scripts/
  seed-tenant.ts
  seed-sjc-catalog.ts
supabase/migrations/      # toutes les phases
```

### Schéma DB final (résumé)

```
tenants(id, slug, name, theme, branding, seo, contact, payment, email_config, features)
tenant_domains(tenant_id, domain, is_primary, verified)
profiles(id, tenant_id, ...)
user_roles(user_id, tenant_id, role)
children(tenant_id, user_id, ...)
family_parents(tenant_id, user_id, ...)
product_categories(tenant_id, slug, label)
products(tenant_id, category_id, ref, name, base_price, images)
product_variants(product_id, size, variant, price_override, stock)
delivery_options(tenant_id, code, label, ...)
orders(tenant_id, user_id, ...)
order_items(order_id, product_id, ...)
order_status_history, order_incidents (tenant_id)
client_counters, order_sequences (tenant_id, user_id)
email_send_log, email_unsubscribe_tokens, suppressed_emails (tenant_id)
```

### Conventions de nommage
- Tables : snake_case pluriel.
- Colonne tenant : toujours `tenant_id uuid NOT NULL REFERENCES tenants(id)`.
- Policies : `<table>_<role>_<action>` (`orders_user_select`).
- Server fn : verbe + nom (`getCatalog`, `createOrder`).
- Routes API : `/api/public/...` pour webhooks, `/api/...` interne (rare, préférer server fn).
- Slugs tenants : `[a-z0-9-]+`, 3-32 chars.

---

## STRATÉGIE DE TESTS

- **Unit** (Vitest) : helpers tenant, validation Zod, calculs prix/TVA.
- **Integration server fn** : seed 2 tenants, vérifier isolation.
- **E2E** (Playwright) : parcours complet par tenant (login → catalogue → panier → checkout → confirmation email).
- **Sécurité RLS** : suite SQL dédiée (un fichier `tests/rls/*.sql` par table).
- **Visual regression** : Chromatic ou Playwright screenshots par tenant.

## STRATÉGIE CI/CD

- Branche `main` → déploie `staging`.
- Tag `v*` → déploie `prod` après approbation manuelle.
- GitHub Actions : `lint → typecheck → unit → integration → build → preview deploy → E2E sur preview → promote`.
- Migrations DB jouées automatiquement via Lovable Cloud (chaque migration = 1 commit reviewé).

## STRATÉGIE STAGING

- Projet Lovable Cloud séparé.
- Données seedées : 2 tenants (`sjc-staging`, `demo`).
- Payplug en mode test.
- Resend en mode sandbox.
- Accès limité par Basic Auth ou IP allowlist.

---

## ANNEXE — PLANS DE MIGRATION SPÉCIFIQUES

### Assets / Logos / Images
- Bucket `tenant-assets` (public, RLS par préfixe `{tenant_id}/`).
- Migration : copier `src/assets/sjc-*` → `tenant-assets/{sjc_id}/logo.svg` etc.
- Update `tenants.branding.logo_url` vers URL bucket.

### Emails
- Phase 9 détaillée. Migration : remplacer `RESEND_FROM` par lookup `tenants.email_config.from`.

### Theme
- Phase 6. Migration : extraction couleurs `styles.css` → JSON `tenants[sjc].theme`.

### SEO
- Audit `<head>` de chaque route, extraire title/description, déplacer dans `tenants.seo` ou conserver par-route avec interpolation `{{tenant.name}}`.
- Sitemap par domaine généré dynamiquement.

### Routes
- Phase 8. Anciennes routes → 301.

### Panier localStorage
- Clé actuelle probablement `cart` → devient `cart:{tenant_slug}` pour éviter mélange si un user navigue entre tenants sur le même navigateur.
- Migration douce : à la 1ère lecture, si vieille clé existe et tenant courant = sjc → renommer.

---

## RÉCAPITULATIF DURÉE

| Phase | Durée | Cumul |
|------:|------:|------:|
| 0     | 1-2j  | 2j    |
| 1     | 0.5j  | 2.5j  |
| 2     | 0.5j  | 3j    |
| 3     | 1j    | 4j    |
| 4     | 2-3j  | 7j    |
| 5     | 2j    | 9j    |
| 6     | 1j    | 10j   |
| 7     | 1-2j  | 12j   |
| 8     | 1j    | 13j   |
| 9     | 2j    | 15j   |
| 10    | 2j    | 17j   |
| 11    | 1j    | 18j   |
| 12    | 0.5j  | 18.5j |
| 13    | 1j + monitoring | 20j |

**Total : ~4 semaines** de travail focus, hors imprévus et onboarding nouveaux tenants.

---

_Fin du blueprint. Prêt à exécuter Phase 0 sur ta validation._
