/**
 * Feature flags multi-tenant.
 *
 * Phase 0 — Préparation : tous les flags sont OFF par défaut.
 * Le site Saint-Jacques-de-Compostelle continue de fonctionner exactement
 * comme aujourd'hui (mono-tenant, catalogue hardcodé, thème statique).
 *
 * Activation progressive :
 *   - Phase 4-5 : ENABLE_TENANT_RESOLUTION
 *   - Phase 6   : ENABLE_DYNAMIC_THEME
 *   - Phase 7   : ENABLE_DYNAMIC_CATALOG
 *   - Phase 10  : ENABLE_TENANT_RLS
 *
 * Chaque flag peut être basculé indépendamment et est réversible.
 */

export const TENANT_FLAGS = {
  /**
   * Active la résolution dynamique du tenant à partir du Host HTTP.
   * OFF = tous les visiteurs sont mappés sur DEFAULT_TENANT_SLUG.
   */
  ENABLE_TENANT_RESOLUTION: false,

  /**
   * Active les politiques RLS scopées par tenant_id.
   * OFF = les politiques RLS actuelles (mono-tenant) restent en vigueur.
   * ATTENTION : ne basculer qu'après backfill complet de tenant_id sur toutes les tables.
   */
  ENABLE_TENANT_RLS: false,

  /**
   * Active le chargement dynamique des tokens de thème (couleurs, typographies)
   * depuis la table tenants.theme_tokens.
   * OFF = utilise les tokens statiques de src/styles.css.
   */
  ENABLE_DYNAMIC_THEME: false,

  /**
   * Active le chargement du catalogue produits depuis la base (table products).
   * OFF = utilise le catalogue hardcodé actuel (src/lib/store.tsx).
   */
  ENABLE_DYNAMIC_CATALOG: false,

  /**
   * Active la résolution dynamique de la configuration email (from, reply_to,
   * sender_domain, signature) depuis tenants.config.email.
   * OFF = utilise les constantes baked-in dans src/routes/lovable/email/transactional/send.ts.
   * Quand ON et que tenants.config.email est vide pour le tenant courant,
   * on retombe sur les constantes baked-in (jamais d'écran blanc / mauvais from).
   */
  ENABLE_TENANT_EMAIL_CONFIG: false,
} as const;

/**
 * Slug du tenant par défaut utilisé tant que ENABLE_TENANT_RESOLUTION est OFF
 * ou en fallback si la résolution par Host échoue.
 */
export const DEFAULT_TENANT_SLUG = "saint-jacques" as const;

export type TenantFlag = keyof typeof TENANT_FLAGS;

export function isTenantFlagEnabled(flag: TenantFlag): boolean {
  return Boolean(TENANT_FLAGS[flag]);
}