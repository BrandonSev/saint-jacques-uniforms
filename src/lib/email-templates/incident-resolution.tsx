import * as React from 'react'
import { Button, Text } from '@react-email/components'
import { EmailLayout, text, button } from './_layout'
import type { TemplateEntry } from './registry'

const APP_URL = 'https://sjdc-dax.franceuniformes.fr'
const STATUS_MAP: Record<string, { title: string; body: string }> = {
  'Résolu': { title: 'Votre incident a été résolu', body: "Notre équipe a traité votre incident. Une solution vous sera communiquée si ce n'est déjà fait." },
  'Refusé': { title: 'Incident refusé', body: "Après étude, votre incident n'a pas pu être pris en charge." },
  'Non éligible': { title: 'Incident non éligible', body: "Le motif déclaré n'ouvre pas droit à une prise en charge." },
  'En cours de traitement': { title: 'Incident en cours', body: 'Votre incident est en cours de traitement par notre équipe.' },
  'À traiter': { title: 'Incident reçu', body: "Votre incident est enregistré, nous l'étudions." },
  'En attente': { title: 'Incident en attente', body: "Votre incident est en attente d'éléments complémentaires." },
}

interface Props { prenom?: string; orderNumber?: string; status?: string; productName?: string; appUrl?: string }

function getMap(status?: string) {
  return (status && STATUS_MAP[status]) || { title: `Incident — ${status ?? ''}`, body: `Votre incident a évolué au statut « ${status ?? ''} ».` }
}

function IncidentResolutionEmail({ prenom = '', orderNumber = '', status = '', productName = '', appUrl = APP_URL }: Props) {
  const m = getMap(status)
  return (
    <EmailLayout preview={`${m.title} — ${orderNumber}`} title={m.title}>
      <Text style={text}>Bonjour {prenom},</Text>
      <Text style={text}>Mise à jour concernant l'incident sur votre commande <strong>{orderNumber}</strong> (article : {productName}) :</Text>
      <Text style={text}>{m.body}</Text>
      <Button href={`${appUrl}/commandes`} style={button}>Voir mes commandes</Button>
    </EmailLayout>
  )
}

export const template = {
  component: IncidentResolutionEmail,
  subject: (d: Record<string, any>) => `${getMap(d.status).title} — ${d.orderNumber ?? ''}`,
  displayName: 'Incident — résolution famille',
  previewData: { prenom: 'Marie', orderNumber: 'CMD-20260504-C001-001', status: 'Résolu', productName: 'Polo bleu' },
} satisfies TemplateEntry