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
      preview="Pensez à commander les uniformes pour la rentrée 2026"
      title="Rappel — Commande pour la rentrée 2026"
      familyName={familyName}
      signatureRole="APEL"
    >
      <Text style={text}>Bonjour {prenom || ""},</Text>
      <Text style={text}>
        L'<strong>Association des Parents d'Élèves</strong> de Saint-Jacques-de-Compostelle vous rappelle que vous
        n'avez pas encore passé commande des uniformes pour la rentrée 2026.
      </Text>
      {customMessage && <Text style={text}>{customMessage}</Text>}
      <Text style={text}>
        Pour garantir la fabrication et la livraison à temps, merci de passer votre commande avant le{" "}
        <strong>{deadline}</strong>. Au-delà de cette date, nous ne pourrons plus garantir la disponibilité des blouses
        pour la rentrée.
      </Text>
      <Button href={`${appUrl}/boutique`} style={button}>
        Commander maintenant
      </Button>
      <Text style={muted}>
        Cet email vous est envoyé par l'APEL via la boutique Saint-Jacques.
        <br />
        Si vous avez déjà commandé, merci d'ignorer ce message.
      </Text>
    </EmailLayout>
  );
}

export const template = {
  component: ApelReminder,
  subject: "Rappel APEL — Commande des uniformes pour la rentrée 2026",
  displayName: "Relance APEL (rentrée)",
  previewData: { prenom: "Marie", familyName: "Dupont", deadline: "30 juin 2026", appUrl: APP_URL },
} satisfies TemplateEntry;
