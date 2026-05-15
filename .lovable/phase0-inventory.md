# Phase 0 — Inventaire des références mono-tenant

Date : 2026-05-15
Scope : `src/**` (hors `node_modules`, `routeTree.gen.ts`, `types.ts`)

## 1. Références "Saint-Jacques / Compostelle"

- **89 occurrences** réparties sur **32 fichiers**
  - Routes : 24 fichiers
  - Composants : 4 fichiers (`SiteHeader`, `SchoolMotif`, `PageWatermark`, `AuthHeroBackground`)
  - Email templates : 1 fichier (`apel-reminder`)
  - Lib : 2 fichiers (`orderPdf`, `store`)
  - Server : 1 fichier (`payplug.functions`)
  - Styles : `src/styles.css` (2 occurrences en commentaires)

### Top 10 fichiers (occurrences)

| Fichier | Occ. | Action migration |
|---|---|---|
| `src/routes/index.tsx` | 10 | Remplacer par `tenant.name`, `tenant.shortName` (Phase 6) |
| `src/routes/login.tsx` | 6 | Idem + logo dynamique |
| `src/routes/college.tsx` | 6 | Devient `/catalogue/college` paramétré (Phase 7) |
| `src/components/SiteHeader.tsx` | 6 | Logo + nom depuis `useTenant()` |
| `src/routes/reset-password.tsx` | 5 | Templates email tenant-aware |
| `src/routes/mot-de-passe-oublie.tsx` | 5 | Idem |
| `src/routes/lycee.tsx` | 5 | Catalogue dynamique |
| `src/routes/enfants.index.tsx` | 4 | Sections/classes via `tenant.config.levels` |
| `src/routes/boutique.tsx` | 4 | Catalogue dynamique |
| `src/components/SchoolMotif.tsx` | 4 | Motif via `tenant.theme.motif` |

## 2. Autres dépendances mono-tenant

| Catégorie | Compte | Stratégie cible |
|---|---|---|
| URLs `franceuniformes.fr` | 16 | Variables `tenant.domain` + `SITE_URL` env |
| Couleurs `#hex` hardcodées (hors `styles.css`) | 58 | Tokens sémantiques OKLCH (Phase 6) |
| Refs logo (`france-uniformes-logo*`) | 3 | `tenant.theme.logoUrl` (Storage bucket) |
| `ESTABLISHMENT_CODE` / `code_etablissement` | 5 | Remplacé par `tenant_id` (Phase 2) |
| Routes catalogue hardcodées (`maternelle.tsx`, `college.tsx`, `lycee.tsx`, `blouse-officielle.tsx`) | 4 routes | Route dynamique unique `/catalogue/$level` (Phase 7) |
| Catalogue produits hardcodé | `src/lib/store.tsx` (528 lignes) | Migration vers table `products` (Phase 4) |

## 3. Surface DB mono-tenant (rappel)

14 tables sans colonne `tenant_id` à migrer en Phase 2 :
`profiles`, `children`, `family_parents`, `orders`, `order_items`,
`order_status_history`, `order_incidents`, `delivery_options`,
`client_counters`, `order_sequences`, `user_roles`, `email_send_log`,
`email_unsubscribe_tokens`, `suppressed_emails`.

## 4. Verdict Phase 0

- ✅ Inventaire complété
- ✅ Aucune référence hardcodée critique côté server (`payplug.functions.ts` n'a que 3 occ. textuelles dans des libellés email)
- ⚠️ **Bloquant Phase 6** : 58 couleurs hex hors design system → à migrer vers tokens AVANT d'activer `ENABLE_DYNAMIC_THEME`
- ⚠️ **Bloquant Phase 7** : 4 routes catalogue dupliquées → à fusionner en route paramétrée

## 5. Recommandation ordre de bataille

1. **Phase 1 prochaine** : créer table `tenants` + insérer le tenant `saint-jacques` (zéro impact runtime)
2. **Phase 2** : ajouter colonne `tenant_id` nullable sur les 14 tables + backfill
3. **Préparation Phase 6** : refactor des 58 couleurs hex en tokens (peut être fait en parallèle, sans flag)
4. **Préparation Phase 7** : extraction du catalogue `store.tsx` vers JSON puis vers DB