import * as React from 'react'
import { Button, Text } from '@react-email/components'
import { EmailLayout, text, muted, button } from './_layout'
import type { TemplateEntry } from './registry'

interface Props {
  prenom?: string
  appUrl?: string
}

const APP_URL = 'https://sjdc-dax.franceuniformes.fr'

function WelcomeEmail({ prenom, appUrl = APP_URL }: Props) {
  return (
    <EmailLayout preview="Bienvenue sur la boutique Saint-Jacques" title="Bienvenue !">
      <Text style={text}>Bonjour {prenom || ''},</Text>
      <Text style={text}>
        Votre compte sur la boutique de l'établissement <strong>Saint-Jacques-de-Compostelle</strong> a bien été créé.
      </Text>
      <Text style={text}>
        Vous pouvez désormais ajouter vos enfants et passer commande de leurs uniformes.
      </Text>
      <Button href={`${appUrl}/famille`} style={button}>Accéder à mon espace</Button>
      <Text style={muted}>À très bientôt,<br />L'équipe Saint-Jacques</Text>
    </EmailLayout>
  )
}

export const template = {
  component: WelcomeEmail,
  subject: 'Bienvenue sur la boutique Saint-Jacques',
  displayName: 'Bienvenue (création de compte)',
  previewData: { prenom: 'Marie', appUrl: APP_URL },
} satisfies TemplateEntry