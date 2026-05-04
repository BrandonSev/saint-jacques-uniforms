import * as React from 'react'
import { render } from '@react-email/components'
import { supabaseAdmin } from '@/integrations/supabase/client.server'
import { TEMPLATES } from '@/lib/email-templates/registry'

const SITE_NAME = 'France Uniformes'
const SENDER_DOMAIN = 'notify.franceuniformes.fr'
const FROM_DOMAIN = 'franceuniformes.fr'
const FROM_LOCALPART = 'info'
const REPLY_TO = 'info@franceuniformes.fr'

function generateToken(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Server-side helper to enqueue a transactional email.
 * Uses service role to bypass auth/RLS — call only from server code.
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

  const messageId = crypto.randomUUID()
  const idemKey = idempotencyKey || messageId
  const normalizedEmail = effectiveRecipient.toLowerCase()

  // Check suppression
  const { data: suppressed } = await supabaseAdmin
    .from('suppressed_emails' as any)
    .select('id')
    .eq('email', normalizedEmail)
    .maybeSingle()

  if (suppressed) {
    await supabaseAdmin.from('email_send_log' as any).insert({
      message_id: messageId, template_name: templateName,
      recipient_email: effectiveRecipient, status: 'suppressed',
    } as any)
    return { success: false, reason: 'email_suppressed' }
  }

  // Get or create unsubscribe token
  let unsubscribeToken: string
  const { data: existing } = await supabaseAdmin
    .from('email_unsubscribe_tokens' as any)
    .select('token, used_at')
    .eq('email', normalizedEmail)
    .maybeSingle()

  if (existing && !(existing as any).used_at) {
    unsubscribeToken = (existing as any).token
  } else {
    unsubscribeToken = generateToken()
    await supabaseAdmin
      .from('email_unsubscribe_tokens' as any)
      .upsert({ token: unsubscribeToken, email: normalizedEmail } as any, { onConflict: 'email', ignoreDuplicates: true })
    const { data: stored } = await supabaseAdmin
      .from('email_unsubscribe_tokens' as any)
      .select('token')
      .eq('email', normalizedEmail)
      .maybeSingle()
    if (stored) unsubscribeToken = (stored as any).token
  }

  // Render
  const element = React.createElement(template.component, templateData)
  const html = await render(element)
  const plainText = await render(element, { plainText: true })
  const resolvedSubject = typeof template.subject === 'function' ? template.subject(templateData) : template.subject

  // Log pending
  await supabaseAdmin.from('email_send_log' as any).insert({
    message_id: messageId, template_name: templateName,
    recipient_email: effectiveRecipient, status: 'pending',
  } as any)

  // Enqueue
  const { error } = await supabaseAdmin.rpc('enqueue_email' as any, {
    queue_name: 'transactional_emails',
    payload: {
      message_id: messageId,
      to: effectiveRecipient,
      from: `${SITE_NAME} <${FROM_LOCALPART}@${FROM_DOMAIN}>`,
      reply_to: REPLY_TO,
      sender_domain: SENDER_DOMAIN,
      subject: resolvedSubject,
      html,
      text: plainText,
      purpose: 'transactional',
      label: templateName,
      idempotency_key: idemKey,
      unsubscribe_token: unsubscribeToken,
      queued_at: new Date().toISOString(),
    },
  } as any)

  if (error) {
    console.error('[email] enqueue failed', error)
    await supabaseAdmin.from('email_send_log' as any).insert({
      message_id: messageId, template_name: templateName,
      recipient_email: effectiveRecipient, status: 'failed',
      error_message: error.message,
    } as any)
    throw new Error(`Failed to enqueue email: ${error.message}`)
  }

  return { success: true, queued: true, messageId }
}