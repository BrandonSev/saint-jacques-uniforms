/**
 * Phase 7 — Variant "minimal" du footer.
 *
 * Footer mono-ligne : nom du tenant + liens d'aide minimaux.
 * Aucun asset codé en dur — toutes les valeurs proviennent de `useTenant()`.
 */

import { Link } from "@tanstack/react-router";
import { useTenant } from "@/lib/tenant/TenantContext";

export function MinimalFooter() {
  const tenant = useTenant();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-background py-6">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-4 text-xs text-muted-foreground sm:flex-row sm:px-6 lg:px-8">
        <p>
          © {year} {tenant.name}
          {tenant.config.tagline ? <span className="ml-1">· {tenant.config.tagline}</span> : null}
        </p>
        <nav className="flex items-center gap-4">
          <Link to="/aide/contact" className="hover:text-foreground">Contact</Link>
          <Link to="/aide/mentions-legales" className="hover:text-foreground">Mentions légales</Link>
          <Link to="/aide/confidentialite" className="hover:text-foreground">Confidentialité</Link>
          <Link to="/aide/cgv" className="hover:text-foreground">CGV</Link>
        </nav>
      </div>
    </footer>
  );
}