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

    // Cast : table ajoutée par la migration 20260727140000, types Supabase pas encore régénérés.
    const { data: previousRefunds } = await (supabaseAdmin.from as any)("order_refunds")
      .select("order_item_ids, amount, status")
      .eq("order_id", data.orderId)
      .eq("status", "Réussi");

    // Un item déjà couvert par un remboursement réussi antérieur ne peut pas être re-sélectionné.
    const alreadyRefundedItemIds = new Set(
      (previousRefunds ?? []).flatMap((r: any) => r.order_item_ids as string[]),
    );
    const duplicate = data.orderItemIds.find((id) => alreadyRefundedItemIds.has(id));
    if (duplicate) return { ok: false as const, error: "already_refunded" as const };

    const amount = items.reduce((sum: number, item: any) => sum + Number(item.line_total), 0);
    const amountCents = Math.round(amount * 100);

    let payplugResult: { refundId: string | null; status: "Réussi" | "Échoué"; errorMessage: string | null };
    try {
      const refund = await refundPayplugPayment(order.payplug_payment_id, amountCents);
      payplugResult = { refundId: refund.id, status: "Réussi", errorMessage: null };
    } catch (e: any) {
      payplugResult = { refundId: null, status: "Échoué", errorMessage: e?.message ?? String(e) };
    }

    const { data: inserted, error: insertError } = await (supabaseAdmin.from as any)("order_refunds")
      .insert({
        order_id: data.orderId,
        order_item_ids: data.orderItemIds,
        amount,
        reason: data.reason ?? null,
        payplug_refund_id: payplugResult.refundId,
        status: payplugResult.status,
        error_message: payplugResult.errorMessage,
        created_by: userId,
      })
      .select("id")
      .single();
    if (insertError) return { ok: false as const, error: insertError.message };

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

    return { ok: true as const, refundId: inserted.id as string, amount };
  });
