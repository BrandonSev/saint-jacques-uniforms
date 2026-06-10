import * as React from "react";
import { Button, Text } from "@react-email/components";
import { EmailLayout, text, button } from "./_layout";
import type { TemplateEntry } from "./registry";

interface Props {
  civilite?: string;
  familyName?: string;
  appUrl?: string;
  customMessage?: string;
}

const APP_URL = "https://sjdc-dax.franceuniformes.fr";

function ApelReminder({ civilite, familyName, appUrl = APP_URL, customMessage }: Props) {
  return (
    <EmailLayout
      preview="Dernière possibilité de commander une blouse neuve pour votre enfant — avant clôture des garanties de livraison pour la rentrée 2026"
      title="Blouse scolaire de Dax — Vous n'avez pas encore passé commande !"
      familyName={familyName}
      signatureRole="boutique"
      disclaimer={<>Cet email vous est envoyé par <strong>France Uniformes</strong> pour le compte de votre établissement scolaire.<br />Si vous avez déjà passé commande, merci d'ignorer ce message.</>}
    >
      <Text style={text}>Bonjour{civilite ? ` ${civilite}` : ""},</Text>

      <Text style={text}>
        Nous vous remercions d'avoir créé votre compte famille sur la boutique des blouses de Saint‑Jacques de
        Compostelle de Dax (SJDC). À ce jour, nous n'avons toutefois pas reçu de commande de votre part.
      </Text>

      <Text style={text}>La période de <strong>précommande garantie</strong> est désormais terminée.</Text>

      <Text style={text}>
        Néanmoins, dans le cadre de la production en cours, les tissus déjà coupés nous permettent encore, <strong>sur
        certaines tailles</strong>, de produire quelques pièces pour la rentrée pour les familles n'ayant pas encore commandé de
        blouse pour leur(s) enfant(s), <strong>dans la limite des stocks disponibles indiqués par taille sur le site</strong>.
      </Text>

      <Text style={text}>
        👉 <strong>Pour commander, voici la dernière possibilité :</strong>
      </Text>

      <Text style={text}>
        Plus vous commandez tôt, plus nous avons de chances d'intégrer votre commande à la production. En revanche,{" "}
        <strong>nous ne pourrons pas garantir une livraison pour la rentrée pour les commandes trop tardives.</strong>
      </Text>

      <Text style={text}><strong>Pour finaliser votre commande :</strong></Text>

      <Text style={{ ...text, paddingLeft: "16px" }}>
        • Vérifiez que votre/vos enfant(s) sont bien ajoutés dans <strong>« Mes enfants »</strong>
      </Text>
      <Text style={{ ...text, paddingLeft: "16px" }}>
        • Renseignez leurs mensurations (pour obtenir la recommandation de taille)
      </Text>
      <Text style={{ ...text, paddingLeft: "16px" }}>
        • Sélectionnez la taille souhaitée, puis validez et payez la commande dès que possible.
      </Text>

      {customMessage && <Text style={text}>{customMessage}</Text>}

      <Button href={`${appUrl}/boutique`} style={button}>
        Commander maintenant
      </Button>

      <Text style={text}>
        Merci par avance pour votre compréhension et votre réactivité.
      </Text>

    </EmailLayout>
  );
}

export const template = {
  component: ApelReminder,
  subject: "Une blouse neuve pour votre enfant — rentrée scolaire 2026 à SJDC de DAX",
  displayName: "Relance France Uniformes (hors délai garanti)",
  previewData: {
    civilite: "Madame",
    familyName: "Dupont",
    appUrl: APP_URL,
  },
} satisfies TemplateEntry;
