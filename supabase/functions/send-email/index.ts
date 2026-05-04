// Edge function: envoi email transactionnel via SMTP Outlook (Office 365)
// Auth: header x-webhook-secret == EMAIL_WEBHOOK_SECRET
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Payload = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
};

function escape(s: string) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

export function renderLayout(title: string, bodyHtml: string) {
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>${escape(title)}</title></head>
<body style="margin:0;background:#ffffff;font-family:Arial,Helvetica,sans-serif;color:#1a1a1a;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f1e8;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
        <tr><td style="background:#0f3a5f;padding:24px 32px;color:#fff;">
          <div style="font-size:14px;letter-spacing:2px;text-transform:uppercase;opacity:.8;">Saint-Jacques</div>
          <div style="font-size:22px;font-weight:600;margin-top:4px;">${escape(title)}</div>
        </td></tr>
        <tr><td style="padding:32px;font-size:15px;line-height:1.6;color:#1a1a1a;">${bodyHtml}</td></tr>
        <tr><td style="background:#fafaf7;padding:20px 32px;font-size:12px;color:#777;text-align:center;">
          Établissement Saint-Jacques · Email automatique, merci de ne pas répondre directement.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const secret = Deno.env.get("EMAIL_WEBHOOK_SECRET");
  if (!secret || req.headers.get("x-webhook-secret") !== secret) {
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  let payload: Payload;
  try { payload = await req.json(); } catch { return new Response(JSON.stringify({ error: "invalid json" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }); }
  if (!payload.to || !payload.subject || !payload.html) {
    return new Response(JSON.stringify({ error: "to, subject, html required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const user = Deno.env.get("SMTP_USER");
  const password = Deno.env.get("SMTP_PASSWORD");
  if (!user || !password) {
    return new Response(JSON.stringify({ error: "SMTP not configured" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const client = new SMTPClient({
    connection: {
      hostname: "smtp.office365.com",
      port: 587,
      tls: false,
      auth: { username: user, password },
    },
    debug: { log: false, allowUnsecure: false, encodeLB: false, noStartTLS: false },
    pool: false,
  });

  try {
    await client.send({
      from: user,
      to: payload.to,
      replyTo: payload.replyTo,
      subject: payload.subject,
      content: payload.text ?? payload.html.replace(/<[^>]+>/g, " "),
      html: payload.html,
    });
    await client.close();
    return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    try { await client.close(); } catch {}
    console.error("SMTP error:", e);
    return new Response(JSON.stringify({ error: "smtp send failed", detail: String(e) }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});