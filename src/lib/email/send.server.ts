import * as React from "react";
import { render } from "@react-email/components";
import { TEMPLATES } from "@/lib/email-templates/registry";

const SITE_NAME = "France Uniformes";
const FROM_DOMAIN = "franceuniformes.fr";
const FROM_LOCALPART = "info";
const REPLY_TO = "info@franceuniformes.fr";

/**
 * Server-side helper to send a transactional email via the self-hosted
 * mailer at https://franceuniformes.fr/api/mailer/send.
 * Requires env: MAILER_URL, MAILER_TOKEN.
 */
export async function enqueueTransactionalEmail(params: {
  templateName: string;
  recipientEmail: string;
  templateData?: Record<string, any>;
  idempotencyKey?: string;
}) {
  const { templateName, recipientEmail, templateData = {}, idempotencyKey } = params;
  const template = TEMPLATES[templateName];
  if (!template) {
    throw new Error(`Template '${templateName}' not found. Available: ${Object.keys(TEMPLATES).join(", ")}`);
  }

  const effectiveRecipient = template.to || recipientEmail;
  if (!effectiveRecipient) throw new Error("recipientEmail is required");

  const mailerUrl = process.env.MAILER_URL || "https://franceuniformes.fr/api/mailer/send";
  const mailerToken = process.env.MAILER_TOKEN;
  if (!mailerToken) {
    console.error("[email] MAILER_TOKEN missing");
    throw new Error("MAILER_TOKEN is not configured");
  }
  const fromAddress = process.env.MAILER_FROM || `${SITE_NAME} <${FROM_LOCALPART}@${FROM_DOMAIN}>`;
  const messageId = crypto.randomUUID();
  const idemKey = idempotencyKey || messageId;

  // Render
  const element = React.createElement(template.component, templateData);
  const html = await render(element);
  const plainText = await render(element, { plainText: true });
  const resolvedSubject = typeof template.subject === "function" ? template.subject(templateData) : template.subject;

  const url = `${mailerUrl}${mailerUrl.includes("?") ? "&" : "?"}token=${encodeURIComponent(mailerToken)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Idempotency-Key": idemKey,
    },
    body: JSON.stringify({
      from: fromAddress,
      to: effectiveRecipient,
      replyTo: REPLY_TO,
      subject: resolvedSubject,
      html,
      text: plainText,
      idempotencyKey: idemKey,
    }),
  });
  console.error("[email] mailer send failed", { res });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error("[email] mailer send failed", { templateName, to: effectiveRecipient, status: res.status, body });
    throw new Error(`Failed to send email: HTTP ${res.status} ${body}`);
  }

  const data = await res.json().catch(() => ({}) as any);
  return { success: true, sent: true, messageId, mailerId: data?.id };
}
