import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";

export const Route = createFileRoute("/aide/cgu")({
  head: () => ({
    meta: [
      { title: "Conditions générales — Saint-Jacques-de-Compostelle" },
      { name: "description", content: "Conditions générales d'utilisation et de vente de la boutique d'uniformes." },
    ],
  }),
  component: CguPage,
});

function CguPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader schoolName="Saint-Jacques-de-Compostelle — Dax" />
      <article className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
        <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
          <span className="h-px w-6 bg-gold" /> Légal
        </span>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Conditions générales</h1>
        <p className="mt-3 text-sm text-muted-foreground">Dernière mise à jour : avril 2026</p>

        <div className="prose prose-sm mt-8 max-w-none text-foreground/85">
          <h2 className="mt-8 text-lg font-semibold text-foreground">1. Objet</h2>
          <p className="mt-2 text-sm leading-relaxed">
            Les présentes conditions générales régissent l'utilisation de la boutique en ligne des
            uniformes du Groupe scolaire Saint-Jacques-de-Compostelle, exploitée par France Uniformes.
          </p>

          <h2 className="mt-6 text-lg font-semibold text-foreground">2. Espace famille</h2>
          <p className="mt-2 text-sm leading-relaxed">
            L'accès à la boutique nécessite la création d'un espace famille. L'utilisateur s'engage à
            fournir des informations exactes et à conserver ses identifiants de connexion confidentiels.
          </p>

          <h2 className="mt-6 text-lg font-semibold text-foreground">3. Commandes</h2>
          <p className="mt-2 text-sm leading-relaxed">
            Les commandes sont enregistrées par la famille et transmises à l'établissement. Les tenues
            sont fabriquées en France et livrées directement à l'école.
          </p>

          <h2 className="mt-6 text-lg font-semibold text-foreground">4. Tarifs et paiement</h2>
          <p className="mt-2 text-sm leading-relaxed">
            Les prix sont indiqués en euros, TTC. Le paiement en ligne sera disponible prochainement ;
            d'ici là, les commandes sont enregistrées et facturées par l'établissement.
          </p>

          <h2 className="mt-6 text-lg font-semibold text-foreground">5. Données personnelles</h2>
          <p className="mt-2 text-sm leading-relaxed">
            Voir la <Link to="/aide/confidentialite" className="text-primary hover:underline">politique de confidentialité</Link>.
          </p>
        </div>
      </article>
      <SiteFooter />
    </div>
  );
}