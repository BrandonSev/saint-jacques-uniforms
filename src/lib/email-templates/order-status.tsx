import * as React from 'react'
import { Button, Text } from '@react-email/components'
import { EmailLayout, text, button, muted } from './_layout'
import type { TemplateEntry } from './registry'

const APP_URL = 'https://sjdc-dax.franceuniformes.fr'

const STATUS_LABELS: Record<string, { title: string; body: string }> = {
  'En attente paiement': { title: 'Commande enregistrée — paiement en attente', body: 'Votre commande est enregistrée. Vous pouvez finaliser le paiement à tout moment depuis votre espace.' },
  'Paiement validé': { title: 'Paiement reçu', body: 'Nous avons bien reçu votre règlement. Votre commande passe en préparation.' },
  'Paiement échoué': { title: 'Paiement échoué', body: "Le règlement n'a pas abouti. Vous pouvez relancer le paiement depuis votre espace commandes." },
  'En préparation': { title: 'Commande en préparation', body: 'Votre commande est en cours de préparation par notre atelier.' },
  'Prête': { title: 'Commande prête', body: 'Votre commande est prête. Elle vous sera transmise très prochainement.' },
  'Expédiée': { title: 'Commande expédiée', body: 'Votre commande vient de partir. Vous pouvez suivre son acheminement avec le numéro fourni.' },
  'Disponible au retrait': { title: 'Commande disponible', body: 'Votre commande est disponible au secrétariat de l\'établissement.' },
  'Livrée': { title: 'Commande livrée', body: 'Votre commande a bien été livrée. Merci de votre confiance !' },
  'Retirée': { title: 'Commande retirée', body: 'Votre commande a bien été retirée. Merci !' },
  'Annulée': { title: 'Commande annulée', body: 'Votre commande a été annulée.' },
}

interface Props { prenom?: string; orderNumber?: string; status?: string; trackingNumber?: string | null; trackingCarrier?: string | null; note?: string | null; appUrl?: string }

function getMap(status?: string) {
  return (status && STATUS_LABELS[status]) || { title: `Mise à jour : ${status ?? ''}`, body: `Votre commande est désormais au statut « ${status ?? ''} ».` }
}

function OrderStatusEmail({ prenom = '', orderNumber = '', status = '', trackingNumber, trackingCarrier, note, appUrl = APP_URL }: Props) {
  const map = getMap(status)
  return (
    <EmailLayout preview={`${map.title} — ${orderNumber}`} title={map.title}>
      <Text style={text}>Bonjour {prenom},</Text>
      <Text style={text}>Votre commande <strong>{orderNumber}</strong> a évolué :</Text>
      <Text style={text}>{map.body}</Text>
      {trackingNumber ? (
        <Text style={text}>Numéro de suivi : <strong>{trackingCarrier ?? ''} {trackingNumber}</strong></Text>
      ) : null}
      {note ? <Text style={muted}>{note}</Text> : null}
      <Button href={`${appUrl}/commandes`} style={button}>Voir mes commandes</Button>
    </EmailLayout>
  )
}

export const template = {
  component: OrderStatusEmail,
  subject: (d: Record<string, any>) => `${getMap(d.status).title} — ${d.orderNumber ?? ''}`,
  displayName: 'Mise à jour statut commande',
  previewData: { prenom: 'Marie', orderNumber: 'CMD-20260504-C001-001', status: 'Paiement validé' },
} satisfies TemplateEntry