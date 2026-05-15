/**
 * Phase 7 — Dispatch de variant de header.
 *
 * Lit `useTenant().config.variants?.header` et choisit la variante
 * correspondante. Valeur par défaut : `"classic"` (= header SJDC actuel,
 * comportement strictement inchangé).
 *
 * Les call sites existants continuent d'importer directement
 * `@/components/SiteHeader` ; ce fichier est l'entry point recommandé pour
 * la suite (refactor progressif page par page).
 */

import { useTenant } from "@/lib/tenant/TenantContext";
import { ClassicHeader } from "./ClassicHeader";
import { MinimalHeader } from "./MinimalHeader";

interface SiteHeaderProps {
  schoolName?: string;
  cartCount?: number;
  showAccount?: boolean;
}

export function SiteHeader(props: SiteHeaderProps) {
  const tenant = useTenant();
  const variant = tenant.config.variants?.header ?? "classic";

  switch (variant) {
    case "minimal":
      return <MinimalHeader {...props} />;
    case "classic":
    default:
      return <ClassicHeader {...props} />;
  }
}

export { ClassicHeader, MinimalHeader };