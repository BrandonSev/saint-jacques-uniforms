import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { fetchPayplugPayment } from "@/server/payplug.server";
import { fetchFuStock, decrementFuStock } from "@/server/franceUniformes.server";
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
          .select("id, order_number, status, family_email, family_prenom, family_nom, total_amount, paid_at, payplug_payment_id")
          .eq("id", orderId)
          .maybeSingle();
        if (!order) return new Response("order not found", { status: 200 });

        const wasPaid = !!order.paid_at || order.status === "Paiement validé";

        // Ignore les anciens échecs, mais accepte toujours un paiement confirmé :
        // si la sauvegarde du nouveau payment_id a été retardée/échouée, le succès doit gagner.
        if (order.payplug_payment_id && order.payplug_payment_id !== id && !payment.is_paid) {
          return new Response("stale payment id", { status: 200 });
        }

        if (payment.is_paid) {
          if (!wasPaid) {
            const { error: updateError } = await supabaseAdmin
              .from("orders")
              .update({ status: "Paiement validé", paid_at: new Date().toISOString(), payplug_payment_id: id })
              .eq("id", orderId);
            if (updateError) {
              console.error("payplug webhook paid update:", updateError);
              return new Response("update failed", { status: 500 });
            }

            // Déduit le stock des blouses officielles (silencieux en cas d'erreur)
            try {
              await supabaseAdmin.rpc("decrement_blouse_stock", { _order_id: orderId });
            } catch (e) {
              console.error("payplug webhook decrement_blouse_stock:", e);
            }

            // France Uniformes est la source de vérité du stock réel (affiché
            // en live via /api/public/fu-stock) : il faut le décrémenter là
            // aussi, sans quoi le compteur ne bougerait jamais pour les
            // acheteurs suivants. Idempotency-Key = commande + taille, pour
            // qu'un rejeu du webhook ne décrémente pas deux fois.
            try {
              const { data: blouseItems } = await supabaseAdmin
                .from("order_items")
                .select("size, quantity")
                .eq("order_id", orderId)
                .eq("product_id", "blouse-officielle");

              if (blouseItems && blouseItems.length > 0) {
                const bySize = new Map<string, number>();
                for (const it of blouseItems as Array<{ size: string; quantity: number }>) {
                  bySize.set(it.size, (bySize.get(it.size) ?? 0) + it.quantity);
                }

                const fuStock = await fetchFuStock();
                for (const [size, qty] of bySize) {
                  const match = fuStock.find((s) => s.size === size);
                  if (!match) {
                    console.error(`payplug webhook fu decrement: taille FU introuvable pour "${size}"`);
                    continue;
                  }
                  await decrementFuStock({
                    skuExterne: match.skuExterne,
                    qty,
                    idempotencyKey: `${orderId}-${size}`,
                    idOrder: orderId,
                  });
                }
              }
            } catch (e) {
              console.error("payplug webhook fu decrement:", e);
            }

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
          // N'écrase pas un paiement déjà validé
          if (wasPaid) return new Response("already paid, ignoring failure", { status: 200 });
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