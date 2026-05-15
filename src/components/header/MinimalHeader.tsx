/**
 * Phase 7 — Variant "minimal" du header.
 *
 * Header sobre destiné aux tenants au branding minimaliste : nom de l'école
 * à gauche, navigation panier / compte à droite, sans bandeau d'identité ni
 * BackToSchoolBanner. Aucune dépendance à des assets spécifiques SJDC : tout
 * est lu depuis le tenant courant via `useTenant()`.
 */

import { Link } from "@tanstack/react-router";
import { LogIn, ShoppingBag, User } from "lucide-react";
import { useStore } from "@/lib/store";
import { useTenant } from "@/lib/tenant/TenantContext";

interface MinimalHeaderProps {
  schoolName?: string;
  cartCount?: number;
  showAccount?: boolean;
}

export function MinimalHeader({ schoolName, cartCount, showAccount = true }: MinimalHeaderProps) {
  const tenant = useTenant();
  const { cartCount: storeCount, user } = useStore();
  const count = cartCount ?? storeCount;
  const displayName = schoolName ?? tenant.shortName ?? tenant.name;

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="text-sm font-semibold tracking-tight text-foreground hover:text-primary">
          {displayName}
        </Link>
        <nav className="flex items-center gap-3">
          <Link
            to="/panier"
            className="relative inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-foreground/80 hover:bg-muted hover:text-foreground"
            aria-label="Panier"
          >
            <ShoppingBag className="h-4 w-4" />
            <span className="hidden sm:inline">Panier</span>
            {count > 0 ? (
              <span className="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                {count}
              </span>
            ) : null}
          </Link>
          {showAccount ? (
            user ? (
              <Link
                to="/famille"
                className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-foreground/80 hover:bg-muted hover:text-foreground"
              >
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Mon compte</span>
              </Link>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                <LogIn className="h-4 w-4" />
                <span className="hidden sm:inline">Connexion</span>
              </Link>
            )
          ) : null}
        </nav>
      </div>
    </header>
  );
}