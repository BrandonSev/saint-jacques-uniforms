
# Audit technique complet — Migration multi-tenant

Projet actuel : boutique d'uniformes du **Groupe scolaire Saint-Jacques-de-Compostelle (Dax)**, opéré par **France Uniformes**. Objectif : devenir le **template maître** servant N établissements via un sous-domaine par école (ex. `sjc.franceuniformes.fr`, `bisp.franceuniformes.fr`).

> Ce document est un **rapport d'audit** (pas un plan d'implémentation immédiat). Il se conclut par une **roadmap de migration safe**.

---

## 1. Stack technique

| Couche | Techno |
|---|---|
| Framework frontend | **TanStack Start v1** (React 19, SSR, Vite 7) |
| Routing | TanStack Router (file-based, `src/routes/`) |
| Backend "app-internal" | TanStack `createServerFn` (`src/server/*.functions.ts`) |
| Webhooks / API publique | TanStack server routes (`src/routes/api/public/*`) |
| ORM | **Aucun** — accès direct via `@supabase/supabase-js` (publishable + service role) |
| Base de données | Postgres (Supabase / Lovable Cloud), 14 tables `public.*` |
| Authentification | Supabase Auth (email/password + recovery), rôles via table `user_roles` (`admin`, `apel`) |
| Paiement | **Payplug** (`src/server/payplug.*`, webhook `src/routes/api/public/payplug-webhook.ts`) |
| Emails | Resend + SMTP (Nodemailer) + queue PGMQ + templates `react-email` (`src/lib/email-templates/*`) |
| Hébergement | Cloudflare Workers (build via `@cloudflare/vite-plugin`, `wrangler.jsonc`) |
| UI | Tailwind v4 (CSS tokens dans `src/styles.css`), shadcn/ui (Radix), lucide-react |
| Data fetching | `@tanstack/react-query` + `react-hook-form` + `zod` |
| Outils annexes | `jspdf` (PDF commandes), `xlsx` (export admin), `recharts`, `embla-carousel`, `date-fns` |

**Dépendances critiques (risque migration)** : `@lovable.dev/cloud-auth-js` (broker OAuth), `@supabase/supabase-js`, `@tanstack/react-start`, `payplug` (HTTP direct). Pas de Prisma/Drizzle → toute évolution de schéma se fait via migrations SQL.

---

## 2. Architecture actuelle

```
src/
├── routes/                # 27 fichiers (file-based)
│   ├── __root.tsx          # shell HTML, Provider, Toaster
│   ├── index.tsx           # landing publique (177 l.)
│   ├── login.tsx, mot-de-passe-oublie.tsx, reset-password.tsx
│   ├── boutique.tsx, maternelle.tsx, college.tsx, lycee.tsx
│   ├── blouse-officielle.tsx
│   ├── panier.tsx (704 l.), commandes.tsx (834 l.)
│   ├── famille.tsx (608 l.), enfants.index.tsx (411 l.), enfants.$childId.historique.tsx
│   ├── admin.tsx, apel.tsx
│   ├── aide.* (cgu, cgv, contact, livraison, mentions, confidentialité, guide-tailles)
│   ├── api/public/         # webhooks (payplug, email-diag)
│   └── lovable/email/      # endpoints email Lovable (preview, queue, send, suppression)
├── components/             # 16 composants applicatifs + ui/ (shadcn)
├── server/                 # createServerFn (apel, email, payplug, establishment)
├── lib/                    # store.tsx (528 l.), email-templates/, deliveryOptions, orderPdf, sizeRecommendation
├── integrations/supabase/  # auto-généré (client, client.server, auth-middleware, types)
├── config/featureFlags.ts  # flag livraison domicile (date-based)
├── assets/                 # 30+ images (logo SJDC, blason, photos école…)
└── styles.css              # tokens oklch (palette bleu/or SJDC)
```

### Points de couplage forts
- **`SiteHeader`** (377 l.) : conditionne tout son rendu sur `schoolName` string et importe directement `sjcLogo`. Le footer (`SiteFooter` exporté du même fichier) hardcode "Saint-Jacques-de-Compostelle — Dax", "France Uniformes", APE, contact.
- **Catalogue produits hardcodé** : tableaux `products` en const dans `maternelle.tsx`, `college.tsx`, `lycee.tsx`, `blouse-officielle.tsx`. Ref produit, prix, image, description, écoles concernées sont tous figés dans le code source.
- **Routes thématiques par niveau** (`/maternelle`, `/college`, `/lycee`) : 3 fichiers très similaires → duplication de structure UI.
- **`store.tsx`** (528 l.) : God-context — auth, profil, enfants, parents, panier, checkout. Aucun découplage par feature.
- **Identité visuelle** : palette `--primary` / `--gold` / `--cream` dans `:root` est explicitement annotée *"Palette Saint-Jacques-de-Compostelle"*. Composants `ShellMotif`, `WaveMotif`, `SchoolIdentityBar`, `DirectorQuote`, `HeadteacherQuote` (avec photo Marguerite de Pérignon, Emmanuel Ortolo) sont **spécifiques à cet établissement**.
- **Métadonnées SEO** : chaque route (`head()`) contient le nom de l'école en dur (~15 routes).

### Composants difficilement réutilisables (en l'état)
| Composant | Spécifique à SJDC ? | Action recommandée |
|---|---|---|
| `SiteHeader` / `SiteFooter` | Oui (logo, nom, branche `if (schoolName)`) | Lire depuis `useTenant()` |
| `DirectorQuote`, `HeadteacherQuote` | Oui (texte + portrait) | Charger depuis `tenants.content` JSONB |
| `SchoolMotif` (ShellMotif, WaveMotif, SchoolIdentityBar) | Oui (motif coquille pèlerin) | Devenir variants par tenant |
| `BackToSchoolAlert` | Date hardcodée (24/05) | Champ `tenants.deadline_date` |
| `PageWatermark` | Utilise blason SJDC | Lire `tenant.watermark_asset` |
| `ProductCard`, `SizeBadge`, `ChildPicker`, `AddChildDialog`, `AddressAutocomplete` | **Non — réutilisables tels quels** | Aucune action |
| `RequireAuth` | Logique pure | Réutilisable |

### Comptage signaux : 173 occurrences de "Saint-Jacques / Compostelle / Dax / France Uniformes" dans 33 fichiers.

---

## 3. Routing

### Routes publiques (sans `RequireAuth`)
- `/` (landing)
- `/login`, `/mot-de-passe-oublie`, `/reset-password`
- `/aide/*` (cgu, cgv, contact, livraison, mentions-legales, confidentialite, guide-tailles)
- `/commandes/retour-paiement`
- `/api/public/payplug-webhook`, `/api/public/email-diag`
- `/email/unsubscribe`
- `/lovable/email/*` (préviews + queue, internes Lovable)

### Routes privées (wrappées `RequireAuth`)
- `/boutique`, `/maternelle`, `/college`, `/lycee`, `/blouse-officielle`
- `/panier`, `/commandes`
- `/famille`, `/enfants`, `/enfants/$childId/historique`
- `/apel` (rôle `apel` ou `admin`)
- `/admin` (rôle `admin`, vérifié dans le composant)

### Middleware / gating
- `RequireAuth` (`src/components/RequireAuth.tsx`) : redirige vers `/login` si non connecté ; piège les comptes APEL hors de `/apel`.
- `requireSupabaseAuth` (`src/integrations/supabase/auth-middleware.ts`) : middleware sur les server functions sensibles.
- `attachSupabaseAuth` (global `src/start.ts`) : attache le bearer JWT côté client.

### Logique liée au domaine
- **Aucune logique multi-domaine actuelle.** Le domaine n'est jamais lu (pas de `request.headers.host` utilisé pour scoper). `process.env.PUBLIC_APP_URL` sert uniquement à construire l'URL de retour Payplug (un seul domaine global).
- URLs externes hardcodées : `franceuniformes.fr` dans `src/lib/email/send.server.ts` (mailer fallback).

---

## 4. Base de données (14 tables `public`)

| Table | Rôle | Multi-tenant requis ? |
|---|---|---|
| `profiles` | Famille (1 par utilisateur auth) | **OUI** (`school_id`) |
| `children` | Enfants d'une famille | OUI (héritera via profile, ou colonne propre) |
| `family_parents` | Parents secondaires | OUI (héritera) |
| `orders` | Commandes (numérotées `CMD-YYYYMMDD-Cxxx-yyy`) | **OUI** |
| `order_items` | Lignes de commande (snapshots produit) | Hérite via order |
| `order_status_history` | Historique statut commande | Hérite |
| `order_incidents` | Réclamations (avec photos) | Hérite |
| `order_sequences` | Compteur par utilisateur | OUI (clé `(school_id, user_id)`) |
| `client_counters` | Numéro client (`Cxxx`) | OUI (idem) |
| `delivery_options` | Modes de livraison | **OUI** (catalogue par école) |
| `user_roles` | `admin`/`apel` (enum `app_role`) | **OUI** (rôle scoppé école : un admin SJDC ≠ admin BISP) |
| `email_send_log`, `email_send_state`, `email_unsubscribe_tokens`, `suppressed_emails` | Email infra | Global (peut rester partagé, ajouter `tenant_id` en métadonnée) |

### Données actuellement "globales" qui devront devenir multi-tenant
- **Catalogue produits** : pas en DB aujourd'hui, à créer (table `products` scoppée par école).
- **Contenu CMS** (citations directrice, guide tailles, blocs landing) : actuellement dans le code → table `tenant_content` ou JSONB `tenants.content`.
- **Code établissement** : actuellement secret unique `ESTABLISHMENT_CODE` → champ `tenants.signup_code` (un par école).
- **Emails de notification** : `ADMIN_NOTIFICATION_EMAIL` → `tenants.admin_email`.
- **Coordonnées Payplug** : 1 seul `PAYPLUG_SECRET_KEY` → soit garder un compte Payplug central (mode marketplace) soit ajouter `tenants.payplug_secret_id` pointant vers Vault.

### Triggers/fonctions critiques à adapter
- `handle_new_user()` : insère `profiles` à l'inscription → devra capter le `school_id` depuis `raw_user_meta_data`.
- `generate_order_number(_user_id)` : devra prendre `(_user_id, _school_id)` et préfixer/suffixer le numéro par le code école (`SJC-CMD-…`).
- `apel_families_overview(_season_start)` : à filtrer par `school_id`.
- `has_role(_user_id, _role)` : devra devenir `has_role(_user_id, _role, _school_id)` ; sinon un admin d'une école aurait accès aux autres.

### RLS — risque majeur
**Toutes les politiques actuelles** filtrent uniquement sur `auth.uid() = user_id` ou `has_role(auth.uid(), 'admin')`. **Aucune n'isole par école.** À migration, **chaque policy** devra ajouter `AND school_id = current_setting('app.current_school_id')` (ou via JWT custom claim) pour éviter qu'un admin SJDC voie les commandes BISP.

### Indexes / contraintes
- 20 migrations existent (`supabase/migrations/`). Ajout de `school_id` impactera : index existants `(user_id)`, contraintes UNIQUE sur `(user_id, role)` dans `user_roles` (devient `(user_id, role, school_id)`), unicité order_number.

---

## 5. Logique métier

### Tunnel de commande
1. `/boutique` → choix du niveau (3 routes statiques)
2. Liste produits (tableau `const products` figé en source)
3. Page produit (`/blouse-officielle`) → ajout panier (childId + size + qty obligatoires)
4. `/panier` → choix livraison (`shipping_mode` home/pickup) → checkout
5. `store.checkout()` insère `orders` + `order_items` (snapshots)
6. Création paiement Payplug (`createPayplugPayment` server fn)
7. Webhook `/api/public/payplug-webhook` → met à jour `paid_at`, déclenche emails
8. Retour utilisateur → `/commandes/retour-paiement`

### Logique panier
- `useLocal("sjc.cart", [])` → **clé localStorage hardcodée `sjc.cart`** : à scoper par tenant (`fu.{slug}.cart`) sinon mélange entre établissements sur même device.
- Purge auto des items dont l'enfant n'existe plus.

### Gestion utilisateurs
- Inscription requiert `code_etablissement` validé par `verifyEstablishmentCode` (server fn) contre `process.env.ESTABLISHMENT_CODE`.
- Profil + parents + enfants gérés dans `store.tsx`.
- Rôles `admin` / `apel` via `user_roles`.

### Emails (10 templates)
welcome, order-confirmation, admin-order, order-status, incident-family/admin/resolution, password-reset, apel-reminder. Branding (logo, nom expéditeur) actuellement piloté par env globale → devra prendre `tenant` en paramètre.

### Règles métier spécifiques SJDC
- Date limite commandes (24/05/2026 — APEL)
- Catalogue Maternelle uniquement (Collège/Lycée annoncés "non gérés par France Uniformes")
- Distribution APEL sur place avant le 01/09 (`featureFlags.ts`)
- Numérotation commande au format `CMD-YYYYMMDD-Cxxx-yyy`

### Risques de migration
- **Rétro-compat numéros de commande** : ne pas re-numéroter les commandes existantes.
- **Webhook Payplug** : un seul endpoint, doit identifier l'école depuis `payplug_payment_id` → ajouter `school_id` sur `orders` + indexer.
- **Sessions actives** : changement clé localStorage panier = panier vidé chez utilisateurs courants.
- **Emails en file d'attente** : payloads existants sans `tenant_id` → fallback vers tenant 1.

---

## 6. Composants UI

| Catégorie | Composants | À faire |
|---|---|---|
| **Réutilisables tels quels** | `ProductCard`, `SizeBadge`, `ChildPicker`, `AddChildDialog`, `AddressAutocomplete`, `PurchaseHistoryPreview`, `RequireAuth`, tout `components/ui/` (shadcn) | Aucune |
| **À paramétrer (props ou context)** | `SiteHeader`, `SiteFooter`, `BackToSchoolAlert`, `BackToSchoolBanner` | Lire `useTenant()` |
| **À modulariser (variants)** | `SchoolMotif` (`ShellMotif`/`WaveMotif`), `PageWatermark`, `AuthHeroBackground` | Système de "motif" par tenant : `tenants.theme.motif = 'shell' \| 'wave' \| 'plain'` |
| **À transformer en CMS** | `DirectorQuote`, `HeadteacherQuote`, sections homepage, blocs `/blouse-officielle` | Charger depuis `tenant_content` JSONB |
| **Spécifique non-essentiel** | `FrenchFlag` | Garder global |

---

## 7. Thématisation — éléments hardcodés à externaliser

### Couleurs (`src/styles.css`)
- `:root` contient un commentaire explicite *"Palette Saint-Jacques-de-Compostelle"* avec `--primary`, `--gold`, `--cream`, `--rouge`, `--teal`, `--gradient-hero`, `--gradient-shield`, `--shadow-elegant`, `--shell-pattern`. **Tous à externaliser** dans le tenant.

### Logos & assets (dossier `src/assets/`)
- `saint-jacques-blason.png`, `saint-jacques-logo-new.png`, `saint-jacques-logo-full.png`, `saint-jacques-seal.png`, `france-uniformes-logo-*` (5 variantes), photos de classe (`enfants-classe-blouses`, `maternelle-cour-blouses`, `classe-maternelle-blouses`, `elementaire-hero`, `lycee-uniformes`), portraits (`marguerite-de-perignon`, `emmanuel-ortolo`).
- **À migrer vers Storage** (bucket `tenant-assets/{slug}/...`), URL stockée dans `tenants.theme.logo_url`, etc.

### Polices
- Poppins / Montserrat (Google Fonts via `@import` dans CSS) : peuvent être globales ou par tenant.

### Constantes textuelles
- Nom école, ville, slogan, "Depuis 2003", APE, adresse postale, téléphone : 173 occurrences à remplacer par `tenant.*`.

### Métadonnées SEO
- Chaque route a un `head()` avec titre/description hardcodés → builder centralisé `buildMeta(tenant, page)`.

---

## 8. Configuration multi-tenant — proposition

### Détection du tenant (par sous-domaine)
1. **Server middleware** (request middleware TanStack `src/start.ts`) : lit `request.headers.get("host")`, parse le subdomain (`sjc.franceuniformes.fr` → `sjc`), résout le tenant via cache (KV Cloudflare ou in-memory LRU avec invalidation), injecte `tenant` dans le contexte.
2. **Custom JWT claim** : à la connexion, ajouter `school_id` dans le JWT Supabase (via Auth Hook) → utilisé par les RLS policies (`auth.jwt() ->> 'school_id'`).
3. **Client-side** : `TenantProvider` (lit `window.location.hostname` au boot + valide via server fn) → `useTenant()` partout.
4. **Dev/preview** : fallback via query param `?tenant=sjc` ou cookie pour Lovable preview (URL unique).

### Pages à adapter
Quasi toutes : header/footer/landing/SEO/email branding. Mais le pattern `useTenant()` + tokens CSS pilotés par `<style data-tenant>` au root limite la chirurgie aux composants identifiés en §6.

### Risques
- **Fuite cross-tenant** si une RLS oublie le filtre `school_id` → tester avec un compte fixture par école.
- **Cache CDN/SSR** partagé entre subdomains → varier la cache key sur `Host`.
- **OAuth Google** : redirect URI doit lister tous les sous-domaines.
- **Webhook Payplug** : un endpoint unique → la commande doit porter `school_id` pour router les emails correctement.
- **localStorage panier** : clé `sjc.cart` partagée si plusieurs sous-domaines partagent un parent → scoper par hostname.

---

## 9. Stratégie de migration safe (recommandée)

### Étape 0 — Préparation (sans impact prod)
- Geler les évolutions fonctionnelles non critiques.
- Snapshot DB + dump.
- Branche `feat/multi-tenant`.
- Créer un environnement de staging avec données réelles anonymisées.

### Étape 1 — Schéma : introduire `tenants` (additif, non-breaking)
1. Créer `tenants(id uuid PK, slug text unique, name text, theme jsonb, content jsonb, signup_code text, admin_email text, deadline_date date, created_at)`.
2. **INSERT** d'un tenant `slug='sjc'` correspondant à SJDC.
3. Ajouter `school_id uuid REFERENCES tenants(id)` **nullable** sur : `profiles`, `orders`, `delivery_options`, `user_roles`, `client_counters`, `order_sequences`, `email_send_log`, `email_unsubscribe_tokens`.
4. **Backfill** : `UPDATE … SET school_id = '<sjc-uuid>' WHERE school_id IS NULL;`
5. Une fois stabilisé : `ALTER … SET NOT NULL`.

### Étape 2 — Catalogue produits en DB
1. Créer `products(id, school_id, slug, name, ref, price_cents, description, image_url, level, kind, sizes jsonb, position, active)`.
2. INSERT depuis les `const products` actuels (Maternelle SJDC).
3. Refactor des routes `/maternelle|college|lycee|blouse-officielle` pour fetch dynamique.

### Étape 3 — Théming dynamique
1. `TenantProvider` injecte un `<style>` qui override `--primary`, `--gold`, etc. depuis `tenant.theme`.
2. `SiteHeader`/`SiteFooter`/`SchoolMotif`/`PageWatermark` lisent `useTenant()`.
3. Migrer assets dans Storage `tenant-assets/`.

### Étape 4 — Détection sous-domaine + JWT claim
1. Request middleware ajoute `tenant` au contexte serveur.
2. Auth Hook Supabase ajoute `school_id` au JWT (Edge Function `before-user-created` ou `access_token` hook).
3. `attachSupabaseAuth` reste inchangé.

### Étape 5 — RLS multi-tenant
1. Réécrire **chaque** policy : ajouter `AND school_id = (auth.jwt() ->> 'school_id')::uuid`.
2. Adapter `has_role` → `has_role(uid, role, school_id)`.
3. Tests : compte SJDC ne voit aucune donnée d'un compte fixture "BISP".

### Étape 6 — Logique métier scoped
1. `generate_order_number` prend `school_id`, format `<TENANT_PREFIX>-CMD-…`.
2. `verifyEstablishmentCode` : compare contre `tenants.signup_code` selon le subdomain courant.
3. `store.tsx` : clé localStorage `fu.{slug}.cart`.
4. Webhook Payplug : route les emails via `orders.school_id`.

### Étape 7 — Onboarding 2e tenant (smoke test)
- Créer `tenants(slug='demo', …)`, sous-domaine `demo.franceuniformes.fr`, theme + 1 produit fictif.
- Valider isolation totale.

### Étape 8 — Cutover production SJDC
- Déploiement progressif via feature flag `MULTI_TENANT_ENABLED`.
- Plan rollback : `school_id` reste nullable côté code (lecture défensive), revert via `git revert` + restore migrations down.

### Ordre des migrations SQL (résumé)
1. `create_tenants` + insert SJDC
2. `add_school_id_nullable` (toutes tables concernées)
3. `backfill_school_id` (insert tool)
4. `set_school_id_not_null`
5. `create_products` + seed
6. `update_functions` (`generate_order_number`, `has_role`, `apel_families_overview`)
7. `update_rls_policies` (toutes les tables)
8. `update_handle_new_user`

### Points de vigilance critiques à tester
- Connexion + signup avec code école côté `sjc.` puis `demo.` → pas de cross-leak.
- Création commande → numéro préfixé tenant, email envoyé avec branding tenant, webhook Payplug attribue au bon tenant.
- Admin SJDC consulte `/admin` → ne voit QUE commandes SJDC (test SQL : `SELECT count(*) FROM orders WHERE school_id != sjc`).
- APEL SJDC ne voit aucune famille BISP.
- Reset password → email avec branding tenant.
- Migration des paniers actifs (clé localStorage) — accepter la perte.
- Performances : index sur `school_id` partout.

---

## 10. Dette technique identifiée

| Sujet | Détail | Priorité |
|---|---|---|
| **Catalogue hardcodé** | `const products` dans 4 routes | **Haute** (bloquant multi-tenant) |
| **God-store** | `store.tsx` 528 l. mêle auth, profils, parents, enfants, panier, checkout | Moyenne — découper par feature avec react-query |
| **Couplage `if (schoolName)`** | `SiteHeader` branche tout son rendu sur une string ad hoc | Haute |
| **Métadonnées SEO dupliquées** | 15+ `head()` avec strings figés | Moyenne |
| **Routes `/maternelle|college|lycee` quasi-identiques** | Devraient être 1 route paramétrée `/niveau/$slug` | Moyenne |
| **`store.checkout` long** | 80+ lignes, mêle build payload + insert + clear | Faible |
| **Pas d'ORM** | Toute requête supabase tapée à la main, types depuis `types.ts` auto-généré | Faible (acceptable pour cette taille) |
| **Tests** | 2 fichiers vitest seulement (`deliveryOptions`, `featureFlags`) | Moyenne — ajouter tests RLS multi-tenant |
| **localStorage clé `sjc.cart`** | Préfixe figé | Haute |
| **Email "from" hardcodé** | `franceuniformes.fr` dans `send.server.ts` | Moyenne |
| **`PUBLIC_APP_URL` mono-domaine** | Payplug return URL | Haute |
| **Composants 800+ lignes** | `AddChildDialog` (827), `commandes.tsx` (834), `panier.tsx` (704), `famille.tsx` (608) | Moyenne — refactor en sous-composants |

---

## 11. Recommandations — architecture cible

### Multi-tenant
- **Modèle "shared schema, shared DB" avec `school_id`** + RLS — meilleur ratio coût/maintenance pour 5–50 écoles.
- Resolution tenant via subdomain → `tenant_id` injecté en JWT (claim) ET en contexte serveur.
- Si à terme >100 écoles ou conformité forte : envisager schemas Postgres séparés.

### Frontend
```
src/
├── tenant/                       # NOUVEAU
│   ├── TenantProvider.tsx
│   ├── useTenant.ts
│   ├── resolveTenant.server.ts   # serverFn : host → tenant
│   └── theme.ts                  # injection tokens CSS
├── features/                     # NOUVEAU (découpe du store)
│   ├── auth/, family/, children/, cart/, orders/, products/, apel/, admin/
├── components/
│   ├── shell/  (SiteHeader, SiteFooter — tenant-aware)
│   ├── motifs/ (variants par tenant)
│   ├── catalog/ (ProductCard…)
│   └── ui/     (shadcn)
├── routes/
│   ├── catalogue.$niveau.tsx     # remplace maternelle/college/lycee
│   └── produit.$slug.tsx         # remplace blouse-officielle
└── server/                       # createServerFn par feature
```

### Système de variants (UI par tenant)
- Tokens : tout via CSS vars overridables (`--primary`, `--gold`, …).
- Motifs : `tenants.theme.motif = 'shell' | 'wave' | 'crest' | 'plain'` → composant `<TenantMotif />` swappe.
- Layouts : `tenants.theme.layout = 'centered' | 'split'` pour la landing.

### Système de thèmes
- JSON Schema strict côté `tenants.theme` validé par Zod (avant insert).
- Preview admin du theme (route `/admin/theme`) pour itérer sans déploiement.

### DB recommandée
- `tenants`, `tenant_domains` (1-N pour custom domains à terme), `products`, `product_variants`, `tenant_content` (cms blocs), `tenant_email_templates_overrides`.
- Index composite `(school_id, …)` partout.
- RLS systématiques avec helper `is_tenant_member(uid, school_id)`.

### Bonnes pratiques scalabilité
- Cache résolution tenant (KV Cloudflare, TTL 60 s).
- Vary HTTP cache sur `Host`.
- Logs structurés avec `tenant_id` (Sentry tag).
- Feature flags par tenant (`tenants.features jsonb`).
- Suite de tests E2E "isolation cross-tenant" en CI avant chaque déploiement.

---

## 12. Livrable final — synthèse

Le projet est **techniquement sain** (TanStack Start moderne, RLS basiques en place, paiements + emails fonctionnels) mais **architecturalement mono-tenant** : 173 références hardcodées à SJDC/Dax/France Uniformes, palette CSS dédiée, catalogue produit en source TS, aucune notion de `school_id` en DB.

La migration recommandée se fait en **8 étapes additives** (zero-downtime) :
1. Schéma `tenants` + colonnes nullable
2. Backfill SJDC
3. NOT NULL
4. Catalogue produits en DB
5. Théming dynamique
6. Détection subdomain + JWT claim
7. Réécriture RLS scoped
8. Onboarding 2e tenant pour validation

Risques majeurs maîtrisables : fuite RLS cross-tenant, webhook Payplug, numérotation des commandes, cache CDN par hostname.

Effort estimé : **~3 à 5 semaines** pour un développeur sénior, **2 semaines** supplémentaires pour les tests multi-tenant + onboarding du 2e établissement.

> **Prochaine étape suggérée** : valider ce rapport, puis je peux générer le plan d'exécution détaillé de l'**Étape 1** (création table `tenants` + insertion SJDC + ajout colonnes `school_id` nullable) pour démarrer la migration sans risque.
