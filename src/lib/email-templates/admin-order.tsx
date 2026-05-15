import * as React from 'react'
import { Button, Text } from '@react-email/components'
import { EmailLayout, text, button, list } from './_layout'
import type { TemplateEntry } from './registry'

interface Props { orderNumber?: string; familyName?: string; total?: number; itemsCount?: number; appUrl?: string }
const APP_URL = 'https://sjdc-dax.franceuniformes.fr'

function AdminOrderEmail({ orderNumber = '', familyName = '', total = 0, itemsCount = 0, appUrl = APP_URL }: Props) {
  return (
    <EmailLayout preview={`Nouvelle commande ${orderNumber}`} title="Nouvelle commande reçue" signatureRole="Commandes">
      <Text style={text}>Une nouvelle commande vient d'être passée :</Text>
      <ul style={list}>
        <li><strong>Numéro :</strong> {orderNumber}</li>
        <li><strong>Famille :</strong> {familyName}</li>
        <li><strong>Articles :</strong> {itemsCount}</li>
        <li><strong>Total :</strong> {total.toFixed(2)} €</li>
      </ul>
      <Button href={`${appUrl}/admin`} style={button}>Ouvrir l'administration</Button>
    </EmailLayout>
  )
}

export const template = {
  component: AdminOrderEmail,
  subject: (d: Record<string, any>) => `Nouvelle commande ${d.orderNumber ?? ''} — ${d.familyName ?? ''}`,
  displayName: 'Notification commande (admin)',
  previewData: { orderNumber: 'CMD-20260504-C001-001', familyName: 'Marie Dupont', total: 120, itemsCount: 3 },
} satisfies TemplateEntry