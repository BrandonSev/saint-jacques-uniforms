import * as React from "react";
import { Button, Text } from "@react-email/components";
import { EmailLayout, text, button } from "./_layout";
import type { EmailBrand } from './brand';
import type { TemplateEntry } from "./registry";

interface Props {
  prenom?: string;
  familyName?: string;
  appUrl?: string;
 brand?: Partial<EmailBrand> | null}

const APP_URL = "https://sjdc-dax.franceuniformes.fr";

function WelcomeEmail({ prenom, familyName, appUrl = APP_URL , brand}: Props) {
  return (
    <EmailLayout
      preview="Bienvenue sur la boutique France Uniformes"
      title="Bienvenue !"
      familyName={familyName}
      signatureRole="Boutique"
     brand={brand}>
      <Text style={text}>Bonjour {prenom || ""},</Text>
      <Text style={text}>
        Votre compte sur la boutique <strong>France Uniformes</strong> a bien été créé.
      </Text>
      <Text style={text}>Vous pouvez désormais ajouter vos enfants et passer commande de leurs uniformes.</Text>
      <Button href={`${appUrl}/famille`} style={button}>
        Accéder à mon espace
      </Button>
    </EmailLayout>
  );
}

export const template = {
  component: WelcomeEmail,
  subject: "Bienvenue sur la boutique France Uniformes",
  displayName: "Bienvenue (création de compte)",
  previewData: { prenom: "Marie", familyName: "Dupont", appUrl: APP_URL },
} satisfies TemplateEntry;
