/**
 * Phase 7 — Dispatch de variant de footer.
 *
 * Lit `useTenant().config.variants?.footer` et choisit la variante
 * correspondante. Valeur par défaut : `"classic"` (footer SJDC actuel,
 * comportement strictement inchangé).
 */

import { useTenant } from "@/lib/tenant/TenantContext";
import { ClassicFooter } from "./ClassicFooter";
import { MinimalFooter } from "./MinimalFooter";

export function SiteFooter() {
  const tenant = useTenant();
  const variant = tenant.config.variants?.footer ?? "classic";

  switch (variant) {
    case "minimal":
      return <MinimalFooter />;
    case "classic":
    default:
      return <ClassicFooter />;
  }
}

export { ClassicFooter, MinimalFooter };