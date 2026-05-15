import * as React from "react";
import { render } from "@react-email/components";
import { parseEmailWebhookPayload } from "@lovable.dev/email-js";
import { WebhookError, verifyWebhookRequest } from "@lovable.dev/webhooks-js";
import { createFileRoute } from "@tanstack/react-router";
import { SignupEmail } from "@/lib/email-templates/signup";
import { InviteEmail } from "@/lib/email-templates/invite";
import { MagicLinkEmail } from "@/lib/email-templates/magic-link";
import { RecoveryEmail } from "@/lib/email-templates/recovery";
import { EmailChangeEmail } from "@/lib/email-templates/email-change";
import { ReauthenticationEmail } from "@/lib/email-templates/reauthentication";
import { TENANT_FLAGS } from "@/config/tenantFlags";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  getTenantEmailBrand,
  getTenantEmailConfig,
} from "@/lib/tenant/tenantEmailConfig.server";

const EMAIL_SUBJECTS: Record<string, string> = {
  signup: "Confirmez votre adresse email",
  invite: "Vous avez été invité",
  magiclink: "Votre lien de connexion",
  recovery: "Réinitialisation de votre mot de passe",
  email_change: "Confirmez votre nouvelle adresse email",
  reauthentication: "Votre code de vérification",
};

// Template mapping
const EMAIL_TEMPLATES: Record<string, React.ComponentType<any>> = {
  signup: SignupEmail,
  invite: InviteEmail,
  magiclink: MagicLinkEmail,
  recovery: RecoveryEmail,
  email_change: EmailChangeEmail,
  reauthentication: ReauthenticationEmail,
};

// Configuration
const SITE_NAME = "France Uniformes";
const ROOT_DOMAIN = "franceuniformes.fr";
const FROM_ADDRESS = process.env.MAILER_FROM || `${SITE_NAME} <boutique@franceuniformes.fr>`;
const REPLY_TO = "boutique@franceuniformes.fr";
const SITE_URL = process.env.URL || `https://${ROOT_DOMAIN}`;

/**
 * Phase 14 — Résout le tenant d'un destinataire email auth (signup,
 * recovery, magic-link…). Stratégie : `profiles.email = recipient` →
 * `profiles.tenant_id`. Renvoie `null` si introuvable (signup avant
 * que le trigger handle_new_user n'ait inséré la profile, ou email
 * orphelin), auquel cas le webhook retombe sur les défauts SJC.
 */
async function resolveTenantIdByEmail(email: string): Promise<string | null> {
  if (!email) return null;
  try {
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("tenant_id")
      .eq("email", email)
      .maybeSingle();
    if (error || !data?.tenant_id) return null;
    return data.tenant_id;
  } catch {
    return null;
  }
}

function redactEmail(email: string | null | undefined): string {
  if (!email) return "***";
  const [localPart, domain] = email.split("@");
  if (!localPart || !domain) return "***";
  return `${localPart[0]}***@${domain}`;
}

export const Route = createFileRoute("/lovable/email/auth/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env.LOVABLE_API_KEY;

        if (!apiKey) {
          console.error("LOVABLE_API_KEY not configured");
          return Response.json({ error: "Server configuration error" }, { status: 500 });
        }

        // Verify signature + timestamp, then parse payload.
        let payload: any;
        let run_id = "";
        try {
          const verified = await verifyWebhookRequest({
            req: request,
            secret: apiKey,
            parser: parseEmailWebhookPayload,
          });
          payload = verified.payload;
          run_id = payload.run_id;
        } catch (error) {
          if (error instanceof WebhookError) {
            switch (error.code) {
              case "invalid_signature":
              case "missing_timestamp":
              case "invalid_timestamp":
              case "stale_timestamp":
                console.error("Invalid webhook signature", { error: error.message });
                return Response.json({ error: "Invalid signature" }, { status: 401 });
              case "invalid_payload":
              case "invalid_json":
                console.error("Invalid webhook payload", { error: error.message });
                return Response.json({ error: "Invalid webhook payload" }, { status: 400 });
            }
          }

          console.error("Webhook verification failed", { error });
          return Response.json({ error: "Invalid webhook payload" }, { status: 400 });
        }

        if (!run_id) {
          console.error("Webhook payload missing run_id");
          return Response.json({ error: "Invalid webhook payload" }, { status: 400 });
        }

        if (payload.version !== "1") {
          console.error("Unsupported payload version", { version: payload.version, run_id });
          return Response.json({ error: `Unsupported payload version: ${payload.version}` }, { status: 400 });
        }

        // The email action type is in payload.data.action_type (e.g., "signup", "recovery")
        // payload.type is the hook event type ("auth")
        const emailType = payload.data.action_type;
        console.log("Received auth event", {
          emailType,
          email_redacted: redactEmail(payload.data.email),
          run_id,
        });

        const EmailTemplate = EMAIL_TEMPLATES[emailType];
        if (!EmailTemplate) {
          console.error("Unknown email type", { emailType, run_id });
          return Response.json({ error: `Unknown email type: ${emailType}` }, { status: 400 });
        }

        // Build template props from payload.data (HookData structure)
        // Phase 14 — Override siteName/siteUrl/From par tenant (gated).
        let effectiveSiteName = SITE_NAME;
        let effectiveSiteUrl = SITE_URL;
        let effectiveFromAddress = FROM_ADDRESS;
        let effectiveReplyTo = REPLY_TO;
        if (TENANT_FLAGS.ENABLE_TENANT_EMAIL_CONFIG) {
          const tenantId = await resolveTenantIdByEmail(payload.data.email);
          if (tenantId) {
            try {
              const [{ brand }, { config }] = await Promise.all([
                getTenantEmailBrand(tenantId),
                getTenantEmailConfig(tenantId),
              ]);
              effectiveSiteName = brand.siteName;
              effectiveSiteUrl = brand.appUrl;
              effectiveFromAddress = `${config.siteName} <${config.fromLocalpart}@${config.fromDomain}>`;
              effectiveReplyTo = config.replyTo;
            } catch (e) {
              console.warn("[auth-webhook] tenant resolution failed, using defaults", { run_id, error: e });
            }
          }
        }

        const templateProps = {
          siteName: effectiveSiteName,
          siteUrl: effectiveSiteUrl,
          recipient: payload.data.email,
          confirmationUrl: payload.data.url,
          token: payload.data.token,
          email: payload.data.email,
          oldEmail: payload.data.old_email,
          newEmail: payload.data.new_email,
        };

        // Render React Email to HTML and plain text
        const element = React.createElement(EmailTemplate, templateProps);
        const html = await render(element);
        const text = await render(element, { plainText: true });

        // Send via self-hosted mailer (HTTP POST with token query param)
        const mailerUrl = process.env.MAILER_URL || "https://franceuniformes.fr/api/mailer/send";
        const mailerToken = process.env.MAILER_TOKEN;
        if (!mailerToken) {
          console.error("MAILER_TOKEN not configured", { run_id });
          return Response.json({ error: "Server configuration error" }, { status: 500 });
        }

        const messageId = crypto.randomUUID();
        const url = `${mailerUrl}${mailerUrl.includes("?") ? "&" : "?"}token=${encodeURIComponent(mailerToken)}`;
        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Idempotency-Key": messageId,
          },
          body: JSON.stringify({
            from: effectiveFromAddress,
            to: payload.data.email,
            replyTo: effectiveReplyTo,
            subject: EMAIL_SUBJECTS[emailType] || "Notification",
            html,
            text,
            idempotencyKey: messageId,
          }),
        });

        if (!res.ok) {
          const body = await res.text().catch(() => "");
          console.error("Failed to send auth email via mailer", {
            status: res.status,
            body,
            run_id,
            emailType,
          });
          return Response.json({ error: `Failed to send email: HTTP ${res.status}` }, { status: 500 });
        }

        const data = await res.json().catch(() => ({}) as any);
        console.log("Auth email sent via mailer", {
          emailType,
          email_redacted: redactEmail(payload.data.email),
          mailerId: data?.id,
          run_id,
        });

        return Response.json({ success: true, sent: true, mailerId: data?.id });
      },
    },
  },
});
