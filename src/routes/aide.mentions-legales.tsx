import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { PageWatermark } from "@/components/PageWatermark";

export const Route = createFileRoute("/aide/mentions-legales")({
  head: () => ({
    meta: [
      { title: "Mentions légales — Saint-Jacques-de-Compostelle" },
      { name: "description", content: "Informations légales relatives à l'éditeur et à l'hébergeur du site." },
    ],
  }),
  component: MentionsPage,
});

function MentionsPage() {
  return (
    <div className="relative flex min-h-screen flex-col bg-background/80">
      <PageWatermark />
      <SiteHeader schoolName="Saint-Jacques-de-Compostelle — Dax" />
      <article className="mx-auto max-w-3xl px-4 pt-6 pb-14 sm:px-6 lg:px-8">
        <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
          <span className="h-px w-6 bg-gold" /> Légal
        </span>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Mentions légales</h1>
        <p className="mt-3 text-sm text-muted-foreground">Dernière mise à jour : mardi 19 mai 2026 (23:21)</p>

        <div className="prose prose-sm mt-8 max-w-none text-foreground/85">
          <h2 className="mt-8 text-lg font-semibold text-foreground">Éditeur du site</h2>
          <p className="mt-2 text-sm leading-relaxed">
            <strong>France Uniformes</strong>
            <br />
            Société par Actions Simplifiée (SAS) au capital de 2 500 €
            <br />
            Siège social : 2 Rue Percheronne, 28000 Chartres
            <br />
            RCS Chartres n° 983 587 932 — SIRET : 983 587 932 00010
            <br />
            TVA intracommunautaire : FR43983587932
            <br />
            Email :{" "}
            <a href="mailto:info@franceuniformes.fr" className="text-primary hover:underline">
              info@franceuniformes.fr
            </a>
          </p>

          <h2 className="mt-6 text-lg font-semibold text-foreground">Directeur de la publication</h2>
          <p className="mt-2 text-sm leading-relaxed">
            Paul Baudinet, Directeur Général de France Uniformes
          </p>

          <h2 className="mt-6 text-lg font-semibold text-foreground">Hébergement</h2>
          <p className="mt-2 text-sm leading-relaxed">
            <strong>OVHcloud SAS</strong>
            <br />
            2 Rue Kellermann, 59100 Roubaix, France
            <br />
            <a
              href="https://www.ovhcloud.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              www.ovhcloud.com
            </a>
          </p>

          <h2 className="mt-6 text-lg font-semibold text-foreground">Propriété intellectuelle</h2>
          <p className="mt-2 text-sm leading-relaxed">
            L'ensemble des contenus présents sur la plateforme (textes, images, logos, graphismes, interface, structure) est la propriété exclusive de France Uniformes ou de ses partenaires et est protégé par les lois françaises et internationales relatives à la propriété intellectuelle. Toute reproduction, représentation ou exploitation sans autorisation préalable écrite est strictement interdite.
          </p>

          <h2 className="mt-6 text-lg font-semibold text-foreground">Protection des données personnelles</h2>
          <p className="mt-2 text-sm leading-relaxed">
            Le traitement des données personnelles est décrit dans notre{" "}
            <Link to="/aide/confidentialite" className="text-primary underline hover:no-underline">
              Politique de confidentialité
            </Link>{" "}
            accessible sur cette plateforme. Pour toute question :{" "}
            <a href="mailto:dpo@franceuniformes.fr" className="text-primary hover:underline">
              dpo@franceuniformes.fr
            </a>
          </p>

          <h2 className="mt-6 text-lg font-semibold text-foreground">Médiation</h2>
          <p className="mt-2 text-sm leading-relaxed">
            En cas de litige lié à un achat, France Uniformes adhère au service de médiation du{" "}
            <strong>CM2C — Centre de la Médiation de la Consommation de Conciliateurs de justice</strong>, 49 rue de Ponthieu, 75008 Paris —{" "}
            <a
              href="https://www.cm2c.net"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              www.cm2c.net
            </a>
            .
          </p>
        </div>
      </article>
      <SiteFooter />
    </div>
  );
}
