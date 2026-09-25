import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { PageWatermark } from "@/components/PageWatermark";

export const Route = createFileRoute("/aide/confidentialite")({
  head: () => ({
    meta: [
      { title: "Politique de confidentialité — Saint-Jacques-de-Compostelle" },
      { name: "description", content: "Politique de protection des données personnelles." },
    ],
  }),
  component: ConfidentialitePage,
});

function ConfidentialitePage() {
  return (
    <div className="relative flex min-h-screen flex-col bg-background/80">
      <PageWatermark />
      <SiteHeader schoolName="Saint-Jacques-de-Compostelle — Dax" />
      <article className="mx-auto max-w-3xl px-4 pt-6 pb-14 sm:px-6 lg:px-8">
        <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
          <span className="h-px w-6 bg-gold" /> Légal
        </span>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Politique de confidentialité
        </h1>
        <div className="mt-8 space-y-8 text-sm leading-relaxed text-foreground/85">
          {/* Données collectées */}
          <section>
            <h2 className="text-base font-semibold text-foreground">Données collectées</h2>
            <p className="mt-2">
              Dans le cadre de l'utilisation de la plateforme boutique France Uniformes, nous collectons les données
              suivantes :
            </p>
            <ul className="mt-3 space-y-2 list-none">
              <li>
                <span className="font-medium text-foreground">Compte famille :</span> civilité, nom, prénom, adresse
                e-mail, numéro de téléphone, adresse postale
              </li>
              <li>
                <span className="font-medium text-foreground">Profils enfants :</span> prénom, classe, mensurations
                (tour de poitrine, tour de taille, tour de hanches, hauteur) utilisées pour générer des recommandations
                de tailles indicatives
              </li>
              <li>
                <span className="font-medium text-foreground">Données de commande :</span> articles commandés, tailles,
                historique d'achats, mode de livraison
              </li>
              <li>
                <span className="font-medium text-foreground">Données de navigation :</span> aucun cookie n'est utilisé
                — la session est gérée via le localStorage du navigateur
              </li>
            </ul>
          </section>

          {/* Finalités */}
          <section>
            <h2 className="text-base font-semibold text-foreground">Finalités et bases légales</h2>
            <div className="mt-3 overflow-hidden rounded-md border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="px-4 py-2.5 text-left font-semibold text-foreground">Finalité</th>
                    <th className="px-4 py-2.5 text-left font-semibold text-foreground">Base légale</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[
                    ["Gestion du compte famille et traitement des commandes", "Exécution du contrat"],
                    ["Livraison des articles", "Exécution du contrat"],
                    ["Service après-vente et réclamations", "Exécution du contrat"],
                    ["Respect des obligations comptables et fiscales", "Obligation légale"],
                    ["Sécurité et bon fonctionnement de la plateforme", "Intérêt légitime"],
                  ].map(([finalite, base]) => (
                    <tr key={finalite} className="even:bg-muted/20">
                      <td className="px-4 py-2.5">{finalite}</td>
                      <td className="px-4 py-2.5 text-foreground/70">{base}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Destinataires */}
          <section>
            <h2 className="text-base font-semibold text-foreground">Destinataires des données</h2>
            <p className="mt-2">
              Vos données sont traitées par France Uniformes et partagées uniquement avec les sous-traitants strictement
              nécessaires à l'exécution du service :
            </p>
            <ul className="mt-3 space-y-2 list-none">
              <li>
                <span className="font-medium text-foreground">OVHcloud SAS</span> (2 Rue Kellermann, 59100 Roubaix) —
                hébergement de la plateforme
              </li>
              <li>
                <span className="font-medium text-foreground">PayPlug</span> — traitement des paiements par carte
                bancaire (données bancaires non stockées par France Uniformes)
              </li>
            </ul>
            <p className="mt-3">
              Vos données ne sont jamais vendues ni transmises à des tiers à des fins commerciales.
            </p>
          </section>

          {/* Durée de conservation */}
          <section>
            <h2 className="text-base font-semibold text-foreground">Durée de conservation</h2>
            <ul className="mt-3 space-y-2 list-none">
              <li>
                <span className="font-medium text-foreground">Données de compte et de commande :</span> durée de la
                relation contractuelle + 3 ans après la dernière commande (délai de prescription)
              </li>
              <li>
                <span className="font-medium text-foreground">Données comptables :</span> 10 ans (obligation légale)
              </li>
            </ul>
          </section>

          {/* Cookies */}
          <section>
            <h2 className="text-base font-semibold text-foreground">Cookies</h2>
            <p className="mt-2">
              La plateforme n'utilise aucun cookie. La gestion de session est assurée par le localStorage du navigateur
              (stockage local), qui ne dépose rien sur votre appareil au sens de la réglementation cookies et ne
              transmet aucune donnée à des tiers.
            </p>
            <p className="mt-2">
              Si des cookies venaient à être mis en place à l'avenir (analyse d'audience, performance, etc.), vous en
              seriez informé préalablement et un mécanisme de consentement conforme aux recommandations de la CNIL vous
              serait proposé.
            </p>
          </section>

          {/* Vos droits */}
          <section>
            <h2 className="text-base font-semibold text-foreground">Vos droits</h2>
            <p className="mt-2">
              Conformément au RGPD (Règlement UE 2016/679) et à la loi Informatique et Libertés, vous disposez des
              droits suivants :
            </p>
            <ul className="mt-3 space-y-1.5 list-none">
              {[
                ["Accès", "obtenir une copie de vos données"],
                ["Rectification", "corriger des données inexactes"],
                ["Suppression", "demander l'effacement de vos données"],
                ["Portabilité", "recevoir vos données dans un format structuré"],
                ["Limitation", "restreindre temporairement leur traitement"],
                ["Opposition", "vous opposer à certains traitements"],
              ].map(([droit, desc]) => (
                <li key={droit}>
                  <span className="font-medium text-foreground">{droit} :</span> {desc}
                </li>
              ))}
            </ul>
            <p className="mt-4">
              Pour exercer ces droits :{" "}
              <a href="mailto:dpo@franceuniformes.fr" className="text-primary hover:underline">
                dpo@franceuniformes.fr
              </a>
            </p>
            <p className="mt-2">
              En cas de réclamation non résolue, vous pouvez saisir la CNIL :{" "}
              <a
                href="https://www.cnil.fr"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                www.cnil.fr
              </a>
            </p>
          </section>
        </div>
      </article>
      <SiteFooter />
    </div>
  );
}
