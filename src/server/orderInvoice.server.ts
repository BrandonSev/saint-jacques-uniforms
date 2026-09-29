import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { buildOrderInvoicePdf } from "@/server/orderInvoicePdf.server";
import { buildDeliveryLabel } from "@/lib/batchDelivery";

export type GenerateInvoiceResult =
  | { ok: true; invoiceNumber: string; invoiceId: string }
  | { ok: false; error: string };

// Génère (ou renvoie, si déjà existante) la facture d'une commande livrée : réserve un numéro
// comptable séquentiel de façon atomique (FU-B-ANNÉE-NNNNN pour une commande individuelle,
// FU-BE-ANNÉE-NNNNN pour une commande groupée — séquences indépendantes par préfixe, voir
// reserve_order_invoice_number), construit le PDF, le stocke, puis enregistre le chemin. Idempotent :
// une commande déjà facturée conserve son numéro (le PDF est simplement reconstruit).
// Aucun contrôle de rôle ici : l'appelant (server function admin ou worker de lot) en est responsable.
export async function generateInvoiceForOrder(orderId: string): Promise<GenerateInvoiceResult> {
  const { data: order, error: orderError } = await supabaseAdmin
    .from("orders")
    .select("id, user_id, order_number, status, total_amount, paid_at, family_civilite, family_nom, family_prenom, family_email, family_telephone")
    .eq("id", orderId)
    .maybeSingle();
  if (orderError || !order) return { ok: false, error: "order_not_found" };
  if (order.status !== "Livrée") return { ok: false, error: "order_not_delivered" };

  // Cast : fonction ajoutée par la migration 20260730133000, types Supabase pas encore régénérés.
  const { data: reserved, error: reserveError } = await (supabaseAdmin.rpc as any)("reserve_order_invoice_number", {
    _order_id: orderId,
  });
  if (reserveError || !reserved?.[0]) {
    return { ok: false, error: reserveError?.message ?? "reserve_failed" };
  }
  const { invoice_number: invoiceNumber, invoice_id: invoiceId } = reserved[0] as {
    invoice_number: string;
    invoice_id: string;
  };

  // Coordonnées du client : profil de la famille (adresse, téléphone) — la commande ne stocke que le nom,
  // l'e-mail et le téléphone au moment de l'achat. Une éventuelle saisie manuelle historique
  // (table order_billing, ancien formulaire « Facturation ») reste prioritaire.
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("adresse, code_postal, ville, telephone")
    .eq("id", order.user_id)
    .maybeSingle();
  // Cast : table ajoutée par la migration 20260730130127, types Supabase pas encore régénérés.
  const { data: legacyBilling } = await (supabaseAdmin.from as any)("order_billing")
    .select("billing_name, billing_address, billing_postal, billing_city")
    .eq("order_id", orderId)
    .maybeSingle();
  const billing = {
    name: legacyBilling?.billing_name ?? null,
    address: legacyBilling?.billing_address ?? profile?.adresse ?? null,
    postal: legacyBilling?.billing_postal ?? profile?.code_postal ?? null,
    city: legacyBilling?.billing_city ?? profile?.ville ?? null,
  };

  // Cast : colonnes de livraison ajoutées par la migration 20260803120000, types Supabase pas encore régénérés.
  const { data: delivery } = await (supabaseAdmin.from as any)("orders")
    .select("delivery_type, shipping_recipient, shipping_address, shipping_postal, shipping_city")
    .eq("id", orderId)
    .maybeSingle();
  const deliveryLabel = buildDeliveryLabel(delivery);

  const { data: items } = await supabaseAdmin
    .from("order_items")
    .select("child_prenom, child_nom, product_name, product_ref, size, quantity, unit_price, line_total")
    .eq("order_id", orderId);

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
      phone: order.family_telephone ?? profile?.telephone ?? null,
    },
    billing,
    deliveryLabel,
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
  if (uploadError) return { ok: false, error: uploadError.message };

  // Cast : table ajoutée par la migration 20260730133000, types Supabase pas encore régénérés.
  await (supabaseAdmin.from as any)("order_invoices").update({ pdf_path: pdfPath }).eq("id", invoiceId);

  return { ok: true, invoiceNumber, invoiceId };
}

/**
 * Aligne la date de la ligne « Livrée » de l'historique de statuts (créée par trigger à l'instant du
 * changement) sur la date de livraison retenue, pour que l'historique reste cohérent avec `delivered_at`.
 */
export async function syncDeliveredHistoryDate(orderId: string, deliveredAtIso: string): Promise<void> {
  const { data: row } = await supabaseAdmin
    .from("order_status_history")
    .select("id")
    .eq("order_id", orderId)
    .eq("status", "Livrée")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (row) await supabaseAdmin.from("order_status_history").update({ created_at: deliveredAtIso }).eq("id", row.id);
}

export type ApplyStatusOptions = {
  trackingNumber?: string | null;
  trackingCarrier?: string | null;
  /** Date de livraison à enregistrer pour « Livrée » (absente : maintenant). */
  deliveredAt?: string;
};

/** Change le statut d'une commande (et `delivered_at` pour « Livrée »). Renvoie un message d'erreur ou null. */
export async function applyOrderStatus(
  orderId: string,
  status: string,
  opts: ApplyStatusOptions = {},
): Promise<string | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const update: any = { status };
  if (opts.trackingNumber !== undefined) update.tracking_number = opts.trackingNumber;
  if (opts.trackingCarrier !== undefined) update.tracking_carrier = opts.trackingCarrier;
  if (status === "Livrée") update.delivered_at = opts.deliveredAt ?? new Date().toISOString();

  const { error } = await supabaseAdmin.from("orders").update(update).eq("id", orderId);
  if (error) return error.message;
  if (status === "Livrée" && opts.deliveredAt) await syncDeliveredHistoryDate(orderId, opts.deliveredAt);
  return null;
}
