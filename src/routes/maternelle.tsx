import { createFileRoute, Link } from "@tanstack/react-router";
import { RequireAuth } from "@/components/RequireAuth";
import { ChevronRight, CreditCard, ShieldCheck } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { ShellMotif } from "@/components/SchoolMotif";
import { ProductCard } from "@/components/ProductCard";
import blouseProduct from "@/assets/blouse-bleue-officielle.jpeg";
import classeBlouses from "@/assets/elementaire-hero.jpg";
import courMaternelle from "@/assets/maternelle-cour-blouses.jpg";
import margueritePortrait from "@/assets/marguerite-de-perignon.jpg";
import { PageWatermark } from "@/components/PageWatermark";
import { HeadteacherQuote } from "@/components/HeadteacherQuote";

export const Route = createFileRoute("/maternelle")({
  head: () => ({
    meta: [
      { title: "Uniformes Maternelle & Élémentaire — Saint-Jacques-de-Compostelle" },
      {
        name: "description",
        content:
          "Sélection d'uniformes validée par l'établissement pour les élèves de maternelle et d'élémentaire (PS, MS, GS, CP, CE1, CE2, CM1).",
      },
    ],
  }),
  component: () => (
    <RequireAuth>
      <MaternelleListPage />
    </RequireAuth>
  ),
});

const sizes = ["3 ans", "4 ans", "6 ans", "8 ans", "10 ans", "12 ans", "14 ans", "16 ans", "18 ans"];

const products = [
  {
    id: "blouse-officielle",
    name: "Blouse scolaire officielle SJDC",
    ref: "Riviera Dax",
    price: 30,
    image: blouseProduct,
    tag: "Officielle",
    desc: "Blouse de couleur bleu Riviera, boutons pressions jaunes, col biais, écusson brodé sur le coeur.",
    href: "/blouse-officielle" as const,
    genre: "Unisexe" as const,
    productKind: "blouse" as const,
  },
];

function MaternelleListPage() {
  return (
    <div className="relative flex min-h-screen flex-col bg-background/80">
      <PageWatermark />
      <SiteHeader schoolName="Saint-Jacques-de-Compostelle — Dax" />

      <div className="border-b border-border bg-card">
        <div className="mx-auto max-w-6xl flex w-full items-center gap-1.5 px-4 py-3 text-xs text-muted-foreground sm:px-6 lg:px-8">
          <Link to="/boutique" className="hover:text-primary">
            Boutique
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">Maternelle & Élémentaire (PS · MS · GS · CP · CE1 · CE2 · CM1)</span>
        </div>
      </div>

      {/* Hero */}
      <section
        className="relative overflow-hidden border-b border-border"
        style={{ background: "var(--gradient-soft)" }}
      >
        <div className="pointer-events-none absolute inset-0 text-primary">
          <ShellMotif className="absolute -left-32 -bottom-32 h-[480px] w-[480px]" opacity={0.05} />
        </div>
        <div className="relative mx-auto max-w-6xl grid w-full items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:px-8">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
              <ShieldCheck className="h-3 w-3" /> Tenue officielle de l'établissement
            </span>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Maternelle & Élémentaire
            </h1>
            <p className="mt-3 max-w-xl leading-relaxed text-muted-foreground">
              Tenue officielle pour les classes de PS, MS, GS, CP, CE1, CE2 et CM1. Portée au quotidien par tous les
              élèves.
            </p>
            <div className="mt-6 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full border border-border bg-card px-3 py-1.5 text-muted-foreground">
                Blouse
              </span>
              <span className="rounded-full border border-border bg-card px-3 py-1.5 text-muted-foreground">
                Tailles 4 → 18 ans
              </span>
              <span className="rounded-full border border-border bg-card px-3 py-1.5 text-muted-foreground">
                Livraison à l'établissement
              </span>
              <span className="rounded-full border border-border bg-card px-3 py-1.5 text-muted-foreground">
                Livraison à domicile
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--teal)]/30 bg-[var(--teal)]/10 px-3 py-1.5 font-semibold text-[var(--teal-deep)]">
                <CreditCard className="h-3 w-3" /> Paiement en ligne sécurisé
              </span>
            </div>
          </div>
          <div className="relative h-64 overflow-hidden rounded-3xl border border-border lg:h-80">
            <img src={classeBlouses} alt="Élèves en blouse" className="h-full w-full object-cover" loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/40 to-transparent" />
          </div>
        </div>
      </section>

      {/* Products */}
      <section className="mx-auto max-w-6xl w-full px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,420px)_1fr]">
          <div>
            {products.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                sizes={sizes}
                defaultSize="6 ans"
                childFilter={(c) => c.section === "Maternelle" || c.section === "Élémentaire"}
              />
            ))}
          </div>
          <div className="flex-col gap-6 flex">
            <div className="relative overflow-hidden rounded-3xl border border-border shadow-[var(--shadow-card)] aspect-[2.36]">
              <img
                src={courMaternelle}
                alt="Élèves de maternelle en blouse SJDC dans la cour de récréation"
                className="h-full w-full object-cover"
                loading="lazy"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-foreground/90 via-foreground/60 sm:via-foreground/30 to-foreground/20 sm:to-transparent" />
              <span className="absolute top-4 left-4 sm:left-8 inline-flex items-center gap-1.5 rounded-full bg-card/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary backdrop-blur">
                Dès l'École maternelle... jusqu'au CM1
              </span>
              <div className="absolute inset-x-0 bottom-0 p-4 sm:p-8 sm:pb-4">
                <h2 className="mt-2 max-w-md text-lg sm:text-2xl font-semibold tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                  Portée fièrement chaque jour
                </h2>
                <p className="mt-1.5 max-w-md text-[11px] sm:text-sm leading-snug sm:leading-relaxed text-white/95 drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">
                  Confort, identité et sentiment d'appartenance — pensée pour accompagner les enfants de la petite
                  section jusqu'au CM1.
                </p>
              </div>
            </div>

            {/* Mot de la cheffe d'établissement — condensé */}
            <HeadteacherQuote
              quote="Dans le cadre de la vie scolaire et afin de favoriser un climat propice au travail, le port de la blouse pour les élèves nous semble important. <br/>
Cette blouse présente plusieurs avantages : elle permet de protéger les vêtements, de réduire les inégalités visibles entre les élèves et de renforcer le sentiment d’appartenance à l’école.<br/> Nous avons choisi un tissu de qualité afin que la blouse soit confortable et adaptée aux activités scolaires.<br/>Merci de la marquer au nom de votre enfant."
            />
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
