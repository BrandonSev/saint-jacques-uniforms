import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { fetchPayplugPayment } from "@/server/payplug.server";
import {
  sendOrderConfirmation,
  sendAdminOrderNotification,
  sendOrderStatusEmail,
  type OrderEmailItem,
} from "@/server/email.server";

export const Route = createFileRoute("/api/public/payplug-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: any;
        try {
          body = await request.json();
        } catch {
          return new Response("invalid json", { status: 400 });
        }
        const id = body?.id || body?.object?.id;
        if (!id) return new Response("missing id", { status: 400 });

        // Sécurité : on revalide auprès de PayPlug avec notre clé secrète
        let payment;
        try {
          payment = await fetchPayplugPayment(id);
        } catch (e) {
          console.error("payplug webhook fetch:", e);
          return new Response("verify failed", { status: 502 });
        }

        const orderId = payment.metadata?.order_id;
        if (!orderId) return new Response("no order metadata", { status: 200 });

        const { data: order } = await supabaseAdmin
          .from("orders")
          .select("id, order_number, status, family_email, family_prenom, family_nom, total_amount, paid_at")
          .eq("id", orderId)
          .maybeSingle();
        if (!order) return new Response("order not found", { status: 200 });

        const wasPaid = !!order.paid_at;

        if (payment.is_paid) {
          if (!wasPaid) {
            await supabaseAdmin
              .from("orders")
              .update({ status: "Paiement validé", paid_at: new Date().toISOString() })
              .eq("id", orderId);

            // Emails
            try {
              const { data: items } = await supabaseAdmin
                .from("order_items")
                .select("product_name, size, quantity, unit_price, child_prenom")
                .eq("order_id", orderId);
              const mapped: OrderEmailItem[] = (items ?? []).map((i: any) => ({
                name: i.product_name,
                size: i.size,
                qty: i.quantity,
                price: Number(i.unit_price),
                child: i.child_prenom ?? "—",
              }));
              if (order.family_email) {
                await sendOrderConfirmation(order.family_email, order.family_prenom ?? "", order.order_number, mapped, Number(order.total_amount));
                await sendOrderStatusEmail(order.family_email, order.family_prenom ?? "", order.order_number, "Paiement validé");
              }
              const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || process.env.SMTP_USER;
              if (adminEmail) {
                await sendAdminOrderNotification(adminEmail, order.order_number, `${order.family_prenom ?? ""} ${order.family_nom ?? ""}`.trim(), Number(order.total_amount), mapped.reduce((s, i) => s + i.qty, 0));
              }
            } catch (e) {
              console.error("payplug webhook emails:", e);
            }
          }
        } else if (payment.failure) {
          await supabaseAdmin
            .from("orders")
            .update({ status: "Paiement échoué" })
            .eq("id", orderId);
          // Aucun email n'est envoyé en cas d'échec : seuls les paiements validés déclenchent des emails.
        }

        return new Response("ok", { status: 200 });
      },
    },
  },
});