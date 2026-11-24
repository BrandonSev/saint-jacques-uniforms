import * as React from "react";
import { Button, Text } from "@react-email/components";
import { EmailLayout, text, button } from "./_layout";
import { parseRichText, renderRichParagraph } from "./richText";
import { CUSTOM_BULK_FIXED } from "./custom-bulk.constants";
import type { TemplateEntry } from "./registry";

function CustomBulkDisclaimer() {
  return (
    <>
      Cet email vous est envoyé par <strong>France Uniformes</strong> {CUSTOM_BULK_FIXED.disclaimer}
    </>
  );
}

interface Props {
  /** Objet de l'email, repris en titre d'en-tête. */
  headerTitle: string;
  /** Pré-header (aperçu affiché dans la boîte de réception). */
  preheader?: string;
  /** Corps du message (mise en forme **gras**, *italique*, __souligné__). */
  body: string;
  familyName?: string;
  greeting: string;
}

function CustomBulkEmail({ headerTitle, preheader, body, familyName, greeting }: Props) {
  const paragraphs = parseRichText(body);
  return (
    <EmailLayout
      preview={preheader?.trim() || headerTitle}
      title={headerTitle}
      familyName={familyName}
      signatureRole={CUSTOM_BULK_FIXED.signatureRole}
      disclaimer={<CustomBulkDisclaimer />}
    >
      <Text style={text}>{greeting}</Text>
      {paragraphs.map((p, i) => (
        <Text key={i} style={text}>
          {renderRichParagraph(p)}
        </Text>
      ))}
      <Button href={CUSTOM_BULK_FIXED.buttonUrl} style={button}>
        {CUSTOM_BULK_FIXED.buttonLabel}
      </Button>
      <Text style={text}>{CUSTOM_BULK_FIXED.thanks}</Text>
    </EmailLayout>
  );
}

export const template = {
  component: CustomBulkEmail,
  subject: (data: Record<string, any>) => data.headerTitle || "Message de l'équipe France Uniformes",
  displayName: "Email personnalisé (admin, bulk)",
  previewData: {
    headerTitle: "Les blouses sont de nouveau disponibles",
    preheader: "Toutes les tailles sont de nouveau en stock sur la boutique",
    body: "Bonne nouvelle : **toutes les tailles** sont de nouveau disponibles.\n\nPensez à *vérifier les mensurations* de votre enfant avant de __valider votre commande__.",
    familyName: "Dupont",
    greeting: "Bonjour Marie,",
  },
} satisfies TemplateEntry;
