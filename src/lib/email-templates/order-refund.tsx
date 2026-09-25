import * as React from 'react'
import { Button, Text } from '@react-email/components'
import { EmailLayout, text, button } from './_layout'
import type { TemplateEntry } from './registry'

const APP_URL = 'https://sjdc-dax.franceuniformes.fr'

interface Props {
  prenom?: string
  familyName?: string
  orderNumber?: string
  amount?: number
  itemNames?: string[]
  appUrl?: string
}

function OrderRefundEmail({
  prenom = '',
  familyName,
  orderNumber = '',
  amount = 0,
  itemNames = [],
  appUrl = APP_URL,
}: Props) {
  return (
    <EmailLayout
      preview={`Remboursement effectué — ${orderNumber}`}
      title="Remboursement effectué"
      familyName={familyName}
      signatureRole="Commandes"
    >
      <Text style={text}>Bonjour {prenom},</Text>
      <Text style={text}>
        Un remboursement de <strong>{amount.toFixed(2)} €</strong> a été effectué sur votre commande{' '}
        <strong>{orderNumber}</strong>{itemNames.length > 0 ? ` pour : ${itemNames.join(', ')}` : ''}.
      </Text>
      <Text style={text}>
        Ce montant sera recrédité sur votre moyen de paiement d'origine sous quelques jours.
      </Text>
      <Button href={`${appUrl}/commandes`} style={button}>Voir mes commandes</Button>
    </EmailLayout>
  )
}

export const template = {
  component: OrderRefundEmail,
  subject: (d: Record<string, any>) => `Remboursement effectué — ${d.orderNumber ?? ''}`,
  displayName: 'Remboursement — confirmation famille',
  previewData: {
    prenom: 'Manon',
    familyName: 'Bauzet',
    orderNumber: 'CMD-20260504-C001-001',
    amount: 35,
    itemNames: ['Blouse officielle — 8 ans'],
  },
} satisfies TemplateEntry
