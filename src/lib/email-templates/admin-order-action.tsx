import * as React from 'react'
import { Text } from '@react-email/components'
import { EmailLayout, text } from './_layout'
import type { TemplateEntry } from './registry'

interface Props {
  orderNumber?: string
  familyName?: string
  action?: 'Annulation' | 'Remboursement'
  amount?: number
  reason?: string
  actorEmail?: string
}

function AdminOrderActionEmail({
  orderNumber = '',
  familyName = '',
  action = 'Annulation',
  amount,
  reason,
  actorEmail = '',
}: Props) {
  return (
    <EmailLayout
      preview={`${action} — commande ${orderNumber}`}
      title={`${action} de commande`}
      signatureRole="Commandes"
    >
      <Text style={text}>
        {action} effectuée sur la commande <strong>{orderNumber}</strong> ({familyName}).
      </Text>
      {amount != null && <Text style={text}>Montant : <strong>{amount.toFixed(2)} €</strong></Text>}
      {reason && <Text style={text}>Motif : {reason}</Text>}
      <Text style={text}>Effectuée par : {actorEmail}</Text>
    </EmailLayout>
  )
}

export const template = {
  component: AdminOrderActionEmail,
  subject: (d: Record<string, any>) => `${d.action ?? 'Action'} — commande ${d.orderNumber ?? ''}`,
  displayName: 'Notification interne — action sur commande',
  previewData: {
    orderNumber: 'CMD-20260504-C001-001',
    familyName: 'Bauzet',
    action: 'Remboursement',
    amount: 35,
    reason: 'Erreur de taille',
    actorEmail: 'admin@franceuniformes.fr',
  },
} satisfies TemplateEntry
