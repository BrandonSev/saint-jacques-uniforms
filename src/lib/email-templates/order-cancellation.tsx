import * as React from 'react'
import { Button, Text } from '@react-email/components'
import { EmailLayout, text, button } from './_layout'
import type { TemplateEntry } from './registry'

const APP_URL = 'https://sjdc-dax.franceuniformes.fr'

interface Props {
  prenom?: string
  familyName?: string
  orderNumber?: string
  reason?: string
  appUrl?: string
}

function OrderCancellationEmail({
  prenom = '',
  familyName,
  orderNumber = '',
  reason,
  appUrl = APP_URL,
}: Props) {
  return (
    <EmailLayout
      preview={`Commande annulée — ${orderNumber}`}
      title="Commande annulée"
      familyName={familyName}
      signatureRole="Commandes"
    >
      <Text style={text}>Bonjour {prenom},</Text>
      <Text style={text}>
        Votre commande <strong>{orderNumber}</strong> a été annulée.
        {reason ? ` Motif : ${reason}` : ''}
      </Text>
      <Text style={text}>
        Si vous avez des questions concernant cette annulation, n'hésitez pas à nous contacter.
      </Text>
      <Button href={`${appUrl}/commandes`} style={button}>Voir mes commandes</Button>
    </EmailLayout>
  )
}

export const template = {
  component: OrderCancellationEmail,
  subject: (d: Record<string, any>) => `Commande annulée — ${d.orderNumber ?? ''}`,
  displayName: 'Commande annulée — confirmation famille',
  previewData: {
    prenom: 'Manon',
    familyName: 'Bauzet',
    orderNumber: 'CMD-20260504-C001-001',
    reason: 'Demande de la famille',
  },
} satisfies TemplateEntry
