import * as React from "react";
import { Button, Text } from "@react-email/components";
import { EmailLayout, text, muted, button } from "./_layout";
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
      preview="blouses rentrée 2026 — dernière possibilité (précommande garantie terminée)"
      title="Commande de blouses — SJDC Dax"
      familyName={familyName}
      signatureRole="boutique"
    >
      <Text style={text}>Bonjour{civilite ? ` ${civilite}` : ""},</Text>

      <Text style={text}>Merci d'avoir créé votre compte sur la boutique des blouses SJDC (Dax).</Text>

      <Text style={text}>
        La période de précommande garantie est désormais terminée (initialement prévue jusqu'au dimanche 24 mai,
        prolongée exceptionnellement jusqu'au lundi 25 mai).
      </Text>

      <Text style={text}>
        👉 <strong>Dernière possibilité :</strong> nous laissons encore la commande ouverte uniquement dans la limite
        des blouses disponibles à produire (stocks indiqués par taille sur le site).
      </Text>

      <Text style={text}>
        Plus vous commandez tôt, plus nous avons de chances d'intégrer votre commande à la production,{" "}
        <strong>sans pouvoir garantir une livraison pour la rentrée pour les commandes tardives.</strong>
      </Text>

      <Text style={text}>Pour finaliser votre commande :</Text>

      <Text style={{ ...text, paddingLeft: "16px" }}>
        1) Vérifiez que votre/vos enfant(s) sont bien ajoutés dans <strong>« Mes enfants »</strong>
      </Text>
      <Text style={{ ...text, paddingLeft: "16px" }}>
        2) Renseignez leurs mensurations (pour obtenir la recommandation de taille)
      <Text style={{ ...text, paddingLeft: "16px" }}>3) Sélectionnez la taille souhaitée et validez la commande.</Text>

      {customMessage && <Text style={text}>{customMessage}</Text>}

      <Button href={`${appUrl}/boutique`} style={button}>
        Commander maintenant
      </Button>

      <Text style={text}>
        Merci pour votre réactivité.
        <br />
        Bien cordialement,
      </Text>

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
  subject: "Dernière possibilité de commander — selon blouses disponibles à produire",
  displayName: "Relance France Uniformes (hors délai garanti)",
  previewData: {
    civilite: "Madame",
    familyName: "Dupont",
    appUrl: APP_URL,
  },
} satisfies TemplateEntry;
