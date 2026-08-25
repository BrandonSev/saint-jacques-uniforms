import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { withSupabaseAuth } from "@/integrations/supabase/supabase-auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { buildOrderShippingSlipPdf } from "@/server/orderShippingSlipPdf.server";

type AppRole = "admin" | "apel" | "user";
async function userHasAnyRole(userId: string, roles: AppRole[]) {
  const { data } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", userId).in("role", roles);
  return (data ?? []).length > 0;
}

export type ShippingSettings = {
  group_order_deadline: string | null;
  individual_shipping_fee: number;
};

// Lecture publique (nécessaire au checkout, avant connexion admin) des paramètres
// globaux de livraison groupée. Table shipping_settings ajoutée par la migration
// 20260803120000, types Supabase pas encore régénérés.
export const getShippingSettings = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await (supabaseAdmin.from as any)("shipping_settings")
    .select("group_order_deadline, individual_shipping_fee")
    .eq("id", true)
    .maybeSingle();
  if (error || !data) return { group_order_deadline: null, individual_shipping_fee: 0 } as ShippingSettings;
  return {
    group_order_deadline: data.group_order_deadline,
    individual_shipping_fee: Number(data.individual_shipping_fee),
  } as ShippingSettings;
});

export const saveShippingSettings = createServerFn({ method: "POST" })
  .middleware([withSupabaseAuth, requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        groupOrderDeadline: z.string().nullable(),
        individualShippingFee: z.number().min(0),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    if (!(await userHasAnyRole(userId, ["admin"]))) {
      return { ok: false as const, error: "forbidden" as const };
    }
    const { error } = await (supabaseAdmin.from as any)("shipping_settings")
      .update({
        group_order_deadline: data.groupOrderDeadline,
        individual_shipping_fee: data.individualShippingFee,
        updated_by: userId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", true);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

// Génère (ou renvoie, si déjà existant) le bordereau de livraison d'une commande en
// livraison individuelle : réserve un numéro séquentiel BL-ANNÉE-NNNNN, construit le
// PDF (contenu du colis + adresse, sans transporteur/tracking pas encore connus au
// moment de la commande), le stocke, puis enregistre le chemin. Appelée automatiquement
// juste après la création de la commande si delivery_type === "individual".
export const generateOrderShippingSlip = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ orderId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    // Cast : colonne delivery_type ajoutée par la migration 20260803120000, types Supabase pas encore régénérés.
    const { data: order, error: orderError } = await (supabaseAdmin.from as any)("orders")
      .select("id, order_number, delivery_type, shipping_recipient, shipping_address, shipping_postal, shipping_city")
      .eq("id", data.orderId)
      .maybeSingle();
    if (orderError || !order) return { ok: false as const, error: "order_not_found" as const };
    if ((order as any).delivery_type !== "individual") {
      return { ok: false as const, error: "not_individual_delivery" as const };
    }

    const { data: reserved, error: reserveError } = await (supabaseAdmin.rpc as any)(
      "reserve_order_shipping_slip_number",
      { _order_id: data.orderId },
    );
    if (reserveError || !reserved?.[0]) {
      return { ok: false as const, error: reserveError?.message ?? "reserve_failed" };
    }
    const { slip_number: slipNumber, slip_id: slipId } = reserved[0] as { slip_number: string; slip_id: string };

    const { data: items } = await supabaseAdmin
      .from("order_items")
      .select("child_prenom, child_nom, product_name, product_ref, size, quantity")
      .eq("order_id", data.orderId);

    const pdfBuffer = buildOrderShippingSlipPdf({
      slipNumber,
      orderNumber: order.order_number,
      recipient: (order as any).shipping_recipient ?? "",
      address: (order as any).shipping_address ?? "",
      postal: (order as any).shipping_postal ?? "",
      city: (order as any).shipping_city ?? "",
      items: (items ?? []).map((it: any) => ({
        child: `${it.child_prenom} ${it.child_nom}`,
        productName: it.product_name,
        productRef: it.product_ref,
        size: it.size,
        quantity: it.quantity,
      })),
    });

    const pdfPath = `${slipNumber}.pdf`;
    const { error: uploadError } = await supabaseAdmin.storage
      .from("shipping-slips")
      .upload(pdfPath, pdfBuffer, { contentType: "application/pdf", upsert: true });
    if (uploadError) return { ok: false as const, error: uploadError.message };

    await (supabaseAdmin.from as any)("order_shipping_slips").update({ pdf_path: pdfPath }).eq("id", slipId);

    return { ok: true as const, slipNumber, slipId };
  });

export type OrderShippingSlipRow = {
  id: string;
  order_id: string;
  slip_number: string;
  created_at: string;
  pdf_path: string | null;
};

export const getOrderShippingSlip = createServerFn({ method: "POST" })
  .middleware([withSupabaseAuth, requireSupabaseAuth])
  .inputValidator((d) => z.object({ orderId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    if (!(await userHasAnyRole(userId, ["admin"]))) {
      return { ok: false as const, error: "forbidden" as const, slip: null };
    }
    const { data: slip, error } = await (supabaseAdmin.from as any)("order_shipping_slips")
      .select("id, order_id, slip_number, created_at, pdf_path")
      .eq("order_id", data.orderId)
      .maybeSingle();
    if (error) return { ok: false as const, error: error.message, slip: null };
    return { ok: true as const, slip: (slip ?? null) as OrderShippingSlipRow | null };
  });

export const getShippingSlipDownloadUrl = createServerFn({ method: "POST" })
  .middleware([withSupabaseAuth, requireSupabaseAuth])
  .inputValidator((d) => z.object({ orderId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    if (!(await userHasAnyRole(userId, ["admin"]))) {
      return { ok: false as const, error: "forbidden" as const, url: null };
    }
    const { data: slip } = await (supabaseAdmin.from as any)("order_shipping_slips")
      .select("pdf_path")
      .eq("order_id", data.orderId)
      .maybeSingle();
    if (!slip?.pdf_path) return { ok: false as const, error: "not_found" as const, url: null };

    const { data: signed, error } = await supabaseAdmin.storage
      .from("shipping-slips")
      .createSignedUrl(slip.pdf_path, 60 * 10);
    if (error || !signed) return { ok: false as const, error: error?.message ?? "sign_failed", url: null };
    return { ok: true as const, url: signed.signedUrl };
  });
