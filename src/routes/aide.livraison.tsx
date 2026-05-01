import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { Truck, Package, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/aide/livraison")({
  head: () => ({
    meta: [
      { title: "Livraisons — Saint-Jacques-de-Compostelle" },
      { name: "description", content: "Modalités de livraison pour les commandes d'uniformes." },
    ],
  }),
  component: LivraisonPage,
});

function LivraisonPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader schoolName="Saint-Jacques-de-Compostelle — Dax" />
      <section className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
        <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
          <span className="h-px w-6 bg-gold" /> Aide
        </span>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Livraisons</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Toutes les commandes sont préparées dans nos ateliers français et livrées directement à
          l'établissement Saint-Jacques-de-Compostelle.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          <Card icon={<Truck className="h-5 w-5" />} title="Délai" text="10 à 12 semaines après validation de la commande." />
          <Card icon={<Package className="h-5 w-5" />} title="Remise" text="Les tenues sont remises à votre enfant via l'établissement." />
          <Card icon={<RefreshCw className="h-5 w-5" />} title="Échange" text="SAV possible les 30 premiers jours. " />
        </div>

        <div className="mt-10 space-y-6 text-sm leading-relaxed text-foreground/80">
          <Block title="Modes de commande et de livraison">
            Toutes les tenues sont fabriquées en France. Deux modes de commande sont possibles :
            <br /><br />
            <strong>1. Commande groupée par l'établissement.</strong> Les familles enregistrent
            leur commande sur la plateforme. La commande est transmise à l'établissement et le
            règlement s'effectue selon les modalités définies par l'école. Les tenues sont
            livrées en lot à l'établissement puis remises aux familles via l'APEL.
            <br /><br />
            <strong>2. Commande individuelle.</strong> Les familles enregistrent et règlent leur
            commande directement en ligne. Deux options de retrait :
            <br />
            • <strong>Retrait à l'établissement</strong> lors de la prochaine livraison groupée
            (sans frais supplémentaires) ;
            <br />
            • <strong>Expédition individuelle au domicile</strong>, qui engage des frais
            supplémentaires d'emballage et de port.
          </Block>
          <Block title="Frais de livraison">
            La livraison à l'établissement est <strong>incluse</strong> pour toutes les commandes
            (groupées ou individuelles avec retrait sur place). Seules les expéditions
            individuelles au domicile engagent un <strong>surcoût</strong> de port et d'emballage,
            calculé au moment de la commande.
          </Block>
          <Block title="Retours et échanges">
            En cas de problème (malfaçon, erreur d'envoi, article manquant…), rendez-vous dans
            <strong> Mes commandes</strong>, ouvrez la commande concernée et cliquez sur
            <strong> « Déclarer un incident »</strong> à côté de l'article concerné. Vous pouvez
            sélectionner la quantité concernée (ex. 1 blouse sur 2), choisir le type d'incident
            puis décrire le problème. Selon le motif, votre demande pourra être prise en charge ou
            non. Aucun vêtement porté ne peut être retourné ni échangé. Dans tous les cas, les
            frais de retour sont à la charge de l'expéditeur.
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