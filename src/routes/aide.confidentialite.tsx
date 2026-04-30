import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";

export const Route = createFileRoute("/aide/confidentialite")({
  head: () => ({
    meta: [
      { title: "Politique de confidentialité — Saint-Jacques de Compostelle" },
      { name: "description", content: "Politique de protection des données personnelles." },
    ],
  }),
  component: ConfidentialitePage,
});

function ConfidentialitePage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader schoolName="Saint-Jacques de Compostelle — Dax" />
      <article className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
        <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
          <span className="h-px w-6 bg-gold" /> Légal
        </span>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Politique de confidentialité</h1>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-foreground/85">
          <section>
            <h2 className="text-base font-semibold text-foreground">Données collectées</h2>
            <p className="mt-2">
              Lors de la création de votre espace famille, nous collectons : civilité, nom, prénom,
              email, téléphone, adresse postale, ainsi que les informations relatives aux enfants
              scolarisés (prénom, nom, classe, mensurations).
            </p>
          </section>
          <section>
            <h2 className="text-base font-semibold text-foreground">Finalités</h2>
            <p className="mt-2">
              Ces données servent uniquement à la gestion de votre espace famille, à la préparation et
              à la livraison de vos commandes d'uniformes. Elles ne sont jamais transmises à des tiers
              à des fins commerciales.
            </p>
          </section>
          <section>
            <h2 className="text-base font-semibold text-foreground">Durée de conservation</h2>
            <p className="mt-2">
              Les données sont conservées pendant la durée de la scolarité de votre enfant et jusqu'à
              3 ans après la dernière commande, à des fins de suivi comptable.
            </p>
          </section>
          <section>
            <h2 className="text-base font-semibold text-foreground">Vos droits</h2>
            <p className="mt-2">
              Conformément au RGPD, vous pouvez accéder, rectifier ou supprimer vos données en
              contactant : <a href="mailto:rgpd@france-uniformes.fr" className="text-primary hover:underline">rgpd@france-uniformes.fr</a>.
            </p>
          </section>
        </div>
      </article>
      <SiteFooter />
    </div>
  );
}