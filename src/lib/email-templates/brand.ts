/**
 * Phase 12 — Branding tenant des templates React Email.
 *
 * Chaque template accepte un `brand?: EmailBrand` partiel, qui est mergé
 * avec `DEFAULT_EMAIL_BRAND` (valeurs France Uniformes / SJC actuelles).
 * Tant que le routeur `send-transactional-email` n'injecte pas de brand
 * (flag `ENABLE_TENANT_EMAIL_CONFIG` OFF), tous les emails restent
 * pixel-identiques à la version SJC historique.
 *
 * NOTE — couleurs : les clients mail (Outlook, Gmail) ne supportent pas
 * `oklch()`. Les couleurs doivent donc être fournies en hex / rgb. Les
 * tokens `theme_tokens.*` (oklch) ne sont PAS lus directement ici —
 * `tenants.config.email.header_color` / `accent_color` doivent être
 * renseignés en hex côté admin.
 */

export type EmailBrand = {
  siteName: string;
  logoUrl: string;
  logoWidth: number;
  logoAlt: string;
  appUrl: string;
  headerColor: string;
  accentColor: string;
  /** Texte ajouté après "L'équipe {role} ", ex. "de France Uniformes". */
  signatureSuffix: string;
  /** Pied de page première ligne. */
  footerTagline: string;
};

export const DEFAULT_EMAIL_BRAND: EmailBrand = {
  siteName: "France Uniformes",
  logoUrl:
    "https://uyavawaeytlrjxozxyam.supabase.co/storage/v1/object/public/email-assets/france-uniformes-logo-white.png",
  logoWidth: 170,
  logoAlt: "France Uniformes",
  appUrl: "https://sjdc-dax.franceuniformes.fr",
  headerColor: "#0a2540",
  accentColor: "#c8102e",
  signatureSuffix: "de France Uniformes",
  footerTagline: "France Uniformes — Uniformes scolaires sur mesure",
};

export function resolveBrand(partial?: Partial<EmailBrand> | null): EmailBrand {
  if (!partial) return DEFAULT_EMAIL_BRAND;
  return { ...DEFAULT_EMAIL_BRAND, ...partial };
}