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

const sizes = ["4 ans", "6 ans", "8 ans", "10 ans", "12 ans", "14 ans", "16 ans", "18 ans"];

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
  },
];

function MaternelleListPage() {
  return (
    <div className="relative flex min-h-screen flex-col bg-background/80">
      <PageWatermark />
      <SiteHeader schoolName="Saint-Jacques-de-Compostelle — Dax" />

      <div className="border-b border-border bg-card">
        <div className="mx-auto flex w-full items-center gap-1.5 px-4 py-3 text-xs text-muted-foreground sm:px-6 lg:px-8">
          <Link to="/boutique" className="hover:text-primary">Boutique</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">Maternelle & Élémentaire (PS · MS · GS · CP · CE1 · CE2 · CM1)</span>
        </div>
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border" style={{ background: "var(--gradient-soft)" }}>
        <div className="pointer-events-none absolute inset-0 text-primary">
          <ShellMotif className="absolute -left-32 -bottom-32 h-[480px] w-[480px]" opacity={0.05} />
        </div>
        <div className="relative mx-auto grid w-full items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:px-8">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-semibold uppercase tracking-wider text-sm text-lime-400 bg-red-500">
              <ShieldCheck className="h-3 w-3" /> SÉLECTION EN COURS D'ETUDE PAR L'ÉTABLISSEMENT
            </span>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Maternelle & Élémentaire
            </h1>
            <p className="mt-3 max-w-xl leading-relaxed text-muted-foreground">
              Tenue officielle pour les classes de PS, MS, GS, CP, CE1, CE2 et CM1.
              Portée au quotidien par tous les élèves.
            </p>
            <div className="mt-6 flex flex-wrap gap-2 text-xs">
               <span className="rounded-full border border-border bg-card px-3 py-1.5 text-muted-foreground">Blouse</span>
              <span className="rounded-full border border-border bg-card px-3 py-1.5 text-muted-foreground">Tailles 4 → 18 ans</span>
              <span className="rounded-full border border-border bg-card px-3 py-1.5 text-muted-foreground">Livraison à l'établissement</span>
              <span className="rounded-full border border-border bg-card px-3 py-1.5 text-muted-foreground">Livraison à domicile</span>
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
      <section className="mx-auto w-full px-4 py-12 sm:px-6 lg:px-8">
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
          <div className="hidden flex-col gap-6 lg:flex">
            <div className="relative overflow-hidden rounded-3xl border border-border shadow-[var(--shadow-card)] aspect-[16/7]">
              <img
                src={courMaternelle}
                alt="Élèves de maternelle en blouse SJDC dans la cour de récréation"
                className="h-full w-full"
                loading="lazy"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-foreground/50 via-transparent to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-card/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary backdrop-blur">
                  École maternelle
                </span>
                <h2 className="mt-2 max-w-md text-2xl font-semibold tracking-tight text-white drop-shadow">
                  Portée fièrement chaque jour
                </h2>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-white/90 drop-shadow">
                  Confort, identité et sentiment d'appartenance — pensée pour accompagner
                  les enfants de la PS au CM1.
                </p>
              </div>
            </div>

            {/* Mot de la cheffe d'établissement — condensé */}
            <figure className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
            <div className="flex flex-col gap-0 sm:flex-row sm:items-stretch">
              <img
                src={margueritePortrait}
                alt="Marguerite de Pérignon, Cheffe d'établissement du 1er degré"
                className="h-40 w-full object-cover sm:h-auto sm:w-40 sm:shrink-0"
                loading="lazy"
              />
              <div className="flex flex-col justify-center gap-3 p-5 sm:p-6">
                <span className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.16em] text-primary">
                  Mot de la cheffe d'établissement — 1er degré
                </span>
                <blockquote className="font-display text-sm leading-relaxed text-foreground sm:text-base">
                  « J'ai choisi avec soin la couleur bleu Riviera et chaque détail de cette
                  blouse pour qu'elle accompagne nos élèves avec élégance et fierté. »
                </blockquote>
                <figcaption className="flex items-center gap-2.5">
                  <span className="h-px w-8 bg-gold" />
                  <div>
                    <div className="text-xs font-semibold text-foreground">Marguerite de Pérignon</div>
                    <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                      Cheffe d'établissement · 1er degré
                    </div>
                  </div>
                </figcaption>
              </div>
            </div>
            </figure>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
