import * as React from 'react'
import { Text } from '@react-email/components'
import { EmailLayout, text } from './_layout'
import type { TemplateEntry } from './registry'

interface Item { name: string; size: string; qty: number; price: number; child: string }
interface Props { prenom?: string; familyName?: string; orderNumber?: string; items?: Item[]; total?: number }

function OrderConfirmationEmail({ prenom = '', familyName, orderNumber = '', items = [], total = 0 }: Props) {
  return (
    <EmailLayout preview={`Commande ${orderNumber} confirmée`} title={`Commande ${orderNumber} confirmée`} familyName={familyName} signatureRole="Commandes">
      <Text style={text}>Bonjour {prenom},</Text>
      <Text style={text}>
        Nous avons bien reçu votre commande <strong>{orderNumber}</strong>. Voici son récapitulatif :
      </Text>
      <table width="100%" cellPadding={0} cellSpacing={0} style={{ borderCollapse: 'collapse', margin: '16px 0', fontSize: 14 }}>
        <thead>
          <tr>
            <th align="left" style={{ padding: '8px 0', borderBottom: '2px solid #0a2540' }}>Article</th>
            <th style={{ padding: '8px 0', borderBottom: '2px solid #0a2540' }}>Qté</th>
            <th align="right" style={{ padding: '8px 0', borderBottom: '2px solid #0a2540' }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {items.map((i, idx) => (
            <tr key={idx}>
              <td style={{ padding: '8px 0', borderBottom: '1px solid #eee' }}>
                {i.name}
                <br />
                <span style={{ color: '#888', fontSize: 12 }}>Pour {i.child} · Taille {i.size}</span>
              </td>
              <td style={{ padding: '8px 0', borderBottom: '1px solid #eee', textAlign: 'center' }}>{i.qty}</td>
              <td style={{ padding: '8px 0', borderBottom: '1px solid #eee', textAlign: 'right' }}>{(i.qty * i.price).toFixed(2)} €</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={2} style={{ padding: '12px 0', fontWeight: 700 }}>Total TTC</td>
            <td style={{ padding: '12px 0', textAlign: 'right', fontWeight: 700 }}>{total.toFixed(2)} €</td>
          </tr>
        </tfoot>
      </table>
      <Text style={text}>Vous serez prévenu(e) dès la mise à disposition.</Text>
    </EmailLayout>
  )
}

export const template = {
  component: OrderConfirmationEmail,
  subject: (d: Record<string, any>) => `Commande ${d.orderNumber ?? ''} confirmée`,
  displayName: 'Confirmation de commande',
  previewData: { prenom: 'Marie', familyName: 'Dupont', orderNumber: 'CMD-20260504-C001-001', total: 120, items: [{ name: 'Polo bleu', size: '12 ans', qty: 2, price: 25, child: 'Léa' }, { name: 'Pull marine', size: 'M', qty: 1, price: 70, child: 'Tom' }] },
} satisfies TemplateEntry