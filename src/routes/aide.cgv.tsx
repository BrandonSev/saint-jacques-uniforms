import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { PageWatermark } from "@/components/PageWatermark";

export const Route = createFileRoute("/aide/cgv")({
  head: () => ({
    meta: [
      { title: "Conditions Générales de Vente — France Uniformes" },
      {
        name: "description",
        content:
          "Conditions Générales de Vente de France Uniformes : commande, paiement, livraison, retours et garanties.",
      },
      { property: "og:title", content: "Conditions Générales de Vente — France Uniformes" },
      {
        property: "og:description",
        content:
          "Conditions Générales de Vente applicables à toute commande passée sur la plateforme France Uniformes.",
      },
    ],
  }),
  component: CgvPage,
});

function CgvPage() {
  return (
    <div className="relative flex min-h-screen flex-col bg-background/80">
      <PageWatermark />
      <SiteHeader schoolName="Saint-Jacques-de-Compostelle — Dax" />
      <article className="mx-auto max-w-3xl px-4 pt-6 pb-14 sm:px-6 lg:px-8">
        <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
          <span className="h-px w-6 bg-gold" /> Légal
        </span>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Conditions Générales de Vente
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">Dernière mise à jour : mai 2026</p>

        <div className="prose prose-sm mt-8 max-w-none text-foreground/85">
          <h2 className="mt-8 text-lg font-semibold text-foreground">1. Vendeur</h2>
          <p className="mt-2 text-sm leading-relaxed">
            Les présentes Conditions Générales de Vente (CGV) régissent toute commande passée auprès de :
          </p>
          <p className="mt-2 text-sm leading-relaxed">
            <strong>France Uniformes (FU)</strong>
            <br />
            Société par Actions Simplifiée (SAS) au capital de 2 500 €<br />
            Siège social : 2 Rue Percheronne, 28000 Chartres
            <br />
            RCS Chartres n° 983 587 932 — SIRET 983 587 932 00010
            <br />
            TVA intracommunautaire : FR43 983 587 932 — Code NAF/APE 4791B
            <br />
            Contact :{" "}
            <a href="mailto:info@franceuniforme.fr" className="text-primary hover:underline">
              info@franceuniforme.fr
            </a>
          </p>

          <h2 className="mt-6 text-lg font-semibold text-foreground">2. Objet</h2>
          <p className="mt-2 text-sm leading-relaxed">
            Les présentes CGV définissent les droits et obligations des parties dans le cadre de la vente en ligne
            d'uniformes scolaires et accessoires proposés par France Uniformes pour le compte des établissements
            partenaires. Toute commande implique l'acceptation pleine et entière des présentes CGV.
          </p>

          <h2 className="mt-6 text-lg font-semibold text-foreground">3. Produits</h2>
          <p className="mt-2 text-sm leading-relaxed">
            Les produits proposés sont décrits avec la plus grande exactitude possible. Les photographies n'ont pas de
            valeur contractuelle. Les uniformes sont fabriqués en France selon les coupes et coloris définis avec chaque
            établissement.
          </p>

          <h2 className="mt-6 text-lg font-semibold text-foreground">4. Commande</h2>
          <p className="mt-2 text-sm leading-relaxed">
            Toute commande est validée après confirmation par e-mail à l'adresse renseignée par la famille. France
            Uniformes se réserve le droit d'annuler ou refuser toute commande émanant d'un client avec lequel existerait
            un litige relatif au paiement d'une commande antérieure.
          </p>

          <h2 className="mt-6 text-lg font-semibold text-foreground">5. Prix</h2>
          <p className="mt-2 text-sm leading-relaxed">
            Les prix sont indiqués en euros, toutes taxes comprises (TTC), hors frais de livraison. France Uniformes se
            réserve le droit de modifier ses prix à tout moment ; les produits sont facturés sur la base du tarif en
            vigueur au moment de la validation de la commande.
          </p>

          <h2 className="mt-6 text-lg font-semibold text-foreground">6. Paiement</h2>
          <p className="mt-2 text-sm leading-relaxed">
            Le paiement s'effectue en ligne par carte bancaire via un prestataire de paiement sécurisé. La commande
            n'est traitée qu'après encaissement effectif. Les données bancaires ne sont ni stockées ni traitées par
            France Uniformes.
          </p>

          <h2 className="mt-6 text-lg font-semibold text-foreground">7. Livraison</h2>
          <p className="mt-2 text-sm leading-relaxed">
            Les modalités, délais et frais de livraison sont précisés sur la page{" "}
            <Link to="/aide/livraison" className="text-primary underline hover:no-underline">
              Livraison
            </Link>
            . Les délais sont communiqués à titre indicatif. France Uniformes ne saurait être tenue responsable des
            retards imputables au transporteur ou à un cas de force majeure.
          </p>

          <h2 className="mt-6 text-lg font-semibold text-foreground">8. Droit de rétractation</h2>
          <p className="mt-2 text-sm leading-relaxed">
            Conformément à l'article L221-18 du Code de la consommation, le client dispose d'un délai de quatorze (14)
            jours à compter de la réception de sa commande pour exercer son droit de rétractation, sans avoir à
            justifier de motifs ni à payer de pénalités, à l'exception des frais de retour. Les articles personnalisés
            (broderie nominative, par exemple) ne peuvent faire l'objet d'une rétractation.
          </p>

          <h2 className="mt-6 text-lg font-semibold text-foreground">9. Retours et remboursements</h2>
          <p className="mt-2 text-sm leading-relaxed">
            Les articles retournés doivent être dans leur état d'origine, non portés, non lavés, avec leurs étiquettes.
            Le remboursement intervient dans un délai maximum de 14 jours après réception et contrôle des articles
            retournés.
          </p>

          <h2 className="mt-6 text-lg font-semibold text-foreground">10. Garanties</h2>
          <p className="mt-2 text-sm leading-relaxed">
            Tous les produits bénéficient de la garantie légale de conformité (articles L217-3 et suivants du Code de la
            consommation) et de la garantie contre les vices cachés (articles 1641 et suivants du Code civil).
          </p>

          <h2 className="mt-6 text-lg font-semibold text-foreground">11. Responsabilité</h2>
          <p className="mt-2 text-sm leading-relaxed">
            La responsabilité de France Uniformes ne saurait être engagée pour tout dommage résultant d'un mauvais
            entretien des articles ou d'un usage non conforme à leur destination.
          </p>

          <h2 className="mt-6 text-lg font-semibold text-foreground">12. Données personnelles</h2>
          <p className="mt-2 text-sm leading-relaxed">
            Les données collectées dans le cadre de la commande sont traitées conformément à notre{" "}
            <Link to="/aide/confidentialite" className="text-primary underline hover:no-underline">
              Politique de confidentialité
            </Link>
            .
          </p>

          <h2 className="mt-6 text-lg font-semibold text-foreground">13. Droit applicable et litiges</h2>
          <p className="mt-2 text-sm leading-relaxed">
            Les présentes CGV sont soumises au droit français. En cas de litige, une solution amiable sera recherchée
            avant toute action judiciaire. À défaut, les tribunaux français seront seuls compétents. Conformément à
            l'article L612-1 du Code de la consommation, le client peut recourir gratuitement au service de médiation
            de la consommation.
          </p>
          <p className="mt-3 text-sm leading-relaxed">
            Conformément aux dispositions du Code de la consommation concernant « le processus de médiation des
            litiges de la consommation », après nous avoir sollicités et à défaut de réponse vous satisfaisant, vous
            avez la possibilité de recourir gratuitement à une procédure de médiation de la consommation auprès de :
          </p>
          <p className="mt-2 text-sm leading-relaxed">
            <strong>CM2C</strong>
            <br />
            49 rue de Ponthieu
            <br />
            75008 Paris
            <br />
            Tél. :{" "}
            <a href="tel:+33189470014" className="text-primary hover:underline">
              01 89 47 00 14
            </a>
            <br />
            Site internet :{" "}
            <a
              href="https://www.cm2c.net/declarer-un-litige.php"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              www.cm2c.net/declarer-un-litige.php
            </a>
            <br />
            E-mail :{" "}
            <a href="mailto:litiges@cm2c.net" className="text-primary hover:underline">
              litiges@cm2c.net
            </a>
          </p>

          <p className="mt-8 text-sm leading-relaxed">
            Pour toute question, contactez-nous à{" "}
            <a href="mailto:info@franceuniforme.fr" className="text-primary hover:underline">
              info@franceuniforme.fr
            </a>
            .
          </p>
        </div>
      </article>
      <SiteFooter />
    </div>
  );
}
