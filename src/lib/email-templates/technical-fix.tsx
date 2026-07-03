import * as React from "react";
import { Button, Text } from "@react-email/components";
import { EmailLayout, text, button } from "./_layout";
import type { TemplateEntry } from "./registry";

interface Props {
  familyName?: string;
  appUrl?: string;
}

const APP_URL = "https://sjdc-dax.franceuniformes.fr";

function TechnicalFixEmail({ familyName, appUrl = APP_URL }: Props) {
  return (
    <EmailLayout
      preview="Le souci technique de connexion a été résolu — vous pouvez à nouveau accéder à votre espace"
      title="Votre espace est à nouveau accessible"
      familyName={familyName}
      signatureRole="technique"
    >
      <Text style={text}>Bonjour,</Text>
      <Text style={text}>
        Nous vous remercions pour votre inscription sur la boutique en ligne du groupe scolaire Saint-Jacques de
        Compostelle de Dax.
      </Text>
      <Text style={text}>
        Nous avons récemment rencontré un souci technique affectant la création de comptes, notamment lors de la
        connexion. Ce problème a été résolu et vous pouvez donc dès à présent vous reconnecter à votre espace personnel
        (ou finaliser la création de votre compte) puis procéder à la commande de vos blouses.
      </Text>
      <Button href={appUrl} style={button}>
        Accéder à mon espace
      </Button>
      <Text style={text}>
        Nous vous remercions de votre patience et restons à votre disposition pour toute question.
      </Text>
    </EmailLayout>
  );
}

export const template = {
  component: TechnicalFixEmail,
  subject: "Votre espace boutique est à nouveau accessible — Saint-Jacques de Compostelle de Dax",
  displayName: "Résolution du souci technique de connexion",
  previewData: { familyName: "Dupont", appUrl: APP_URL },
} satisfies TemplateEntry;
