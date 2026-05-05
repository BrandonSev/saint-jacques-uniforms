import * as React from 'react'
import { render } from '@react-email/components'
import { Resend } from 'resend'
import { TEMPLATES } from '@/lib/email-templates/registry'

const SITE_NAME = 'France Uniformes'
const FROM_DOMAIN = 'franceuniformes.fr'
const FROM_LOCALPART = 'info'
const REPLY_TO = 'info@franceuniformes.fr'

/**
 * Server-side helper to send a transactional email directly via Resend.
 * Requires env: RESEND_API_KEY (mandatory), RESEND_FROM (optional override).
 */
export async function enqueueTransactionalEmail(params: {
  templateName: string
  recipientEmail: string
  templateData?: Record<string, any>
  idempotencyKey?: string
}) {
  const { templateName, recipientEmail, templateData = {}, idempotencyKey } = params
  const template = TEMPLATES[templateName]
  if (!template) {
    throw new Error(`Template '${templateName}' not found. Available: ${Object.keys(TEMPLATES).join(', ')}`)
  }

  const effectiveRecipient = template.to || recipientEmail
  if (!effectiveRecipient) throw new Error('recipientEmail is required')

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.error('[email] RESEND_API_KEY missing')
    throw new Error('RESEND_API_KEY is not configured')
  }
  const fromAddress = process.env.RESEND_FROM || `${SITE_NAME} <${FROM_LOCALPART}@${FROM_DOMAIN}>`
  const messageId = crypto.randomUUID()
  const idemKey = idempotencyKey || messageId

  // Render
  const element = React.createElement(template.component, templateData)
  const html = await render(element)
  const plainText = await render(element, { plainText: true })
  const resolvedSubject = typeof template.subject === 'function' ? template.subject(templateData) : template.subject

  const resend = new Resend(apiKey)
  const { data, error } = await resend.emails.send({
    from: fromAddress,
    to: [effectiveRecipient],
    replyTo: REPLY_TO,
    subject: resolvedSubject,
    html,
    text: plainText,
    headers: { 'X-Idempotency-Key': idemKey },
  })

  if (error) {
    console.error('[email] resend send failed', { templateName, to: effectiveRecipient, error })
    throw new Error(`Failed to send email: ${error.message ?? String(error)}`)
  }

  return { success: true, sent: true, messageId, resendId: data?.id }
}