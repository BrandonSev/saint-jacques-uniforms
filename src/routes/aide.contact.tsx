import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { MapPin, Clock, Globe } from "lucide-react";
import { PageWatermark } from "@/components/PageWatermark";

export const Route = createFileRoute("/aide/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Saint-Jacques-de-Compostelle" },
      { name: "description", content: "Coordonnées de contact de l'établissement et de la boutique d'uniformes." },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <div className="relative flex min-h-screen flex-col bg-background/80">
      <PageWatermark />
      <SiteHeader schoolName="Saint-Jacques-de-Compostelle — Dax" />
      <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
        <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
          <span className="h-px w-6 bg-gold" /> Aide
        </span>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Contact établissement</h1>

        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          <Item icon={<MapPin className="h-5 w-5" />} title="Adresse">
            32 rue Paul Lahargou<br />
            40100 Dax
          </Item>
          <Item icon={<Clock className="h-5 w-5" />} title="Horaires">
            Lundi : 08:00–12:00, 13:30–17:30<br />
            Mardi : 08:00–12:00, 13:30–17:30<br />
            Mercredi : 08:00–12:00, 13:30–17:30<br />
            Jeudi : 08:00–12:00, 13:30–00:00<br />
            Vendredi : 00:00–07:50, 08:00–12:00, 13:30–17:00<br />
            Samedi : Fermé<br />
            Dimanche : Fermé
          </Item>
          <Item icon={<Globe className="h-5 w-5" />} title="Site Internet">
            <a href="https://sjdc-dax.fr" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">sjdc-dax.fr</a>
          </Item>
        </div>

        <Link to="/" className="mt-10 inline-flex h-11 items-center rounded-xl border border-border bg-card px-5 text-sm font-medium text-foreground hover:bg-muted">
          Retour à l'accueil
        </Link>
      </section>
      <SiteFooter />
    </div>
  );
}

function Item({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-border bg-card p-7 shadow-sm transition hover:shadow-md">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">{icon}</div>
      <h3 className="mt-4 text-base font-semibold text-foreground">{title}</h3>
      <div className="mt-2 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </div>
  );
}