import { Link, useNavigate } from "@tanstack/react-router";
import { LogIn, LogOut, Menu, ShieldCheck, ShoppingBag, User, X } from "lucide-react";
import { useEffect, useState } from "react";
import logo from "@/assets/france-uniformes-logo-blue.jpeg";
import logoWhite from "@/assets/france-uniformes-logo-white.svg";
import sjcLogo from "@/assets/saint-jacques-logo-new.png";
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
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);
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
                <img src={sjcLogo} alt="Saint-Jacques-de-Compostelle" className="h-10 w-auto shrink-0 object-contain" />
                <div className="hidden min-w-0 flex-col leading-tight lg:flex">
                  <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                    Espace familles
                  </span>
                  <span className="truncate text-sm font-semibold tracking-tight text-primary">
                    Saint-Jacques-de-Compostelle
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
            <nav className="hidden items-center gap-7 text-sm font-medium text-muted-foreground lg:flex">
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
            {showAccount && user && !isAdmin && (
              <Link
                to="/famille"
                title="Voir et modifier les coordonnées de la famille"
                className="hidden h-10 items-center gap-2 rounded-full border border-border bg-slate-200 px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted lg:inline-flex"
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
                className="hidden h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-muted-foreground hover:text-[var(--rouge)] hover:bg-muted lg:inline-flex"
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
                <span className="hidden lg:inline">Panier</span>
                {count > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-[var(--rouge)] px-1.5 text-[12px] font-bold text-white shadow-md ring-2 ring-white">
                    {count}
                  </span>
                )}
              </Link>
            )}
            {!user && (
              <Link
                to="/login"
                title="Se connecter"
                className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground shadow-[var(--shadow-card)] transition-colors hover:bg-primary/90"
              >
                <LogIn className="h-4 w-4" />
                <span className="hidden sm:inline">Connexion</span>
              </Link>
            )}
            {schoolName && user && (
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
                aria-expanded={menuOpen}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-foreground hover:bg-muted lg:hidden"
              >
                {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            )}
          </div>
        </div>

        {schoolName && user && menuOpen && (
          <div className="border-t border-border bg-background/95 backdrop-blur-md lg:hidden">
            <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3 text-sm font-medium sm:px-6">
              {isAdmin ? (
                <MenuLink to="/admin" onClick={() => setMenuOpen(false)} icon={<ShieldCheck className="h-4 w-4" />}>
                  Administration
                </MenuLink>
              ) : (
                <>
                  <MenuLink to="/boutique" onClick={() => setMenuOpen(false)}>Boutique</MenuLink>
                  <MenuLink to="/enfants" onClick={() => setMenuOpen(false)}>Mes enfants</MenuLink>
                  <MenuLink to="/commandes" onClick={() => setMenuOpen(false)}>Mes commandes</MenuLink>
                  <div className="my-2 h-px bg-border" />
                  <MenuLink to="/famille" onClick={() => setMenuOpen(false)} icon={<User className="h-4 w-4" />}>
                    {familyLabel}
                  </MenuLink>
                </>
              )}
              <button
                type="button"
                onClick={() => { setMenuOpen(false); handleSignOut(); }}
                className="mt-1 inline-flex h-11 items-center gap-2 rounded-lg px-3 text-left text-foreground hover:bg-muted hover:text-[var(--rouge)]"
              >
                <LogOut className="h-4 w-4" /> Se déconnecter
              </button>
            </nav>
          </div>
        )}
      </header>
      {/* SchoolIdentityBar retiré : faisait doublon avec le header */}
    </>
  );
}

function MenuLink({
  to, onClick, icon, children,
}: { to: string; onClick: () => void; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="inline-flex h-11 items-center gap-2 rounded-lg px-3 text-foreground hover:bg-muted"
      activeProps={{ className: "bg-primary/10 text-primary" }}
    >
      {icon}
      <span className="truncate">{children}</span>
    </Link>
  );
}

export function SiteFooter() {
  const { isAdmin } = useStore();
  return (
    <footer className="mt-auto border-t border-border" style={{ background: "var(--gradient-hero)" }}>
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-8 text-white sm:px-6 sm:py-14 sm:gap-8 lg:grid-cols-4 lg:px-8">
        <div className="col-span-2 lg:col-span-2">
          <div className="flex items-center gap-3 sm:gap-4">
            <img src={sjcLogo} alt="Saint-Jacques-de-Compostelle" className="h-12 w-auto object-contain drop-shadow sm:h-16" />
            <div>
              <div className="text-sm font-semibold sm:text-base">Saint-Jacques-de-Compostelle</div>
              <div className="mt-0.5 text-[11px] text-white/70 sm:text-xs">Groupe scolaire catholique · Dax</div>
            </div>
          </div>
          <p className="mt-4 hidden max-w-md text-sm leading-relaxed text-white/80 sm:mt-5 sm:block">
            Boutique officielle des uniformes du groupe scolaire Saint-Jacques-de-Compostelle. Tenues validées par
            l'établissement, confectionnées avec soin pour le quotidien des élèves de la maternelle au collège.
          </p>
          <div className="mt-4 flex flex-col items-start gap-1.5 sm:mt-6 sm:gap-2">
            <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/60 sm:text-[11px]">Confectionné par</span>
            <img src={logoWhite} alt="France Uniformes" className="h-6 w-auto object-contain sm:h-8" loading="lazy" />
            <span className="text-[10px] uppercase tracking-[0.2em] text-white/60 sm:text-[11px]">Fabrication française</span>
          </div>
        </div>
        <div>
          <h4 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70 sm:text-xs">
            {isAdmin ? "Administration" : "Famille"}
          </h4>
          <ul className="mt-3 space-y-1.5 text-sm text-white/85 sm:mt-4 sm:space-y-2">
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
          <h4 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70 sm:text-xs">Aide</h4>
          <ul className="mt-3 space-y-1.5 text-sm text-white/85 sm:mt-4 sm:space-y-2">
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
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-1 px-4 py-3 text-[11px] text-white/70 sm:flex-row sm:gap-2 sm:px-6 sm:py-5 sm:text-xs lg:px-8">
          <span className="text-center">© {new Date().getFullYear()} France Uniformes · Tous droits réservés</span>
          <span>Paiement sécurisé</span>
        </div>
      </div>
    </footer>
  );
}
