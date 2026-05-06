import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { promises as fs } from "node:fs";
import path from "node:path";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { withSupabaseAuth } from "@/integrations/supabase/supabase-client-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { supabase } from "@/integrations/supabase/client";
import { enqueueTransactionalEmail } from "@/lib/email/send.server";
import { TEMPLATES } from "@/lib/email-templates/registry";
import {
  sendWelcomeEmail,
  sendOrderConfirmation,
  sendAdminOrderNotification,
  sendPasswordResetEmail,
  sendOrderStatusEmail,
  sendIncidentOpenedFamily,
  sendIncidentOpenedAdmin,
  sendIncidentResolutionFamily,
  type OrderEmailItem,
} from "./email.server";

async function logResetError(payload: Record<string, any>) {
  const line = JSON.stringify({ ts: new Date().toISOString(), ...payload }) + "\n";
  // Toujours logger en console (visible dans les logs serveur / Docker stdout)
  console.error("[password-reset-error]", line.trim());
  try {
    const dir = path.resolve(process.cwd(), "logs");
    await fs.mkdir(dir, { recursive: true });
    const file = path.join(dir, "password-reset-errors.log");
    await fs.appendFile(file, line, "utf8");
    console.log("[password-reset-error] wrote to", file);
  } catch (e) {
    console.error("[password-reset-error] file write failed:", (e as any)?.message ?? e);
  }
}

// Test rapide : envoie un email d'un template aléatoire avec ses previewData
export const sendTestRandomEmail = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ email: z.string().email() }).parse(d))
  .handler(async ({ data }) => {
    const names = Object.keys(TEMPLATES);
    const templateName = names[Math.floor(Math.random() * names.length)];
    const tpl = TEMPLATES[templateName];
    try {
      const result = await enqueueTransactionalEmail({
        templateName,
        recipientEmail: data.email,
        templateData: tpl.previewData ?? {},
        idempotencyKey: `test-${templateName}-${Date.now()}`,
      });
      return { ok: true as const, templateName, result };
    } catch (e: any) {
      console.error("sendTestRandomEmail:", e);
      return { ok: false as const, templateName, error: e?.message ?? String(e) };
    }
  });

// Bienvenue après création de compte (appelable par utilisateur authentifié)
export const sendWelcome = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ email: z.string().email(), prenom: z.string().min(1).max(100) }).parse(d))
  .handler(async ({ data }) => {
    try {
      await sendWelcomeEmail(data.email, data.prenom);
      return { ok: true };
    } catch (e) {
      console.error(e);
      return { ok: false, error: "send_failed" as const };
    }
  });

// Confirmation de commande + notification admin (post-checkout)
export const sendOrderEmails = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ orderId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: order, error } = await supabase
      .from("orders")
      .select("id, order_number, total_amount, family_email, family_prenom, family_nom, user_id")
      .eq("id", data.orderId)
      .single();
    if (error || !order) return { ok: false, error: "order_not_found" as const };
    if (order.user_id !== userId) return { ok: false, error: "forbidden" as const };

    const { data: items } = await supabase
      .from("order_items")
      .select("product_name, size, quantity, unit_price, child_prenom")
      .eq("order_id", order.id);

    const mapped: OrderEmailItem[] = (items ?? []).map((i: any) => ({
      name: i.product_name,
      size: i.size,
      qty: i.quantity,
      price: Number(i.unit_price),
      child: i.child_prenom ?? "—",
    }));

    try {
      if (order.family_email) {
        await sendOrderConfirmation(
          order.family_email,
          order.family_prenom ?? "",
          order.order_number,
          mapped,
          Number(order.total_amount),
        );
      }
      const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || process.env.SMTP_USER;
      if (adminEmail) {
        await sendAdminOrderNotification(
          adminEmail,
          order.order_number,
          `${order.family_prenom ?? ""} ${order.family_nom ?? ""}`.trim(),
          Number(order.total_amount),
          mapped.reduce((s, i) => s + i.qty, 0),
        );
      }
      return { ok: true };
    } catch (e) {
      console.error("sendOrderEmails:", e);
      return { ok: false, error: "send_failed" as const };
    }
  });

// Reset password custom : génère un lien admin et l'envoie via SMTP Outlook (PUBLIC, pas de middleware auth)
export const sendCustomPasswordReset = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ email: z.string().email(), redirectTo: z.string().url() }).parse(d))
  .handler(async ({ data }) => {
    try {
      const { data: linkData, error } = await supabaseAdmin.auth.admin.generateLink({
        type: "recovery",
        email: data.email,
        options: { redirectTo: data.redirectTo },
      });
      if (error || !linkData?.properties?.action_link) {
        await logResetError({
          email: data.email,
          stage: "generateLink",
          message: error?.message ?? "no_action_link",
          status: (error as any)?.status,
          code: (error as any)?.code,
        });
        // Ne pas révéler si le compte existe
        return { ok: true as const };
      }
      await sendPasswordResetEmail(data.email, linkData.properties.action_link);
      return { ok: true as const };
    } catch (e: any) {
      console.error("sendCustomPasswordReset:", e);
      await logResetError({
        email: data.email,
        stage: "exception",
        message: e?.message ?? String(e),
        stack: e?.stack,
      });
      return { ok: true as const }; // toujours ok pour ne pas leak
    }
  });

// Notification de changement de statut commande (admin → famille)
export const sendOrderStatusUpdate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ orderId: z.string().uuid(), note: z.string().max(500).optional() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: order } = await supabase
      .from("orders")
      .select("order_number, status, family_email, family_prenom, tracking_number, tracking_carrier")
      .eq("id", data.orderId)
      .maybeSingle();
    if (!order || !order.family_email) return { ok: false, error: "no_recipient" as const };
    try {
      await sendOrderStatusEmail(order.family_email, order.family_prenom ?? "", order.order_number, order.status, {
        trackingNumber: order.tracking_number,
        trackingCarrier: order.tracking_carrier,
        note: data.note ?? null,
      });
      return { ok: true };
    } catch (e) {
      console.error("sendOrderStatusUpdate:", e);
      return { ok: false, error: "send_failed" as const };
    }
  });

// Notification d'ouverture d'incident (famille → famille + admin)
export const sendIncidentNotifications = createServerFn({ method: "POST" })
  .middleware([withSupabaseAuth, requireSupabaseAuth])
  .inputValidator((d) => z.object({ incidentId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: inc } = await supabase
      .from("order_incidents")
      .select("id, order_id, order_item_id, incident_type, description, eligible, user_id")
      .eq("id", data.incidentId)
      .maybeSingle();
    if (!inc || inc.user_id !== userId) return { ok: false, error: "not_found" as const };
    const { data: order } = await supabase
      .from("orders")
      .select("order_number, family_email, family_prenom, family_nom")
      .eq("id", inc.order_id)
      .maybeSingle();
    const { data: item } = await supabase
      .from("order_items")
      .select("product_name")
      .eq("id", inc.order_item_id)
      .maybeSingle();
    if (!order) return { ok: false, error: "order_not_found" as const };
    try {
      if (order.family_email) {
        await sendIncidentOpenedFamily(
          order.family_email,
          order.family_prenom ?? "",
          order.order_number,
          item?.product_name ?? "—",
          inc.incident_type,
          inc.eligible,
        );
      }
      const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || process.env.SMTP_USER;
      if (adminEmail) {
        await sendIncidentOpenedAdmin(
          adminEmail,
          order.order_number,
          `${order.family_prenom ?? ""} ${order.family_nom ?? ""}`.trim(),
          item?.product_name ?? "—",
          inc.incident_type,
          inc.description,
        );
      }
      return { ok: true };
    } catch (e) {
      console.error("sendIncidentNotifications:", e);
      return { ok: false, error: "send_failed" as const };
    }
  });

// Notification de mise à jour d'incident (admin → famille)
export const sendIncidentUpdate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ incidentId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: inc } = await supabase
      .from("order_incidents")
      .select("status, order_id, order_item_id")
      .eq("id", data.incidentId)
      .maybeSingle();
    if (!inc) return { ok: false, error: "not_found" as const };
    const { data: order } = await supabase
      .from("orders")
      .select("order_number, family_email, family_prenom")
      .eq("id", inc.order_id)
      .maybeSingle();
    const { data: item } = await supabase
      .from("order_items")
      .select("product_name")
      .eq("id", inc.order_item_id)
      .maybeSingle();
    if (!order || !order.family_email) return { ok: false, error: "no_recipient" as const };
    try {
      await sendIncidentResolutionFamily(
        order.family_email,
        order.family_prenom ?? "",
        order.order_number,
        inc.status,
        item?.product_name ?? "—",
      );
      return { ok: true };
    } catch (e) {
      console.error("sendIncidentUpdate:", e);
      return { ok: false, error: "send_failed" as const };
    }
  });
