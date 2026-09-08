import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { withSupabaseAuth } from "@/integrations/supabase/supabase-auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { buildOrderInvoicePdf } from "@/server/orderInvoicePdf.server";

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

// Génère (ou renvoie, si déjà existante) la facture d'une commande livrée : réserve un numéro
// comptable séquentiel FA-ANNÉE-NNNNN de façon atomique, construit le PDF, le stocke, puis
// enregistre le chemin. Appelée automatiquement au passage du statut à "Livrée" (voir
// updateOrderStatus) et jamais régénérée ensuite pour une même commande.
export const generateOrderInvoice = createServerFn({ method: "POST" })
  .middleware([withSupabaseAuth, requireSupabaseAuth])
  .inputValidator((d) => z.object({ orderId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    if (!(await userHasAnyRole(userId, ["admin"]))) {
      return { ok: false as const, error: "forbidden" as const };
    }

    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .select("id, order_number, status, total_amount, paid_at, family_civilite, family_nom, family_prenom, family_email")
      .eq("id", data.orderId)
      .maybeSingle();
    if (orderError || !order) return { ok: false as const, error: "order_not_found" as const };
    if (order.status !== "Livrée") return { ok: false as const, error: "order_not_delivered" as const };

    // Cast : fonction ajoutée par la migration 20260730133000, types Supabase pas encore régénérés.
    const { data: reserved, error: reserveError } = await (supabaseAdmin.rpc as any)(
      "reserve_order_invoice_number",
      { _order_id: data.orderId },
    );
    if (reserveError || !reserved?.[0]) {
      return { ok: false as const, error: reserveError?.message ?? "reserve_failed" };
    }
    const { invoice_number: invoiceNumber, invoice_id: invoiceId } = reserved[0] as {
      invoice_number: string;
      invoice_id: string;
    };

    // Cast : table ajoutée par la migration 20260730130127, types Supabase pas encore régénérés.
    const { data: billing } = await (supabaseAdmin.from as any)("order_billing")
      .select("billing_name, billing_address, billing_postal, billing_city")
      .eq("order_id", data.orderId)
      .maybeSingle();

    const { data: items } = await supabaseAdmin
      .from("order_items")
      .select("child_prenom, child_nom, product_name, product_ref, size, quantity, unit_price, line_total")
      .eq("order_id", data.orderId);

    const pdfBuffer = buildOrderInvoicePdf({
      invoiceNumber,
      orderNumber: order.order_number,
      paidAt: order.paid_at,
      totalAmount: Number(order.total_amount),
      family: {
        civilite: order.family_civilite,
        prenom: order.family_prenom,
        nom: order.family_nom,
        email: order.family_email,
      },
      billing: {
        name: billing?.billing_name ?? null,
        address: billing?.billing_address ?? null,
        postal: billing?.billing_postal ?? null,
        city: billing?.billing_city ?? null,
      },
      items: (items ?? []).map((it: any) => ({
        child: `${it.child_prenom} ${it.child_nom}`,
        productName: it.product_name,
        productRef: it.product_ref,
        size: it.size,
        quantity: it.quantity,
        unitPrice: Number(it.unit_price),
        lineTotal: Number(it.line_total),
      })),
    });

    const pdfPath = `${invoiceNumber}.pdf`;
    const { error: uploadError } = await supabaseAdmin.storage
      .from("invoices")
      .upload(pdfPath, pdfBuffer, { contentType: "application/pdf", upsert: true });
    if (uploadError) return { ok: false as const, error: uploadError.message };

    // Cast : table ajoutée par la migration 20260730133000, types Supabase pas encore régénérés.
    await (supabaseAdmin.from as any)("order_invoices").update({ pdf_path: pdfPath }).eq("id", invoiceId);

    return { ok: true as const, invoiceNumber, invoiceId };
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const update: any = { status: data.status };
    if (data.trackingNumber !== undefined) update.tracking_number = data.trackingNumber;
    if (data.trackingCarrier !== undefined) update.tracking_carrier = data.trackingCarrier;
    if (data.status === "Livrée") update.delivered_at = new Date().toISOString();

    const { error } = await supabaseAdmin.from("orders").update(update).eq("id", data.orderId);
    if (error) return { ok: false as const, error: error.message };

    let invoiceNumber: string | null = null;
    if (data.status === "Livrée") {
      const result = await generateOrderInvoice({ data: { orderId: data.orderId } });
      if (result.ok) invoiceNumber = result.invoiceNumber;
    }

    return { ok: true as const, invoiceNumber };
  });
