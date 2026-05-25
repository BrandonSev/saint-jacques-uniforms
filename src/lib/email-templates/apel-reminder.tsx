import * as React from "react";
import { Button, Text } from "@react-email/components";
import { EmailLayout, text, muted, button } from "./_layout";
import type { TemplateEntry } from "./registry";

interface Props {
  civilite?: string;
  familyName?: string;
  deadline?: string;
  appUrl?: string;
  customMessage?: string;
}

const APP_URL = "https://sjdc-dax.franceuniformes.fr";

function ApelReminder({
  civilite,
  familyName,
  deadline = "ce dimanche 24 mai 2026 (23h59)",
  appUrl = APP_URL,
  customMessage,
}: Props) {
  return (
    <EmailLayout
      preview="Pensez à commander les blouses de votre enfant dès maintenant pour la rentrée"
      title="Profitez d’une prolongation du délai pour commander vos blouses scolaires"
      familyName={familyName}
      signatureRole="boutique"
    >
      <Text style={text}>Bonjour {civilite || ""},</Text>

      <Text style={text}>
        Nous vous remercions d'avoir créé votre espace famille sur le site de la boutique du groupe scolaire
        Saint-Jacques-de-Compostelle de Dax.
      </Text>

      <Text style={text}>
        Nous vous rappelons que vous n'avez pas encore passé commande des blouses de votre enfant.
      </Text>

      <Text style={text}>
        Nous avons exceptionnellement prolongé la possibilité de commander en ce lundi de Pentecôte. <br />
        Ainsi, afin de vous garantir une fabrication et une livraison pour la rentrée de septembre, nous vous invitons à
        passer commande dès que possible avant ce soir : <strong>lundi 25 mai 2026 à minuit.</strong>
      </Text>

      {customMessage && <Text style={text}>{customMessage}</Text>}

      <Button href={`${appUrl}/boutique`} style={button}>
        Commander maintenant
      </Button>

      <Text style={text}>Nous vous remercions par avance et restons à votre disposition pour toute question.</Text>

      <Text style={muted}>
        Cet email vous est envoyé par <strong>France Uniformes</strong> pour le compte de votre établissement scolaire.
        <br />
        Si vous avez déjà passé commande, merci d'ignorer ce message.
      </Text>
    </EmailLayout>
  );
}

export const template = {
  component: ApelReminder,
  subject: "Prolongation exceptionnelle pour commander vos blouses ce lundi de Pentecôte 25 mai",
  displayName: "Relance France Uniformes (rentrée)",
  previewData: {
    civilite: "Madame",
    familyName: "Dupont",
    deadline: "ce dimanche 24 mai 2026 (23h59)",
    appUrl: APP_URL,
  },
} satisfies TemplateEntry;
