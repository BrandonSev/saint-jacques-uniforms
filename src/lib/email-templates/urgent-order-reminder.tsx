import * as React from "react";
import { Button, Text } from "@react-email/components";
import { EmailLayout, text, button } from "./_layout";
import type { TemplateEntry } from "./registry";

interface Props {
  civilite?: string;
  familyName?: string;
  appUrl?: string;
  deadline: string;
  customMessage?: string;
}

const APP_URL = "https://sjdc-dax.franceuniformes.fr";

function UrgentOrderReminder({ civilite, familyName, appUrl = APP_URL, deadline, customMessage }: Props) {
  return (
    <EmailLayout
      preview={`Dernière relance — commandez avant le ${deadline} pour bénéficier de la livraison groupée`}
      title="Blouse scolaire de Dax — Relance urgente commande"
      familyName={familyName}
      signatureRole="boutique"
      disclaimer={<>Cet email vous est envoyé par <strong>France Uniformes</strong> pour le compte de votre établissement scolaire.<br />Si vous avez déjà passé commande, merci d'ignorer ce message.</>}
    >
      <Text style={text}>Bonjour{civilite ? ` ${civilite}` : ""},</Text>

      <Text style={text}>
        Nous vous remercions d'avoir créé votre compte famille sur la boutique des blouses de Saint‑Jacques de
        Compostelle de Dax (SJDC). <strong>À ce jour, nous n'avons toutefois pas reçu de commande de votre part.</strong>
      </Text>

      <Text style={text}>
        👉 <strong>Nous vous invitons à commander dès que possible, et au plus tard avant le {deadline}.</strong>
      </Text>

      <Text style={text}>
        Nous vous rappelons que pour que votre commande puisse être <strong>intégrée à la livraison groupée</strong> de
        l'établissement, elle doit impérativement être passée avant cette date. <strong>Passé ce délai, les commandes
        seront traitées individuellement</strong>, avec des délais de livraison potentiellement plus longs, hors
        garantie pour la rentrée, et <strong>avec application de frais de port complémentaires à prévoir</strong>.
      </Text>

      <Text style={text}><strong>Pour finaliser votre commande :</strong></Text>

      <Text style={{ ...text, paddingLeft: "16px" }}>
        • Vérifiez que votre/vos enfant(s) sont bien ajoutés dans <strong>« Mes enfants »</strong>
      </Text>
      <Text style={{ ...text, paddingLeft: "16px" }}>
        • Renseignez leurs mensurations (pour obtenir la recommandation de taille)
      </Text>
      <Text style={{ ...text, paddingLeft: "16px" }}>
        • Sélectionnez la taille souhaitée, puis validez et payez la commande <strong>avant le {deadline}</strong>.
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
  component: UrgentOrderReminder,
  subject: (data: Record<string, any>) =>
    `Relance urgente — commandez avant le ${data.deadline ?? "la date limite"} pour la livraison groupée`,
  displayName: "Relance urgente commande (livraison groupée)",
  previewData: {
    civilite: "Madame",
    familyName: "Dupont",
    appUrl: APP_URL,
    deadline: "dimanche 26 juillet 2026",
  },
} satisfies TemplateEntry;
