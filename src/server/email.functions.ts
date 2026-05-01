import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  sendWelcomeEmail,
  sendOrderConfirmation,
  sendAdminOrderNotification,
  sendPasswordResetEmail,
  type OrderEmailItem,
} from "./email.server";

// Bienvenue après création de compte (appelable par utilisateur authentifié)
export const sendWelcome = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ email: z.string().email(), prenom: z.string().min(1).max(100) }).parse(d))
  .handler(async ({ data }) => {
    try { await sendWelcomeEmail(data.email, data.prenom); return { ok: true }; }
    catch (e) { console.error(e); return { ok: false, error: "send_failed" as const }; }
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
      name: i.product_name, size: i.size, qty: i.quantity, price: Number(i.unit_price), child: i.child_prenom ?? "—",
    }));

    try {
      if (order.family_email) {
        await sendOrderConfirmation(order.family_email, order.family_prenom ?? "", order.order_number, mapped, Number(order.total_amount));
      }
      const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || process.env.SMTP_USER;
      if (adminEmail) {
        await sendAdminOrderNotification(adminEmail, order.order_number, `${order.family_prenom ?? ""} ${order.family_nom ?? ""}`.trim(), Number(order.total_amount), mapped.reduce((s, i) => s + i.qty, 0));
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
        // Ne pas révéler si le compte existe
        return { ok: true };
      }
      await sendPasswordResetEmail(data.email, linkData.properties.action_link);
      return { ok: true };
    } catch (e) {
      console.error("sendCustomPasswordReset:", e);
      return { ok: true }; // toujours ok pour ne pas leak
    }
  });