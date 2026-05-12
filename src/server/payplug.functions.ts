import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { withSupabaseAuth } from "@/integrations/supabase/supabase-auth-middleware";
import { createPayplugPayment } from "./payplug.server";
import { fetchPayplugPayment } from "./payplug.server";
import { getRequestHost } from "@tanstack/react-start/server";

function appBaseUrl() {
  // Privilégie l'URL publiée si disponible, sinon la host courante
  const envUrl = process.env.PUBLIC_APP_URL;
  if (envUrl) return envUrl.replace(/\/$/, "");
  try {
    const host = getRequestHost();
    const protocol = host?.includes("localhost") ? "http" : "https";
    return `${protocol}://${host}`;
  } catch {
    return "https://saint-jacques.lovable.app";
  }
}

export const createOrderPayment = createServerFn({ method: "POST" })
  .middleware([withSupabaseAuth, requireSupabaseAuth])
  .inputValidator((d) => z.object({ orderId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: order, error } = await supabase
      .from("orders")
      .select(
        "id, order_number, total_amount, status, family_email, family_prenom, family_nom, shipping_mode, shipping_address, shipping_postal, shipping_city, shipping_recipient, payplug_payment_id, payment_url, user_id",
      )
      .eq("id", data.orderId)
      .maybeSingle();
    if (error || !order) return { ok: false as const, error: "order_not_found" };
    if (order.user_id !== userId) return { ok: false as const, error: "forbidden" };

    // Si déjà payée
    if (order.status === "Paiement validé" || order.status === "Livrée" || order.status === "Retirée") {
      return { ok: false as const, error: "already_paid" };
    }

    // Réutilise un paiement existant uniquement s'il est encore valide chez PayPlug
    if (order.payplug_payment_id && order.payment_url) {
      try {
        const existing = await fetchPayplugPayment(order.payplug_payment_id);
        if (existing.is_paid) {
          // Sync DB et empêche un re-paiement
          await supabase
            .from("orders")
            .update({ status: "Paiement validé", paid_at: new Date().toISOString() })
            .eq("id", order.id);
          return { ok: false as const, error: "already_paid" };
        }
        // Si le paiement n'a pas échoué/expiré, on peut réutiliser le lien hébergé
        if (!existing.failure) {
          return {
            ok: true as const,
            paymentUrl: order.payment_url,
            paymentId: order.payplug_payment_id,
            reused: true,
          };
        }
        // Sinon (échec/expiration/annulation) on en crée un nouveau ci-dessous
      } catch (e) {
        console.warn("createOrderPayment: existing payment fetch failed, creating a new one", e);
      }
    }

    const base = appBaseUrl();
    const amountCents = Math.round(Number(order.total_amount) * 100);
    if (amountCents <= 0) return { ok: false as const, error: "invalid_amount" };

    const isPickup = order.shipping_mode === "pickup";
    const shipping = {
      address1: isPickup ? "Retrait établissement" : (order.shipping_address ?? "—"),
      city: isPickup ? "Dax" : (order.shipping_city ?? "Dax"),
      postcode: isPickup ? "40100" : (order.shipping_postal ?? "40100"),
      country: "FR",
      deliveryType: (isPickup ? "SHIP_TO_STORE" : "BILLING") as "SHIP_TO_STORE" | "BILLING",
    };

    try {
      const payment = await createPayplugPayment({
        amount: amountCents,
        currency: "EUR",
        email: order.family_email,
        firstName: order.family_prenom || "Client",
        lastName: order.family_nom || "Saint-Jacques",
        language: "fr",
        shipping,
        notificationUrl: `${base}/api/public/payplug-webhook`,
        returnUrl: `${base}/commandes/retour-paiement?order=${order.id}`,
        cancelUrl: `${base}/commandes/retour-paiement?order=${order.id}&cancel=1`,
        metadata: { order_id: order.id, order_number: order.order_number },
      });
      const url = payment.hosted_payment?.payment_url;
      if (!url) return { ok: false as const, error: "no_payment_url" };

      await supabase
        .from("orders")
        .update({ payplug_payment_id: payment.id, payment_url: url, status: "En attente paiement" })
        .eq("id", order.id);

      return { ok: true as const, paymentUrl: url, paymentId: payment.id, reused: false };
    } catch (e: any) {
      console.error("createOrderPayment:", e);
      return { ok: false as const, error: "create_failed", detail: String(e?.message ?? e) };
    }
  });
