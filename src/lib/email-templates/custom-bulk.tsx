import * as React from "react";
import { Button, Text } from "@react-email/components";
import { EmailLayout, text, button } from "./_layout";
import type { TemplateEntry } from "./registry";

interface Props {
  headerTitle: string;
  body: string;
  buttonLabel?: string;
  buttonUrl?: string;
  familyName?: string;
  greeting: string;
  signatureRole: string;
}

function CustomBulkEmail({ headerTitle, body, buttonLabel, buttonUrl, familyName, greeting, signatureRole }: Props) {
  const paragraphs = (body || "").split(/\n\s*\n/).filter((p) => p.trim().length > 0);
  return (
    <EmailLayout preview={headerTitle} title={headerTitle} familyName={familyName} signatureRole={signatureRole}>
      <Text style={text}>{greeting}</Text>
      {paragraphs.map((p, i) => (
        <Text key={i} style={text}>
          {p}
        </Text>
      ))}
      {buttonLabel && buttonUrl ? (
        <Button href={buttonUrl} style={button}>
          {buttonLabel}
        </Button>
      ) : null}
    </EmailLayout>
  );
}

export const template = {
  component: CustomBulkEmail,
  subject: (data: Record<string, any>) => data.headerTitle || "Message de l'équipe France Uniformes",
  displayName: "Email personnalisé (admin, bulk)",
  previewData: {
    headerTitle: "Votre compte est de nouveau accessible",
    body: "Nous avons résolu un souci technique.\n\nVous pouvez vous reconnecter dès à présent.",
    buttonLabel: "Accéder à mon espace",
    buttonUrl: "https://sjdc-dax.franceuniformes.fr/",
    familyName: "Dupont",
    greeting: "Bonjour Marie,",
    signatureRole: "technique",
  },
} satisfies TemplateEntry;
