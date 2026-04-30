import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { ArrowRight, MapPin, ShieldCheck, Truck } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { ShellMotif } from "@/components/SchoolMotif";
import { useStore } from "@/lib/store";
import classeBlouses from "@/assets/enfants-classe-blouses.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Boutique Saint-Jacques de Compostelle — Dax" },
      {
        name: "description",
        content:
          "Espace familles officiel du Groupe Saint-Jacques de Compostelle de Dax. Commandez les uniformes scolaires de la maternelle au lycée.",
      },
      { property: "og:title", content: "Boutique Saint-Jacques de Compostelle — Dax" },
      {
        property: "og:description",
        content: "Espace familles officiel — commandez les uniformes du Groupe Saint-Jacques de Compostelle, Dax.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const { user, isAdmin, authLoading } = useStore();
  if (authLoading) return null;
  if (user && isAdmin) return <Navigate to="/admin" />;
  if (user) return <Navigate to="/boutique" />;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader schoolName="Saint-Jacques de Compostelle — Dax" />

      {/* Hero */}
      <section className="relative overflow-hidden bg-primary">
        <div className="absolute inset-0 -z-10" style={{ background: "var(--gradient-hero)" }} />
        <div className="absolute inset-0 -z-10 opacity-25 mix-blend-overlay">
          <img src={classeBlouses} alt="" className="h-full w-full object-cover" loading="eager" />
        </div>
        <div className="absolute inset-0 -z-10 bg-primary-deep/70" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-primary-deep/80 via-primary-deep/60 to-primary-deep/40" />
        <div className="pointer-events-none absolute inset-0 -z-10 text-white">
          <ShellMotif className="absolute -left-40 -top-32 h-[700px] w-[700px]" opacity={0.1} />
          <ShellMotif className="absolute -right-48 -bottom-48 h-[700px] w-[700px]" opacity={0.08} />
        </div>
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_1fr]">
            <div className="text-center lg:text-left">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.18em] text-white backdrop-blur">
                <ShieldCheck className="h-3.5 w-3.5" /> Espace familles officiel
              </span>
              <h1 className="mt-6 text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-[3.4rem] lg:leading-[1.05]">
                Boutique des uniformes — Saint-Jacques de Compostelle
              </h1>
              <div className="mt-5 h-px w-16 bg-gold mx-auto lg:mx-0" />
              <p className="mt-5 max-w-xl text-base leading-relaxed text-white/85 sm:text-lg mx-auto lg:mx-0">
                Bienvenue sur l'espace familles du Groupe Saint-Jacques de Compostelle de Dax. Commandez les tenues
                officielles de la maternelle au lycée en quelques clics.
              </p>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
                <Link
                  to="/login"
                  className="inline-flex h-12 items-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-primary shadow-xl transition-all hover:gap-3"
                >
                  Accéder à mon espace famille <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/boutique"
                  className="inline-flex h-12 items-center gap-2 rounded-full border border-white/30 bg-white/10 px-6 text-sm font-semibold text-white backdrop-blur transition-colors hover:bg-white/20"
                >
                  Découvrir la boutique
                </Link>
              </div>
            </div>

            <div className="relative hidden lg:block">
              <div className="relative overflow-hidden rounded-3xl border border-white/20 shadow-2xl">
                <img
                  src={classeBlouses}
                  alt="Élèves en blouse"
                  className="aspect-[4/5] w-full object-cover"
                  loading="eager"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-primary-deep/85 via-primary-deep/30 to-transparent p-6">
                  <div className="text-[10px] font-medium uppercase tracking-[0.22em] text-white/75">
                    Rentrée 2026-2027
                  </div>
                  <div className="mt-1 text-base font-semibold text-white">
                    Tenues officielles validées par les établissements
                  </div>
                </div>
              </div>
              <div className="absolute -right-4 -top-4 h-20 w-20 rounded-2xl border-2 border-gold/70 bg-white/10 backdrop-blur" />
              <div className="absolute -left-3 bottom-10 h-12 w-12 rounded-full bg-gold/90" />
            </div>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-t border-border bg-card">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:grid-cols-3 sm:px-6 lg:px-8">
          <TrustItem
            icon={<ShieldCheck className="h-5 w-5" />}
            title="Tenues validées par l'établissement"
            text="Chaque produit est référencé en accord avec la direction de l'école."
          />
          <TrustItem
            icon={<Truck className="h-5 w-5" />}
            title="Livraison à l'école ou directement à la maison"
            text="Vos commandes sont remises dans le cartable de votre enfant ou expédiées à votre domicile."
          />
          <TrustItem
            icon={<MapPin className="h-5 w-5" />}
            title="Fabrication française"
            text="Dans nos ateliers répartis partout en France."
          />
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

function TrustItem({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="flex gap-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        {icon}
      </div>
      <div>
        <h4 className="text-sm font-semibold text-foreground">{title}</h4>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{text}</p>
      </div>
    </div>
  );
}
