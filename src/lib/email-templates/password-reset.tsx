import * as React from 'react'
import { Button, Text } from '@react-email/components'
import { EmailLayout, text, button, muted } from './_layout'
import type { TemplateEntry } from './registry'

interface Props { link?: string }

function PasswordResetEmail({ link = '#' }: Props) {
  return (
    <EmailLayout preview="Réinitialisation de votre mot de passe" title="Réinitialisation du mot de passe" signatureRole="Boutique">
      <Text style={text}>Bonjour,</Text>
      <Text style={text}>Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le bouton ci-dessous pour en définir un nouveau :</Text>
      <Button href={link} style={button}>Réinitialiser mon mot de passe</Button>
      <Text style={muted}>Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email. Ce lien expire dans 1 heure.</Text>
    </EmailLayout>
  )
}

export const template = {
  component: PasswordResetEmail,
  subject: 'Réinitialisation de votre mot de passe',
  displayName: 'Réinitialisation mot de passe',
  previewData: { link: 'https://sjdc-dax.franceuniformes.fr/reset-password?token=xxx' },
} satisfies TemplateEntry