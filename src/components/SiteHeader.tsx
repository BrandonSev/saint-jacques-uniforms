import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut, ShieldCheck, ShoppingBag, User } from "lucide-react";
import logo from "@/assets/france-uniformes-logo-blue.jpeg";
import sjcLogo from "@/assets/saint-jacques-logo-full.png";
import { SchoolIdentityBar } from "@/components/SchoolMotif";
import { useStore } from "@/lib/store";
import { toast } from "sonner";

interface SiteHeaderProps {
  schoolName?: string;
  cartCount?: number;
  showAccount?: boolean;
}

export function SiteHeader({ schoolName, cartCount, showAccount = true }: SiteHeaderProps) {
  const { cartCount: storeCount, profile, user, signOut, isAdmin } = useStore();
  const count = cartCount ?? storeCount;
  const navigate = useNavigate();
  const famName = profile?.family_name || profile?.nom;
  const familyLabel = famName ? `Famille ${famName}` : (user?.email ?? "Mon compte");
  const handleSignOut = async () => {
    await signOut();
    toast.success("Déconnecté");
    navigate({ to: "/login" });
  };
  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-border bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3">
            {schoolName ? (
              <>
                <img src={sjcLogo} alt="Saint-Jacques de Compostelle" className="h-10 w-auto object-contain" />
                <div className="hidden flex-col leading-tight sm:flex">
                  <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                    Espace familles
                  </span>
                  <span className="text-sm font-semibold tracking-tight text-primary">
                    Saint-Jacques de Compostelle
                  </span>
                </div>
              </>
            ) : (
              <>
                <img src={logo} alt="France Uniformes" className="h-9 w-9 rounded-md object-cover" />
                <div className="hidden flex-col leading-tight sm:flex">
                  <span className="text-sm font-semibold tracking-tight text-primary">France Uniformes</span>
                </div>
              </>
            )}
          </Link>

          {schoolName && user && (
            <nav className="hidden items-center gap-7 text-sm font-medium text-muted-foreground md:flex">
              {isAdmin ? (
                <Link
                  to="/admin"
                  className="inline-flex items-center gap-1 transition-colors hover:text-primary"
                  activeProps={{ className: "text-primary" }}
                >
                  <ShieldCheck className="h-3.5 w-3.5" /> Administration
                </Link>
              ) : (
                <>
                  <Link
                    to="/boutique"
                    className="transition-colors hover:text-primary"
                    activeProps={{ className: "text-primary" }}
                  >
                    Boutique
                  </Link>
                  <Link
                    to="/enfants"
                    className="transition-colors hover:text-primary"
                    activeProps={{ className: "text-primary" }}
                  >
                    Mes enfants
                  </Link>
                  <Link
                    to="/commandes"
                    className="transition-colors hover:text-primary"
                    activeProps={{ className: "text-primary" }}
                  >
                    Mes commandes
                  </Link>
                </>
              )}
            </nav>
          )}

          <div className="flex items-center gap-2">
            {showAccount && user && (
              <Link
                to="/famille"
                title="Voir et modifier les coordonnées de la famille"
                className="hidden h-10 items-center gap-2 rounded-full border border-border bg-slate-200 px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted sm:inline-flex"
                activeProps={{ className: "ring-2 ring-primary/40" }}
              >
                <User className="h-4 w-4" />
                <span className="max-w-[160px] truncate">{familyLabel}</span>
              </Link>
            )}
            {showAccount && user && (
              <button
                type="button"
                onClick={handleSignOut}
                title="Se déconnecter"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-muted-foreground hover:text-[var(--rouge)] hover:bg-muted"
              >
                <LogOut className="h-4 w-4" />
              </button>
            )}
            {!isAdmin && user && (
              <Link
                to="/panier"
                className="relative inline-flex h-10 items-center gap-2 rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground shadow-[var(--shadow-card)] transition-colors hover:bg-primary/90"
              >
                <ShoppingBag className="h-4 w-4" />
                <span className="hidden sm:inline">Panier</span>
                {count > 0 && (
                  <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--rouge)] px-1.5 text-[11px] font-semibold text-white">
                    {count}
                  </span>
                )}
              </Link>
            )}
          </div>
        </div>
      </header>
      {/* SchoolIdentityBar retiré : faisait doublon avec le header */}
    </>
  );
}

export function SiteFooter() {
  const { isAdmin } = useStore();
  return (
    <footer className="border-t border-border" style={{ background: "var(--gradient-hero)" }}>
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 text-white sm:px-6 lg:grid-cols-4 lg:px-8">
        <div className="lg:col-span-2">
          <div className="flex items-center gap-4">
            <img src={sjcLogo} alt="Saint-Jacques de Compostelle" className="h-16 w-auto object-contain drop-shadow" />
            <div>
              <div className="text-base font-semibold">Saint-Jacques de Compostelle</div>
              <div className="mt-0.5 text-xs text-white/70">Groupe scolaire catholique · Dax</div>
            </div>
          </div>
          <p className="mt-5 max-w-md text-sm leading-relaxed text-white/80">
            Boutique officielle des uniformes du groupe Saint-Jacques de Compostelle. Tenues validées par
            l'établissement, confectionnées avec soin pour le quotidien des élèves de la maternelle au collège.
          </p>
          <div className="mt-5 flex items-center gap-3 text-xs text-white/60">
            <span>Confectionné par</span>
            <img src={logo} alt="France Uniformes" className="h-7 w-7 rounded-md object-cover" />
            <span>France Uniformes · Fabrication française</span>
          </div>
        </div>
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">
            {isAdmin ? "Administration" : "Famille"}
          </h4>
          <ul className="mt-4 space-y-2 text-sm text-white/85">
            {isAdmin ? (
              <li>
                <Link to="/admin" className="hover:text-white hover:underline">
                  Tableau de bord
                </Link>
              </li>
            ) : (
              <>
                <li>
                  <Link to="/boutique" className="hover:text-white hover:underline">
                    Boutique
                  </Link>
                </li>
                <li>
                  <Link to="/enfants" className="hover:text-white hover:underline">
                    Mes enfants
                  </Link>
                </li>
                <li>
                  <Link to="/commandes" className="hover:text-white hover:underline">
                    Mes commandes
                  </Link>
                </li>
                <li>
                  <Link to="/aide/guide-tailles" className="hover:text-white hover:underline">
                    Guide des tailles
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">Aide</h4>
          <ul className="mt-4 space-y-2 text-sm text-white/85">
            <li>
              <Link to="/aide/livraison" className="hover:text-white hover:underline">
                Livraisons
              </Link>
            </li>
            <li>
              <Link to="/aide/contact" className="hover:text-white hover:underline">
                Contact établissement
              </Link>
            </li>
            <li>
              <Link to="/aide/cgu" className="hover:text-white hover:underline">
                Conditions générales
              </Link>
            </li>
            <li>
              <Link to="/aide/confidentialite" className="hover:text-white hover:underline">
                Confidentialité
              </Link>
            </li>
            <li>
              <Link to="/aide/mentions-legales" className="hover:text-white hover:underline">
                Mentions légales
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/15">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-white/70 sm:flex-row sm:px-6 lg:px-8">
          <span>© {new Date().getFullYear()} France Uniformes · Tous droits réservés · Fabrication française</span>
          <span>Paiement sécurisé</span>
        </div>
      </div>
    </footer>
  );
}
