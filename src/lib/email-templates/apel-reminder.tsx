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

function ApelReminder({ prenom, familyName, deadline = "24 mai 2026", appUrl = APP_URL, customMessage }: Props) {
  return (
    <EmailLayout
      preview="Il vous reste peu de temps pour commander vos uniformes"
      title="Rappel — Commande pour la rentrée 2026"
      familyName={familyName}
      signatureRole="boutique"
    >
      <Text style={text}>Bonjour {prenom || ""},</Text>

      <Text style={text}>Nous n'avons pas encore reçu votre commande d'uniformes pour la rentrée 2026.</Text>

      {customMessage && <Text style={text}>{customMessage}</Text>}

      <Text style={text}>
        Pour que votre trousseau soit préparé et livré à temps, merci de finaliser votre commande avant le{" "}
        <strong>{deadline}</strong>. Passé ce délai, nous ne serons plus en mesure de garantir la disponibilité des
        articles pour la rentrée.
      </Text>

      <Button href={`${appUrl}/boutique`} style={button}>
        Commander maintenant
      </Button>

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
