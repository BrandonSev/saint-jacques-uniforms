import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Lock, ShieldCheck, User } from "lucide-react";
import sjcLogo from "@/assets/saint-jacques-logo.png";
import classeBlouses from "@/assets/enfants-classe-blouses.jpg";
import logoFU from "@/assets/france-uniformes-logo-blue.jpeg";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Espace familles — Saint-Jacques de Compostelle Dax" },
      {
        name: "description",
        content:
          "Connectez-vous à l'espace familles du Groupe scolaire Saint-Jacques de Compostelle pour commander vos uniformes.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left: form */}
      <div className="flex flex-col bg-background">
        <header className="flex items-center justify-between px-6 py-5 lg:px-10">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
            <ArrowLeft className="h-4 w-4" /> Changer d'établissement
          </Link>
          <div className="flex items-center gap-2">
            <img src={logoFU} alt="France Uniformes" className="h-7 w-7 rounded object-cover" />
            <span className="text-xs font-medium text-muted-foreground">France Uniformes</span>
          </div>
        </header>

        <div className="flex flex-1 items-center justify-center px-6 py-10 lg:px-10">
          <div className="w-full max-w-md">
            <div className="flex flex-col items-center text-center">
              <img
                src={sjcLogo}
                alt="Saint-Jacques de Compostelle"
                className="h-24 w-auto"
              />
              <span className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-primary">
                <ShieldCheck className="h-3 w-3" /> Espace sécurisé
              </span>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground">
                Espace familles
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Connectez-vous pour accéder à la boutique des uniformes
                <br />
                du Groupe scolaire Saint-Jacques de Compostelle.
              </p>
            </div>

            <form className="mt-10 space-y-5">
              <div>
                <label className="text-sm font-medium text-foreground">Nom de famille</label>
                <div className="relative mt-2">
                  <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Ex. Martin"
                    defaultValue="Martin"
                    className="h-12 w-full rounded-xl border border-input bg-card pl-10 pr-4 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-foreground">Mot de passe</label>
                  <button type="button" className="text-xs text-primary hover:underline">
                    Mot de passe oublié ?
                  </button>
                </div>
                <div className="relative mt-2">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    defaultValue="password"
                    className="h-12 w-full rounded-xl border border-input bg-card pl-10 pr-4 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15"
                  />
                </div>
              </div>

              <Link
                to="/niveau"
                className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground shadow-[var(--shadow-card)] transition-all hover:bg-primary/90"
              >
                Accéder à la boutique
              </Link>

              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs uppercase tracking-wider text-muted-foreground">ou</span>
                <div className="h-px flex-1 bg-border" />
              </div>

              <button
                type="button"
                className="inline-flex h-12 w-full items-center justify-center rounded-xl border border-border bg-card text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                Créer mon espace famille
              </button>
            </form>

            <p className="mt-8 text-center text-xs text-muted-foreground">
              En vous connectant, vous acceptez les{" "}
              <span className="text-primary">conditions générales</span> et notre{" "}
              <span className="text-primary">politique de confidentialité</span>.
            </p>
          </div>
        </div>
      </div>

      {/* Right: visual */}
      <div className="relative hidden lg:block">
        <img
          src={classeBlouses}
          alt="Élèves en classe portant la blouse officielle"
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-primary/85 via-primary/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-12 text-white">
          <blockquote className="max-w-md text-2xl font-light leading-snug">
            « Une démarche simple et rassurante pour équiper nos élèves chaque
            rentrée. »
          </blockquote>
          <p className="mt-4 text-sm text-white/80">
            — Direction du Groupe scolaire Saint-Jacques de Compostelle, Dax
          </p>
        </div>
      </div>
    </div>
  );
}