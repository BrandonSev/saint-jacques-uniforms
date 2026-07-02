import * as React from "react";
import { Button, Text } from "@react-email/components";
import { EmailLayout, text, button } from "./_layout";
import type { TemplateEntry } from "./registry";

interface Props {
  siteName: string;
  confirmationUrl: string;
}

function SignupEmail({ siteName, confirmationUrl }: Props) {
  return (
    <EmailLayout
      preview="Confirmez votre adresse email"
      title="Confirmez votre inscription"
      signatureRole="Boutique"
    >
      <Text style={text}>Bonjour,</Text>
      <Text style={text}>
        Merci de vous être inscrit sur la boutique <strong>{siteName}</strong>.
      </Text>
      <Text style={text}>
        Pour finaliser votre inscription, veuillez confirmer votre adresse email
        en cliquant sur le bouton ci-dessous :
      </Text>
      <Button href={confirmationUrl} style={button}>
        Confirmer mon email
      </Button>
      <Text style={text}>
        Si vous n'avez pas créé de compte, vous pouvez ignorer cet email.
      </Text>
    </EmailLayout>
  );
}

export const template = {
  component: SignupEmail,
  subject: "Confirmez votre adresse email",
  displayName: "Confirmation d'inscription",
  previewData: {
    siteName: "France Uniformes",
    confirmationUrl: "https://sjdc-dax.franceuniformes.fr/boutique",
  },
} satisfies TemplateEntry;
