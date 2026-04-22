import { Link } from "@tanstack/react-router";
import { ShoppingBag, User } from "lucide-react";
import logo from "@/assets/france-uniformes-logo-blue.jpeg";

interface SiteHeaderProps {
  schoolName?: string;
  cartCount?: number;
  showAccount?: boolean;
}

export function SiteHeader({ schoolName, cartCount = 0, showAccount = true }: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-3">
          <img src={logo} alt="France Uniformes" className="h-9 w-9 rounded-md object-cover" />
          <div className="hidden flex-col leading-tight sm:flex">
            <span className="text-sm font-semibold tracking-tight text-primary">France Uniformes</span>
            {schoolName && (
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                {schoolName}
              </span>
            )}
          </div>
        </Link>

        {schoolName && (
          <nav className="hidden items-center gap-7 text-sm font-medium text-muted-foreground md:flex">
            <Link to="/niveau" className="transition-colors hover:text-primary" activeProps={{ className: "text-primary" }}>
              Boutique
            </Link>
            <Link to="/enfants" className="transition-colors hover:text-primary" activeProps={{ className: "text-primary" }}>
              Mes enfants
            </Link>
            <Link to="/panier" className="transition-colors hover:text-primary" activeProps={{ className: "text-primary" }}>
              Commandes
            </Link>
          </nav>
        )}

        <div className="flex items-center gap-2">
          {showAccount && (
            <button
              type="button"
              className="hidden h-10 items-center gap-2 rounded-full border border-border bg-card px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted sm:inline-flex"
            >
              <User className="h-4 w-4" />
              <span>Famille Martin</span>
            </button>
          )}
          <Link
            to="/panier"
            className="relative inline-flex h-10 items-center gap-2 rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <ShoppingBag className="h-4 w-4" />
            <span className="hidden sm:inline">Panier</span>
            {cartCount > 0 && (
              <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--school-yellow)] px-1.5 text-[11px] font-semibold text-primary">
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border bg-card">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-4 lg:px-8">
        <div className="lg:col-span-2">
          <div className="flex items-center gap-3">
            <img src={logo} alt="France Uniformes" className="h-10 w-10 rounded-md object-cover" />
            <span className="text-base font-semibold tracking-tight text-primary">France Uniformes</span>
          </div>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
            Fabricant français d'uniformes scolaires. Nous accompagnons les établissements
            privés dans la confection et la distribution de tenues pensées pour le quotidien
            des élèves.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-foreground">Famille</h4>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li>Mon espace</li>
            <li>Mes enfants</li>
            <li>Mes commandes</li>
            <li>Guide des tailles</li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-foreground">Aide</h4>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li>Livraison & retours</li>
            <li>Contact établissement</li>
            <li>Conditions générales</li>
            <li>Mentions légales</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-muted-foreground sm:flex-row sm:px-6 lg:px-8">
          <span>© {new Date().getFullYear()} France Uniformes — Fabrication française</span>
          <span>Paiement sécurisé · Livraison à l'établissement</span>
        </div>
      </div>
    </footer>
  );
}