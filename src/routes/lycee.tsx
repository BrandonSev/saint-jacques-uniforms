import { createFileRoute, Link } from "@tanstack/react-router";
import { RequireAuth } from "@/components/RequireAuth";
import { ChevronRight, CreditCard, ShieldCheck } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import lycee from "@/assets/lycee-uniformes.jpg";
import { PageWatermark } from "@/components/PageWatermark";

export const Route = createFileRoute("/lycee")({
  head: () => ({
    meta: [{ title: "Uniformes lycée — Saint-Jacques-de-Compostelle" }],
  }),
  component: () => (
    <RequireAuth>
      <LyceePage />
    </RequireAuth>
  ),
});

function LyceePage() {
  return (
    <div className="relative flex min-h-screen flex-col bg-background/80">
      <PageWatermark />
      <SiteHeader schoolName="Saint-Jacques-de-Compostelle — Dax" />
      <div className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl items-center gap-1.5 px-4 py-3 text-xs text-muted-foreground sm:px-6 lg:px-8">
          <Link to="/boutique" className="hover:text-primary">Boutique</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">Lycée (3ᵉ → Terminale)</span>
        </div>
      </div>
      <section className="mx-auto max-w-5xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <div className="mx-auto mb-10 max-w-3xl overflow-hidden rounded-3xl border border-border">
          <img src={lycee} alt="Lycéens en uniforme" className="aspect-[16/9] w-full object-cover" loading="lazy" />
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary">
          <ShieldCheck className="h-3 w-3" /> Prochainement !
        </span>
        <div className="mt-3 flex justify-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--teal)]/30 bg-[var(--teal)]/10 px-3 py-1.5 text-xs font-semibold text-[var(--teal-deep)]">
            <CreditCard className="h-3 w-3" /> Paiement en ligne sécurisé
          </span>
        </div>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Lycée — Prochainement !
        </h1>
        <p className="mx-auto mt-4 max-w-xl leading-relaxed text-muted-foreground">
          Il n'y a pas d'uniformes au lycée actuellement. Les élèves de 3ᵉ sont
          rattachés à cette section. Les familles seront informées par mail si
          une sélection venait à être proposée.
        </p>
        <Link
          to="/boutique"
          className="mt-8 inline-flex h-12 items-center justify-center rounded-xl border border-border bg-card px-6 text-sm font-medium text-foreground hover:bg-muted"
        >
          Retour à la boutique
        </Link>
      </section>
      <SiteFooter />
    </div>
  );
}