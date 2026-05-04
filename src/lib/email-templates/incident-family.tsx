import * as React from 'react'
import { Button, Text } from '@react-email/components'
import { EmailLayout, text, button, list } from './_layout'
import type { TemplateEntry } from './registry'

const APP_URL = 'https://sjdc-dax.franceuniformes.fr'
const INCIDENT_LABELS: Record<string, string> = {
  malfacon: 'Malfaçon / défaut', erreur_envoi: "Erreur d'envoi", article_manquant: 'Article manquant',
  taille_inadaptee: 'Taille inadaptée', usure_normale: 'Usure normale', autre: 'Autre',
}

interface Props { prenom?: string; orderNumber?: string; productName?: string; type?: string; eligible?: boolean; appUrl?: string }

function IncidentFamilyEmail({ prenom = '', orderNumber = '', productName = '', type = '', eligible = false, appUrl = APP_URL }: Props) {
  return (
    <EmailLayout preview="Incident enregistré" title="Incident enregistré">
      <Text style={text}>Bonjour {prenom},</Text>
      <Text style={text}>Nous avons bien reçu votre déclaration d'incident concernant la commande <strong>{orderNumber}</strong>.</Text>
      <ul style={list}>
        <li><strong>Article :</strong> {productName}</li>
        <li><strong>Motif :</strong> {INCIDENT_LABELS[type] ?? type}</li>
        <li><strong>Éligibilité :</strong> {eligible ? 'Éligible à étude — réponse sous 5 jours ouvrés.' : 'Motif a priori non éligible à une prise en charge.'}</li>
      </ul>
      <Button href={`${appUrl}/commandes`} style={button}>Voir mes commandes</Button>
    </EmailLayout>
  )
}

export const template = {
  component: IncidentFamilyEmail,
  subject: (d: Record<string, any>) => `Incident enregistré — Commande ${d.orderNumber ?? ''}`,
  displayName: 'Incident — confirmation famille',
  previewData: { prenom: 'Marie', orderNumber: 'CMD-20260504-C001-001', productName: 'Polo bleu', type: 'malfacon', eligible: true },
} satisfies TemplateEntry