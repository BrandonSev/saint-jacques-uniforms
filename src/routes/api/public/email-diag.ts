import { createFileRoute } from "@tanstack/react-router";
import { enqueueTransactionalEmail } from "@/lib/email/send.server";

// Endpoint de diagnostic pour tester un envoi d'email transactionnel.
// Protégé par un secret partagé (EMAIL_WEBHOOK_SECRET) pour éviter les abus.
// Usage: POST /api/public/email-diag avec body { to, template?, data?, secret }
export const Route = createFileRoute("/api/public/email-diag")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: any;
        try {
          body = await request.json();
        } catch {
          return new Response("invalid json", { status: 400 });
        }
        const expected = process.env.EMAIL_WEBHOOK_SECRET;
        if (!expected || body?.secret !== expected) {
          return new Response("unauthorized", { status: 401 });
        }
        if (!body?.to || typeof body.to !== "string") {
          return new Response("missing 'to'", { status: 400 });
        }
        const templateName = body.template || "welcome";
        const templateData = body.data || { prenom: "Test" };
        try {
          const result = await enqueueTransactionalEmail({
            templateName,
            recipientEmail: body.to,
            templateData,
            idempotencyKey: `diag-${Date.now()}`,
            keyPrefix: process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 10) + "...",
          });
          return Response.json({ ok: true, result });
        } catch (e: any) {
          console.error("[email-diag]", e);
          return Response.json({ ok: false, error: e?.message ?? String(e) }, { status: 500 });
        }
      },
    },
  },
});
