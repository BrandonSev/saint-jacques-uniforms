import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { withSupabaseAuth } from "@/integrations/supabase/supabase-auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { applyOrderStatus, generateInvoiceForOrder, syncDeliveredHistoryDate } from "@/server/orderInvoice.server";

type AppRole = "admin" | "apel" | "user";
async function userHasAnyRole(userId: string, roles: AppRole[]) {
  const { data } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", userId).in("role", roles);
  return (data ?? []).length > 0;
}

export type OrderInvoiceRow = {
  id: string;
  order_id: string;
  invoice_number: string;
  created_at: string;
  pdf_path: string | null;
};

// Génération de la facture d'une commande livrée (numéro comptable séquentiel + PDF), voir
// generateInvoiceForOrder. Appelée automatiquement au passage du statut à "Livrée" (updateOrderStatus,
// lots de commandes) et jamais régénérée ensuite pour une même commande.
export const generateOrderInvoice = createServerFn({ method: "POST" })
  .middleware([withSupabaseAuth, requireSupabaseAuth])
  .inputValidator((d) => z.object({ orderId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    if (!(await userHasAnyRole(userId, ["admin"]))) {
      return { ok: false as const, error: "forbidden" as const };
    }
    return generateInvoiceForOrder(data.orderId);
  });

export const getOrderInvoice = createServerFn({ method: "POST" })
  .middleware([withSupabaseAuth, requireSupabaseAuth])
  .inputValidator((d) => z.object({ orderId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    if (!(await userHasAnyRole(userId, ["admin"]))) {
      return { ok: false as const, error: "forbidden" as const, invoice: null };
    }
    // Cast : table ajoutée par la migration 20260730133000, types Supabase pas encore régénérés.
    const { data: invoice, error } = await (supabaseAdmin.from as any)("order_invoices")
      .select("id, order_id, invoice_number, created_at, pdf_path")
      .eq("order_id", data.orderId)
      .maybeSingle();
    if (error) return { ok: false as const, error: error.message, invoice: null };
    return { ok: true as const, invoice: (invoice ?? null) as OrderInvoiceRow | null };
  });

export const getInvoiceDownloadUrl = createServerFn({ method: "POST" })
  .middleware([withSupabaseAuth, requireSupabaseAuth])
  .inputValidator((d) => z.object({ orderId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    if (!(await userHasAnyRole(userId, ["admin"]))) {
      return { ok: false as const, error: "forbidden" as const, url: null };
    }
    // Cast : table ajoutée par la migration 20260730133000, types Supabase pas encore régénérés.
    const { data: invoice } = await (supabaseAdmin.from as any)("order_invoices")
      .select("pdf_path")
      .eq("order_id", data.orderId)
      .maybeSingle();
    if (!invoice?.pdf_path) return { ok: false as const, error: "not_found" as const, url: null };

    const { data: signed, error } = await supabaseAdmin.storage
      .from("invoices")
      .createSignedUrl(invoice.pdf_path, 60 * 10);
    if (error || !signed) return { ok: false as const, error: error?.message ?? "sign_failed", url: null };
    return { ok: true as const, url: signed.signedUrl };
  });

// Remplace la mise à jour directe côté client du statut : quand le nouveau statut est "Livrée",
// déclenche automatiquement la génération de facture dans la même requête serveur.
export const updateOrderStatus = createServerFn({ method: "POST" })
  .middleware([withSupabaseAuth, requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        orderId: z.string().uuid(),
        status: z.string(),
        trackingNumber: z.string().nullable().optional(),
        trackingCarrier: z.string().nullable().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    if (!(await userHasAnyRole(userId, ["admin"]))) {
      return { ok: false as const, error: "forbidden" as const };
    }

    const error = await applyOrderStatus(data.orderId, data.status, {
      trackingNumber: data.trackingNumber,
      trackingCarrier: data.trackingCarrier,
    });
    if (error) return { ok: false as const, error };

    let invoiceNumber: string | null = null;
    if (data.status === "Livrée") {
      const result = await generateInvoiceForOrder(data.orderId);
      if (result.ok) invoiceNumber = result.invoiceNumber;
    }

    return { ok: true as const, invoiceNumber };
  });

// Correction a posteriori de la date de livraison d'une commande livrée (information seulement :
// la facture porte la date de paiement et n'est pas affectée).
export const setOrderDeliveredDate = createServerFn({ method: "POST" })
  .middleware([withSupabaseAuth, requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        orderId: z.string().uuid(),
        deliveredAt: z.string().datetime(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    if (!(await userHasAnyRole(userId, ["admin"]))) {
      return { ok: false as const, error: "forbidden" as const };
    }
    const { data: order } = await supabaseAdmin.from("orders").select("status").eq("id", data.orderId).maybeSingle();
    if (!order) return { ok: false as const, error: "order_not_found" as const };
    if (order.status !== "Livrée") return { ok: false as const, error: "order_not_delivered" as const };

    const { error } = await supabaseAdmin.from("orders").update({ delivered_at: data.deliveredAt }).eq("id", data.orderId);
    if (error) return { ok: false as const, error: error.message };
    await syncDeliveredHistoryDate(data.orderId, data.deliveredAt);
    return { ok: true as const };
  });
