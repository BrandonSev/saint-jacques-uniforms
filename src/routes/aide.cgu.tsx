import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { PageWatermark } from "@/components/PageWatermark";

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
    <div className="relative flex min-h-screen flex-col bg-background/80">
      <PageWatermark />
      <SiteHeader schoolName="Saint-Jacques-de-Compostelle — Dax" />
      <article className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
        <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
          <span className="h-px w-6 bg-gold" /> Légal
        </span>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Conditions générales</h1>
        <p className="mt-3 text-sm text-muted-foreground">Dernière mise à jour : mai 2026</p>

        <div className="prose prose-sm mt-8 max-w-none text-foreground/85">
          <h2 className="mt-8 text-lg font-semibold text-foreground">1. Éditeur de la plateforme</h2>
          <p className="mt-2 text-sm leading-relaxed">La présente boutique en ligne est éditée et exploitée par :</p>
          <p className="mt-2 text-sm leading-relaxed">
            <strong>France Uniformes (FU)</strong>
            <br />
            Société par Actions Simplifiée (SAS) au capital de 2 500 €<br />
            Siège social : 2 Rue Percheronne, 28000 Chartres
            <br />
            Immatriculée au RCS de Chartres sous le n° 983 587 932
            <br />
            SIRET : 983 587 932 00010
            <br />
            Numéro de TVA intracommunautaire : FR43983587932
            <br />
            Contact :{" "}
            <a href="mailto:info@franceuniforme.fr" className="text-primary hover:underline">
              info@franceuniforme.fr
            </a>
            <br />
            Délégué à la Protection des Données (DPO) :{" "}
            <a href="mailto:dpo@franceuniforme.fr" className="text-primary hover:underline">
              dpo@franceuniforme.fr
            </a>
          </p>
          <p className="mt-2 text-sm leading-relaxed">
            L'hébergement du site est assuré par <em>OVHcloud SAS — 2 Rue Kellermann, 59100 Roubaix, France</em>.
          </p>

          <h2 className="mt-6 text-lg font-semibold text-foreground">2. Objet et champ d'application</h2>
          <p className="mt-2 text-sm leading-relaxed">
            Les présentes Conditions Générales d'Utilisation (CGU) ont pour objet de définir les règles d'accès et
            d'utilisation de la plateforme de boutique en ligne des uniformes scolaires exploitée par France Uniformes
            pour le compte des établissements scolaires partenaires.
          </p>
          <p className="mt-2 text-sm leading-relaxed">
            Tout accès à la plateforme implique l'acceptation sans réserve des présentes CGU. France Uniformes se
            réserve le droit de les modifier à tout moment ; la version en vigueur est celle publiée en ligne à la date
            de connexion de l'utilisateur.
          </p>

          <h2 className="mt-6 text-lg font-semibold text-foreground">3. Accès à la plateforme</h2>
          <h3 className="mt-4 text-base font-semibold text-foreground">3.1 Conditions d'accès</h3>
          <p className="mt-2 text-sm leading-relaxed">
            L'accès à la boutique est strictement réservé aux familles des élèves scolarisés dans l'établissement
            partenaire concerné. Il nécessite :
          </p>
          <ul className="mt-2 list-disc pl-5 text-sm leading-relaxed">
            <li>La création d'un espace famille (compte utilisateur) ;</li>
            <li>
              La saisie d'un code d'établissement, communiqué par la direction ou l'association des parents d'élèves de
              l'établissement.
            </li>
          </ul>
          <h3 className="mt-4 text-base font-semibold text-foreground">3.2 Création du compte</h3>
          <p className="mt-2 text-sm leading-relaxed">
            L'utilisateur s'engage à fournir des informations exactes, complètes et à jour lors de la création de son
            compte, notamment : adresse e-mail valide, nom, prénom, et informations relatives aux enfants enregistrés
            (prénom, classe, mensurations le cas échéant).
          </p>
          <h3 className="mt-4 text-base font-semibold text-foreground">3.3 Confidentialité des identifiants</h3>
          <p className="mt-2 text-sm leading-relaxed">
            L'utilisateur est seul responsable de la confidentialité de ses identifiants de connexion (adresse e-mail et
            mot de passe). Toute utilisation du compte effectuée à partir de ses identifiants est réputée faite par lui.
            En cas de perte, vol ou utilisation frauduleuse suspectée, l'utilisateur doit en informer immédiatement
            France Uniformes à l'adresse{" "}
            <a href="mailto:info@franceuniforme.fr" className="text-primary hover:underline">
              info@franceuniforme.fr
            </a>
            .
          </p>
          <p className="mt-2 text-sm leading-relaxed">
            France Uniformes ne saurait être tenu responsable des conséquences d'un accès non autorisé résultant d'une
            négligence de l'utilisateur dans la conservation de ses identifiants.
          </p>

          <h2 className="mt-6 text-lg font-semibold text-foreground">4. Utilisation de la plateforme</h2>
          <h3 className="mt-4 text-base font-semibold text-foreground">4.1 Usage personnel et familial</h3>
          <p className="mt-2 text-sm leading-relaxed">
            La plateforme est destinée à un usage strictement personnel et familial. L'utilisateur s'interdit tout usage
            commercial, toute reproduction ou rediffusion des contenus sans autorisation préalable écrite de France
            Uniformes.
          </p>
          <h3 className="mt-4 text-base font-semibold text-foreground">4.2 Comportement de l'utilisateur</h3>
          <p className="mt-2 text-sm leading-relaxed">L'utilisateur s'engage à ne pas :</p>
          <ul className="mt-2 list-disc pl-5 text-sm leading-relaxed">
            <li>Tenter de contourner les mesures de sécurité ou d'accès de la plateforme ;</li>
            <li>
              Utiliser le code d'établissement à des fins non autorisées ou le transmettre à des tiers non concernés ;
            </li>
            <li>
              Introduire des programmes malveillants ou tout contenu portant atteinte au bon fonctionnement du site ;
            </li>
            <li>Fournir des informations fausses ou usurper l'identité d'un tiers.</li>
          </ul>
          <h3 className="mt-4 text-base font-semibold text-foreground">4.3 Disponibilité du service</h3>
          <p className="mt-2 text-sm leading-relaxed">
            France Uniformes s'efforce d'assurer la disponibilité de la plateforme 7j/7 et 24h/24, mais ne peut garantir
            une disponibilité ininterrompue. Des interruptions de service peuvent survenir pour raisons de maintenance,
            de mise à jour ou en cas de force majeure. France Uniformes ne saurait être tenu responsable des
            conséquences d'une indisponibilité temporaire du site.
          </p>

          <h2 className="mt-6 text-lg font-semibold text-foreground">
            5. Profils enfants et recommandations de tailles
          </h2>
          <p className="mt-2 text-sm leading-relaxed">
            La plateforme permet à l'utilisateur de créer des profils enfants incluant des données de mensurations (tour
            de poitrine, tour de taille, tour de hanches, hauteur) afin de générer des recommandations de tailles
            indicatives.
          </p>
          <p className="mt-2 text-sm leading-relaxed">
            Ces recommandations sont fournies à titre indicatif uniquement et ne constituent pas une garantie
            d'adéquation parfaite du vêtement. Elles s'appuient sur un barème de corps à nu adapté au type de vêtement
            commandé. France Uniformes recommande de mettre à jour régulièrement les mensurations de l'enfant afin que
            les recommandations restent pertinentes.
          </p>

          <h2 className="mt-6 text-lg font-semibold text-foreground">6. Propriété intellectuelle</h2>
          <p className="mt-2 text-sm leading-relaxed">
            L'ensemble des contenus présents sur la plateforme (textes, images, logos, graphismes, interface, structure)
            est la propriété exclusive de France Uniformes ou de ses partenaires et est protégé par les lois françaises
            et internationales relatives à la propriété intellectuelle.
          </p>
          <p className="mt-2 text-sm leading-relaxed">
            Toute reproduction, représentation, modification ou exploitation, totale ou partielle, sans autorisation
            préalable écrite de France Uniformes, est strictement interdite et constitue une contrefaçon sanctionnée par
            le Code de la propriété intellectuelle.
          </p>

          <h2 className="mt-6 text-lg font-semibold text-foreground">7. Liens hypertextes</h2>
          <p className="mt-2 text-sm leading-relaxed">
            La plateforme peut contenir des liens vers des sites tiers (établissements scolaires, partenaires). France
            Uniformes n'exerce aucun contrôle sur ces sites et décline toute responsabilité quant à leur contenu ou leur
            politique de confidentialité.
          </p>

          <h2 className="mt-6 text-lg font-semibold text-foreground">8. Responsabilité</h2>
          <p className="mt-2 text-sm leading-relaxed">
            France Uniformes met en œuvre tous les moyens raisonnables pour assurer un accès sécurisé à la plateforme et
            la fiabilité des informations présentées. Toutefois, France Uniformes ne saurait être tenu responsable :
          </p>
          <ul className="mt-2 list-disc pl-5 text-sm leading-relaxed">
            <li>Des dommages indirects liés à l'utilisation ou à l'impossibilité d'utiliser la plateforme ;</li>
            <li>Des erreurs ou omissions dans les contenus du site ;</li>
            <li>Des conséquences d'une utilisation non conforme aux présentes CGU.</li>
          </ul>

          <h2 className="mt-6 text-lg font-semibold text-foreground">9. Protection des données personnelles</h2>
          <p className="mt-2 text-sm leading-relaxed">
            France Uniformes collecte et traite des données personnelles dans le cadre de l'utilisation de la plateforme
            (données de compte famille, profils enfants, données de navigation). Ces traitements sont effectués
            conformément au Règlement Général sur la Protection des Données (RGPD — Règlement UE 2016/679) et à la loi
            Informatique et Libertés.
          </p>
          <p className="mt-2 text-sm leading-relaxed">
            Pour toute information sur la nature des données collectées, leur durée de conservation, les droits dont
            vous disposez (accès, rectification, suppression, portabilité, limitation, opposition) et les modalités pour
            les exercer, veuillez consulter notre{" "}
            <Link to="/aide/confidentialite" className="text-primary hover:underline">
              politique de confidentialité
            </Link>{" "}
            ou contacter notre Délégué à la Protection des Données :{" "}
            <a href="mailto:dpo@franceuniforme.fr" className="text-primary hover:underline">
              dpo@franceuniforme.fr
            </a>
            .
          </p>

          <h2 className="mt-6 text-lg font-semibold text-foreground">10. Cookies</h2>
          <p className="mt-2 text-sm leading-relaxed">
            La plateforme utilise uniquement des cookies techniques nécessaires à son bon fonctionnement (gestion de
            session, sécurité, panier). Aucun cookie publicitaire ou de traçage tiers n'est utilisé sans le consentement
            préalable de l'utilisateur.
          </p>

          <h2 className="mt-6 text-lg font-semibold text-foreground">11. Droit applicable et juridiction compétente</h2>
          <p className="mt-2 text-sm leading-relaxed">
            Les présentes CGU sont soumises au droit français. En cas de litige relatif à leur interprétation ou à leur
            exécution, et à défaut de résolution amiable, les tribunaux compétents du ressort du RCS de Chartres seront
            seuls compétents.
          </p>

          <h2 className="mt-6 text-lg font-semibold text-foreground">12. Contact</h2>
          <p className="mt-2 text-sm leading-relaxed">Pour toute question relative aux présentes CGU :</p>
          <p className="mt-2 text-sm leading-relaxed">
            📧{" "}
            <a href="mailto:info@franceuniforme.fr" className="text-primary hover:underline">
              info@franceuniforme.fr
            </a>
            <br />
            📍 France Uniformes — 2 Rue Percheronne, 28000 Chartres
          </p>
        </div>
      </article>
      <SiteFooter />
    </div>
  );
}
