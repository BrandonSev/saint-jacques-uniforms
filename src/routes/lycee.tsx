import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, ShieldCheck } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import lycee from "@/assets/lycee-uniformes.jpg";

export const Route = createFileRoute("/lycee")({
  head: () => ({
    meta: [{ title: "Uniformes lycée — Saint-Jacques de Compostelle" }],
  }),
  component: LyceePage,
});

function LyceePage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader schoolName="Saint-Jacques de Compostelle — Dax" />
      <div className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl items-center gap-1.5 px-4 py-3 text-xs text-muted-foreground sm:px-6 lg:px-8">
          <Link to="/niveau" className="hover:text-primary">Boutique</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">Lycée</span>
        </div>
      </div>
      <section className="mx-auto max-w-5xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <div className="mx-auto mb-10 max-w-3xl overflow-hidden rounded-3xl border border-border">
          <img src={lycee} alt="Lycéens en uniforme" className="aspect-[16/9] w-full object-cover" loading="lazy" />
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary">
          <ShieldCheck className="h-3 w-3" /> Bientôt disponible
        </span>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Uniformes lycée
        </h1>
        <p className="mx-auto mt-4 max-w-xl leading-relaxed text-muted-foreground">
          La sélection lycée arrive prochainement. Les familles seront informées par
          mail dès l'ouverture de la boutique.
        </p>
        <Link
          to="/niveau"
          className="mt-8 inline-flex h-12 items-center justify-center rounded-xl border border-border bg-card px-6 text-sm font-medium text-foreground hover:bg-muted"
        >
          Retour à la boutique
        </Link>
      </section>
      <SiteFooter />
    </div>
  );
}