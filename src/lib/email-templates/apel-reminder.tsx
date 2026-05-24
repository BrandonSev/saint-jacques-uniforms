import * as React from "react";
import { Button, Text } from "@react-email/components";
import { EmailLayout, text, muted, button } from "./_layout";
import type { TemplateEntry } from "./registry";

interface Props {
  prenom?: string;
  familyName?: string;
  deadline?: string;
  appUrl?: string;
  customMessage?: string;
}

const APP_URL = "https://sjdc-dax.franceuniformes.fr";

function ApelReminder({
  prenom,
  familyName,
  deadline = "24 mai 2026 (23h59)",
  appUrl = APP_URL,
  customMessage,
}: Props) {
  return (
    <EmailLayout
      preview="Pensez à commander les uniformes de votre enfant avant la rentrée"
      title="Rappel — Commande pour la rentrée 2026"
      familyName={familyName}
      signatureRole="boutique"
    >
      <Text style={text}>Bonjour {prenom || ""},</Text>

      <Text style={text}>
        Nous vous rappelons que vous n'avez pas encore passé commande des uniformes de votre enfant sur la boutique en
        ligne du groupe scolaire Saint-Jacques-de-Compostelle de Dax.
      </Text>

      <Text style={text}>
        Afin de vous garantir les délais de production en France et de pouvoir effectuer une livraison avant la rentrée
        de septembre, merci de passer votre commande avant le <strong>{deadline}</strong>.
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
  subject: "Rappel France Uniformes — Commande des uniformes pour la rentrée 2026",
  displayName: "Relance France Uniformes (rentrée)",
  previewData: {
    prenom: "Marie",
    familyName: "Dupont",
    deadline: "24 mai 2026",
    appUrl: APP_URL,
  },
} satisfies TemplateEntry;
