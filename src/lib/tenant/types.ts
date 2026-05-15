/**
 * Phase 8 — Modèle public d'un tenant côté client.
 *
 * Toutes les valeurs sont JSON-sérialisables : ce shape transite par la
 * frontière SSR/CSR (route loader → hydrate React).
 */

export type TenantConfig = {
  /** Email destinataire des notifications admin (commande, incident…). */
  adminEmail?: string | null;
  /** Date butoir d'inscription / rentrée affichée dans `BackToSchoolAlert`. */
  deadlineDate?: string | null;
  /**
   * Phase 11 — Bandeau de rentrée. Si absent, on retombe sur les constantes
   * historiques de `BackToSchoolAlert` (24 mai 2026, rentrée 2026).
   * `deadline_iso` doit être une date YYYY-MM-DD valide.
   */
  back_to_school?: {
    deadline_iso?: string | null;
    deadline_label?: string | null;
    season_label?: string | null;
    year?: number | null;
  } | null;
  /** Numéro de téléphone affiché dans le footer / contact. */
  contactPhone?: string | null;
  /** Coordonnées postales pour le footer / mentions légales. */
  contactAddress?: string | null;
  /** Slogan affiché en sous-titre du header / SEO. */
  tagline?: string | null;
  /**
   * Phase 7 — Variants de composants UI.
   * Permet à un tenant de choisir une présentation alternative sans forker.
   * Les valeurs absentes retombent sur "classic".
   */
  variants?: {
    header?: HeaderVariant;
    footer?: FooterVariant;
  };
  [key: string]: any;
};

export type HeaderVariant = "classic" | "minimal";
export type FooterVariant = "classic" | "minimal";

export type TenantContext = {
  id: string;
  slug: string;
  name: string;
  shortName: string | null;
  logoUrl: string | null;
  status: string;
  config: TenantConfig;
};

/**
 * Tenant fallback utilisé quand la résolution serveur ne renvoie rien
 * (mode mono-tenant historique). Garantit que `useTenant()` ne renvoie
 * jamais `null` côté composants.
 */
export const FALLBACK_TENANT: TenantContext = {
  id: "00000000-0000-0000-0000-000000000000",
  slug: "saint-jacques",
  name: "Saint-Jacques-de-Compostelle — Dax",
  shortName: "SJDC",
  logoUrl: null,
  status: "active",
  config: {},
};