import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { withSupabaseAuth } from "@/integrations/supabase/supabase-auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { refundPayplugPayment } from "@/server/payplug.server";

type AppRole = "admin" | "apel" | "user";
async function userHasAnyRole(userId: string, roles: AppRole[]) {
  const { data } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", userId).in("role", roles);
  return (data ?? []).length > 0;
}

export type OrderRefundRow = {
  id: string;
  order_id: string;
  order_item_ids: string[];
  amount: number;
  reason: string | null;
  status: string;
  error_message: string | null;
  created_at: string;
};

export const listOrderRefunds = createServerFn({ method: "POST" })
  .middleware([withSupabaseAuth, requireSupabaseAuth])
  .inputValidator((d) => z.object({ orderId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    if (!(await userHasAnyRole(userId, ["admin"]))) {
      return { ok: false as const, error: "forbidden" as const, refunds: [] };
    }
    // Cast : table ajoutée par la migration 20260727140000, types Supabase pas encore régénérés.
    const { data: refunds, error } = await (supabaseAdmin.from as any)("order_refunds")
      .select("id, order_id, order_item_ids, amount, reason, status, error_message, created_at")
      .eq("order_id", data.orderId)
      .order("created_at", { ascending: false });
    if (error) return { ok: false as const, error: error.message, refunds: [] };
    return { ok: true as const, refunds: (refunds ?? []) as OrderRefundRow[] };
  });

export const refundOrder = createServerFn({ method: "POST" })
  .middleware([withSupabaseAuth, requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        orderId: z.string().uuid(),
        orderItemIds: z.array(z.string().uuid()).min(1),
        reason: z.string().max(500).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    if (!(await userHasAnyRole(userId, ["admin"]))) {
      return { ok: false as const, error: "forbidden" as const };
    }

    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .select("id, total_amount, payplug_payment_id")
      .eq("id", data.orderId)
      .maybeSingle();
    if (orderError || !order) return { ok: false as const, error: "order_not_found" as const };
    if (!order.payplug_payment_id) return { ok: false as const, error: "no_payment" as const };

    const { data: items, error: itemsError } = await supabaseAdmin
      .from("order_items")
      .select("id, line_total")
      .eq("order_id", data.orderId)
      .in("id", data.orderItemIds);
    if (itemsError || !items || items.length === 0) return { ok: false as const, error: "no_items" as const };

    const amount = items.reduce((sum: number, item: any) => sum + Number(item.line_total), 0);
    const amountCents = Math.round(amount * 100);

    // Réservation atomique : verrouille la ligne order (SELECT ... FOR UPDATE côté serveur)
    // et re-vérifie qu'aucun item sélectionné n'est déjà couvert par un remboursement réussi,
    // le tout dans une seule transaction Postgres — empêche deux appels concurrents de passer
    // tous les deux la vérification avant qu'un insert n'atterrisse (TOCTOU).
    // Cast : fonction ajoutée par la migration 20260727150000, types Supabase pas encore régénérés.
    const { data: reservedRefundId, error: reserveError } = await (supabaseAdmin.rpc as any)(
      "reserve_order_refund",
      {
        _order_id: data.orderId,
        _order_item_ids: data.orderItemIds,
        _amount: amount,
        _reason: data.reason ?? null,
        _created_by: userId,
      },
    );
    if (reserveError) {
      if (String(reserveError.message ?? "").includes("already_refunded")) {
        return { ok: false as const, error: "already_refunded" as const };
      }
      return { ok: false as const, error: reserveError.message };
    }
    const refundId = reservedRefundId as string;

    // L'appel réseau PayPlug se fait hors du verrou (le verrou a déjà été relâché : la
    // transaction de reserve_order_refund a commité dès son retour).
    let payplugResult: { refundId: string | null; status: "Réussi" | "Échoué"; errorMessage: string | null };
    try {
      const refund = await refundPayplugPayment(order.payplug_payment_id, amountCents);
      payplugResult = { refundId: refund.id, status: "Réussi", errorMessage: null };
    } catch (e: any) {
      payplugResult = { refundId: null, status: "Échoué", errorMessage: e?.message ?? String(e) };
    }

    // Cast : table ajoutée par la migration 20260727140000, types Supabase pas encore régénérés.
    const { error: updateError } = await (supabaseAdmin.from as any)("order_refunds")
      .update({
        status: payplugResult.status,
        payplug_refund_id: payplugResult.refundId,
        error_message: payplugResult.errorMessage,
      })
      .eq("id", refundId);
    if (updateError) return { ok: false as const, error: updateError.message };

    if (payplugResult.status === "Échoué") {
      return { ok: false as const, error: payplugResult.errorMessage ?? "refund_failed" };
    }

    // Cast : table ajoutée par la migration 20260727140000, types Supabase pas encore régénérés.
    const { data: successfulRefunds } = await (supabaseAdmin.from as any)("order_refunds")
      .select("amount")
      .eq("order_id", data.orderId)
      .eq("status", "Réussi");
    const totalRefunded = (successfulRefunds ?? []).reduce((s: number, r: any) => s + Number(r.amount), 0);
    if (totalRefunded >= Number(order.total_amount)) {
      await supabaseAdmin.from("orders").update({ status: "Remboursée" }).eq("id", data.orderId);
    }

    return { ok: true as const, refundId, amount };
  });
