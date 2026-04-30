import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { Mail, Phone, MapPin, Clock } from "lucide-react";

export const Route = createFileRoute("/aide/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Saint-Jacques de Compostelle" },
      { name: "description", content: "Coordonnées de contact de l'établissement et de la boutique d'uniformes." },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader schoolName="Saint-Jacques de Compostelle — Dax" />
      <section className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
        <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
          <span className="h-px w-6 bg-gold" /> Aide
        </span>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Contact établissement</h1>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <Item icon={<MapPin className="h-5 w-5" />} title="Adresse">
            2 rue Paul Lahargou<br />
            40100 Dax
          </Item>
          <Item icon={<Mail className="h-5 w-5" />} title="Email">
            <a href="mailto:boutique@franceuniformes.fr" className="text-primary hover:underline">boutique@franceuniformes.fr</a>
          </Item>
          <Item icon={<Clock className="h-5 w-5" />} title="Horaires">
            Lundi → vendredi<br />9h – 17h
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
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">{icon}</div>
      <h3 className="mt-3 text-sm font-semibold text-foreground">{title}</h3>
      <div className="mt-1 text-sm text-muted-foreground">{children}</div>
    </div>
  );
}