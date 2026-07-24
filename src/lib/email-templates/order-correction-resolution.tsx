import * as React from 'react'
import { Button, Text } from '@react-email/components'
import { EmailLayout, text, button } from './_layout'
import type { TemplateEntry } from './registry'

const APP_URL = 'https://sjdc-dax.franceuniformes.fr'

interface Props {
  prenom?: string
  familyName?: string
  orderNumber?: string
  productName?: string
  oldSize?: string
  newSize?: string
  appUrl?: string
}

function OrderCorrectionResolutionEmail({
  prenom = '',
  familyName,
  orderNumber = '',
  productName = '',
  oldSize = '',
  newSize = '',
  appUrl = APP_URL,
}: Props) {
  return (
    <EmailLayout
      preview={`Taille corrigée — ${orderNumber}`}
      title="Correction de taille effectuée"
      familyName={familyName}
      signatureRole="Commandes"
    >
      <Text style={text}>Bonjour {prenom},</Text>
      <Text style={text}>
        Comme convenu, nous avons corrigé la taille de l'article <strong>{productName}</strong> sur votre
        commande <strong>{orderNumber}</strong> : {oldSize} → <strong>{newSize}</strong>.
      </Text>
      <Text style={text}>Aucune autre démarche n'est nécessaire de votre part.</Text>
      <Button href={`${appUrl}/commandes`} style={button}>Voir mes commandes</Button>
    </EmailLayout>
  )
}

export const template = {
  component: OrderCorrectionResolutionEmail,
  subject: (d: Record<string, any>) => `Correction de taille effectuée — ${d.orderNumber ?? ''}`,
  displayName: 'Correction de taille — confirmation famille',
  previewData: {
    prenom: 'Manon',
    familyName: 'Bauzet',
    orderNumber: 'CMD-20260504-C001-001',
    productName: 'Polo bleu',
    oldSize: '8 ans',
    newSize: '6 ans',
  },
} satisfies TemplateEntry
