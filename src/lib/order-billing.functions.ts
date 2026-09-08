import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { withSupabaseAuth } from "@/integrations/supabase/supabase-auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

type AppRole = "admin" | "apel" | "user";
async function userHasAnyRole(userId: string, roles: AppRole[]) {
  const { data } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", userId).in("role", roles);
  return (data ?? []).length > 0;
}

export type OrderBillingRow = {
  order_id: string;
  billing_name: string | null;
  billing_address: string | null;
  billing_postal: string | null;
  billing_city: string | null;
  invoice_number: string | null;
  note: string | null;
  updated_at: string;
};

export const getOrderBilling = createServerFn({ method: "POST" })
  .middleware([withSupabaseAuth, requireSupabaseAuth])
  .inputValidator((d) => z.object({ orderId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    if (!(await userHasAnyRole(userId, ["admin"]))) {
      return { ok: false as const, error: "forbidden" as const, billing: null };
    }
    // Cast : table ajoutée par la migration 20260730130127, types Supabase pas encore régénérés.
    const { data: billing, error } = await (supabaseAdmin.from as any)("order_billing")
      .select("order_id, billing_name, billing_address, billing_postal, billing_city, invoice_number, note, updated_at")
      .eq("order_id", data.orderId)
      .maybeSingle();
    if (error) return { ok: false as const, error: error.message, billing: null };
    return { ok: true as const, billing: (billing ?? null) as OrderBillingRow | null };
  });

export const saveOrderBilling = createServerFn({ method: "POST" })
  .middleware([withSupabaseAuth, requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        orderId: z.string().uuid(),
        billingName: z.string().max(200).optional(),
        billingAddress: z.string().max(300).optional(),
        billingPostal: z.string().max(20).optional(),
        billingCity: z.string().max(120).optional(),
        invoiceNumber: z.string().max(60).optional(),
        note: z.string().max(500).optional(),
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
      .select("id, status")
      .eq("id", data.orderId)
      .maybeSingle();
    if (orderError || !order) return { ok: false as const, error: "order_not_found" as const };
    if (order.status !== "Livrée") {
      return { ok: false as const, error: "order_not_delivered" as const };
    }

    // Cast : table ajoutée par la migration 20260730130127, types Supabase pas encore régénérés.
    const { error } = await (supabaseAdmin.from as any)("order_billing").upsert(
      {
        order_id: data.orderId,
        billing_name: data.billingName || null,
        billing_address: data.billingAddress || null,
        billing_postal: data.billingPostal || null,
        billing_city: data.billingCity || null,
        invoice_number: data.invoiceNumber || null,
        note: data.note || null,
        updated_by: userId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "order_id" },
    );
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });
