import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { Truck, Package, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/aide/livraison")({
  head: () => ({
    meta: [
      { title: "Livraisons — Saint-Jacques de Compostelle" },
      { name: "description", content: "Modalités de livraison pour les commandes d'uniformes." },
    ],
  }),
  component: LivraisonPage,
});

function LivraisonPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader schoolName="Saint-Jacques de Compostelle — Dax" />
      <section className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
        <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
          <span className="h-px w-6 bg-gold" /> Aide
        </span>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Livraisons</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Toutes les commandes sont préparées dans nos ateliers français et livrées directement à
          l'établissement Saint-Jacques de Compostelle.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          <Card icon={<Truck className="h-5 w-5" />} title="Délai" text="5 à 7 jours ouvrés après validation de la commande." />
          <Card icon={<Package className="h-5 w-5" />} title="Remise" text="Les tenues sont remises à votre enfant via l'établissement." />
          <Card icon={<RefreshCw className="h-5 w-5" />} title="Échange" text="Échange de taille gratuit pendant 30 jours." />
        </div>

        <div className="mt-10 space-y-6 text-sm leading-relaxed text-foreground/80">
          <Block title="Mode de livraison">
            La livraison s'effectue exclusivement à l'établissement scolaire. Les commandes sont remises
            par notre équipe au secrétariat puis transmises aux familles par l'intermédiaire de l'école.
          </Block>
          <Block title="Frais de livraison">
            La livraison à l'établissement est <strong>incluse</strong> pour toutes les commandes.
          </Block>
          <Block title="Retours et échanges">
            En cas de problème de taille, un échange gratuit est possible dans les 30 jours suivant la
            réception. Le vêtement doit être propre, non porté et dans son emballage d'origine.
            Contactez-nous via la page Contact pour organiser l'échange.
          </Block>
        </div>

        <Link to="/" className="mt-10 inline-flex h-11 items-center rounded-xl border border-border bg-card px-5 text-sm font-medium text-foreground hover:bg-muted">
          Retour à l'accueil
        </Link>
      </section>
      <SiteFooter />
    </div>
  );
}

function Card({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">{icon}</div>
      <h3 className="mt-3 text-sm font-semibold text-foreground">{title}</h3>
      <p className="mt-1 text-xs text-muted-foreground">{text}</p>
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      <p className="mt-2">{children}</p>
    </div>
  );
}