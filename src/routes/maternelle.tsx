import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, ShieldCheck, ArrowRight } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { ShellMotif } from "@/components/SchoolMotif";
import blouseProduct from "@/assets/blouse-bleue-officielle.jpeg";
import classeBlouses from "@/assets/classe-maternelle-blouses.jpg";

export const Route = createFileRoute("/maternelle")({
  head: () => ({
    meta: [
      { title: "Uniformes Maternelle & Élémentaire — Saint-Jacques de Compostelle" },
      {
        name: "description",
        content:
          "Sélection d'uniformes validée par l'établissement pour les élèves de maternelle et élémentaire.",
      },
    ],
  }),
  component: MaternelleListPage,
});

const products = [
  {
    id: "blouse-officielle",
    name: "Blouse scolaire officielle",
    ref: "SJC-BLS-2025",
    price: 30,
    image: blouseProduct,
    tag: "Officielle",
    desc: "Blouse bleu Riviera, col contrasté, écusson brodé. Tenue quotidienne portée par tous les élèves.",
    href: "/maternelle/blouse" as const,
  },
];

function MaternelleListPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader schoolName="Saint-Jacques de Compostelle — Dax" />

      <div className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl items-center gap-1.5 px-4 py-3 text-xs text-muted-foreground sm:px-6 lg:px-8">
          <Link to="/niveau" className="hover:text-primary">Boutique</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">Maternelle & Élémentaire (PS → CM1)</span>
        </div>
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border" style={{ background: "var(--gradient-soft)" }}>
        <div className="pointer-events-none absolute inset-0 text-primary">
          <ShellMotif className="absolute -left-32 -bottom-32 h-[480px] w-[480px]" opacity={0.05} />
        </div>
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:px-8">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary">
              <ShieldCheck className="h-3 w-3" /> Sélection validée par l'établissement
            </span>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Uniformes Maternelle & Élémentaire
            </h1>
            <p className="mt-3 max-w-xl leading-relaxed text-muted-foreground">
              Tenue officielle pour les classes de PS, MS, GS, CP, CE1, CE2, CM1.
              Portée au quotidien par tous les élèves.
            </p>
            <div className="mt-6 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full border border-border bg-card px-3 py-1.5 text-muted-foreground">1 produit</span>
              <span className="rounded-full border border-border bg-card px-3 py-1.5 text-muted-foreground">Tailles 3 → 10 ans</span>
              <span className="rounded-full border border-border bg-card px-3 py-1.5 text-muted-foreground">Livraison à l'école</span>
            </div>
          </div>
          <div className="relative h-64 overflow-hidden rounded-3xl border border-border lg:h-80">
            <img src={classeBlouses} alt="Élèves en blouse" className="h-full w-full object-cover" loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/40 to-transparent" />
          </div>
        </div>
      </section>

      {/* Products */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {products.map((p) => (
            <Link
              key={p.id}
              to={p.href}
              className="group flex flex-col overflow-hidden rounded-3xl border border-border bg-card transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-card)]"
            >
              <div className="relative aspect-square overflow-hidden" style={{ backgroundColor: "#f3edE0" }}>
                <img
                  src={p.image}
                  alt={p.name}
                  className="h-full w-full object-contain p-4 transition-transform duration-500 group-hover:scale-[1.03]"
                  loading="lazy"
                />
                <span className="absolute left-4 top-4 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary backdrop-blur">
                  {p.tag}
                </span>
              </div>
              <div className="flex flex-1 flex-col p-6">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="text-lg font-semibold tracking-tight text-foreground">{p.name}</h3>
                  <span className="text-lg font-semibold text-foreground">{p.price.toFixed(2)} €</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Réf. {p.ref}</p>
                <p className="mt-3 text-sm leading-relaxed text-foreground/75">{p.desc}</p>
                <div className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary text-sm font-semibold text-primary-foreground transition-all group-hover:gap-3">
                  Voir le produit <ArrowRight className="h-4 w-4" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}