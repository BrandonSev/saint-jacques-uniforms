import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { buildInvoicesCsv, type InvoiceExportRow } from "@/lib/batchDelivery";
import { createZip, type ZipEntry } from "@/lib/zip";

// Export comptable : ZIP des PDF de factures + CSV récapitulatif pour une liste de commandes.
// Appelé en POST par l'admin (jeton Supabase en Bearer) — une simple URL ne suffit pas pour transmettre
// une sélection de plusieurs centaines de commandes.
const bodySchema = z.object({ orderIds: z.array(z.string().uuid()).min(1).max(2000) });
const CHUNK = 200;
const DOWNLOAD_CONCURRENCY = 6;

async function requireAdmin(request: Request): Promise<Response | null> {
  const token = request.headers.get("authorization")?.replace(/^Bearer /, "");
  if (!token) return new Response("unauthorized", { status: 401 });
  const { data: user, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user?.user) return new Response("unauthorized", { status: 401 });
  const { data: roles } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", user.user.id).eq("role", "admin");
  if ((roles ?? []).length === 0) return new Response("forbidden", { status: 403 });
  return null;
}

export const Route = createFileRoute("/api/admin/invoices-export")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const denied = await requireAdmin(request);
        if (denied) return denied;

        const parsed = bodySchema.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return new Response("invalid body", { status: 400 });
        const ids = [...new Set(parsed.data.orderIds)];

        type OrderRow = {
          id: string;
          order_number: string;
          delivered_at: string | null;
          paid_at: string | null;
          delivery_type: string | null;
          total_amount: number;
          family_nom: string;
          family_prenom: string;
          family_email: string;
        };
        type InvoiceRow = { order_id: string; invoice_number: string; pdf_path: string | null; created_at: string };

        const orders = new Map<string, OrderRow>();
        const invoices: InvoiceRow[] = [];
        for (let i = 0; i < ids.length; i += CHUNK) {
          const part = ids.slice(i, i + CHUNK);
          // Cast : colonne delivery_type ajoutée par la migration 20260803120000, types Supabase pas encore régénérés.
          const { data: o } = await (supabaseAdmin.from as any)("orders")
            .select("id, order_number, delivered_at, paid_at, delivery_type, total_amount, family_nom, family_prenom, family_email")
            .in("id", part);
          for (const r of (o ?? []) as OrderRow[]) orders.set(r.id, r);
          // Cast : table ajoutée par la migration 20260730133000, types Supabase pas encore régénérés.
          const { data: inv } = await (supabaseAdmin.from as any)("order_invoices")
            .select("order_id, invoice_number, pdf_path, created_at")
            .in("order_id", part);
          invoices.push(...((inv ?? []) as InvoiceRow[]));
        }
        invoices.sort((a, b) => a.invoice_number.localeCompare(b.invoice_number));

        const entries: ZipEntry[] = [];
        const rows: InvoiceExportRow[] = [];
        const pdfs = new Map<string, Uint8Array | null>();
        for (let i = 0; i < invoices.length; i += DOWNLOAD_CONCURRENCY) {
          await Promise.all(
            invoices.slice(i, i + DOWNLOAD_CONCURRENCY).map(async (inv) => {
              if (!inv.pdf_path) return void pdfs.set(inv.invoice_number, null);
              const { data, error } = await supabaseAdmin.storage.from("invoices").download(inv.pdf_path);
              pdfs.set(inv.invoice_number, error || !data ? null : new Uint8Array(await data.arrayBuffer()));
            }),
          );
        }

        for (const inv of invoices) {
          const order = orders.get(inv.order_id);
          if (!order) continue;
          const pdf = pdfs.get(inv.invoice_number) ?? null;
          if (pdf) entries.push({ name: `factures/${inv.invoice_number}.pdf`, data: pdf });
          rows.push({
            invoiceNumber: inv.invoice_number,
            invoiceDate: order.paid_at ?? inv.created_at,
            orderNumber: order.order_number,
            deliveredAt: order.delivered_at,
            client: `${order.family_prenom} ${order.family_nom}`.trim(),
            email: order.family_email,
            deliveryType: order.delivery_type,
            totalTtc: Number(order.total_amount),
            pdfMissing: !pdf,
          });
        }
        entries.push({ name: "recap-factures.csv", data: new TextEncoder().encode(buildInvoicesCsv(rows)) });

        const zip = createZip(entries);
        const stamp = new Date().toISOString().slice(0, 10);
        return new Response(zip.buffer as ArrayBuffer, {
          headers: {
            "Content-Type": "application/zip",
            "Content-Disposition": `attachment; filename="factures-${stamp}.zip"`,
            "X-Invoice-Count": String(rows.length),
            "X-Invoice-Missing-Pdf": String(rows.filter((r) => r.pdfMissing).length),
            "Access-Control-Expose-Headers": "X-Invoice-Count, X-Invoice-Missing-Pdf",
          },
        });
      },
    },
  },
});
