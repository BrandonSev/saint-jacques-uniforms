import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { withSupabaseAuth } from "@/integrations/supabase/supabase-auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { resumeStaleOrderBatchJobs, startOrderBatchJob } from "@/server/orderBatch.server";
import { BATCH_PROTECTED_STATUSES, BATCH_TARGET_STATUSES, planInvoiceRanges } from "@/lib/batchDelivery";

type AppRole = "admin" | "apel" | "user";
async function userHasAnyRole(userId: string, roles: AppRole[]) {
  const { data } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", userId).in("role", roles);
  return (data ?? []).length > 0;
}

// Cast : tables ajoutées par les migrations 20260730133000 et 20260924120000, types Supabase pas encore régénérés.
const jobs = () => (supabaseAdmin.from as any)("order_batch_jobs");
const jobItems = () => (supabaseAdmin.from as any)("order_batch_job_items");

const MAX_ORDERS = 2000;
const CHUNK = 200;

function chunks<T>(arr: T[], size = CHUNK): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

type OrderLite = { id: string; status: string; delivery_type: string | null; paid_at: string | null };

async function fetchOrders(ids: string[]): Promise<OrderLite[]> {
  const out: OrderLite[] = [];
  for (const part of chunks(ids)) {
    // Cast : colonne delivery_type ajoutée par la migration 20260803120000, types Supabase pas encore régénérés.
    const { data } = await (supabaseAdmin.from as any)("orders").select("id, status, delivery_type, paid_at").in("id", part);
    out.push(...((data ?? []) as OrderLite[]));
  }
  return out;
}

async function fetchInvoicedIds(ids: string[]): Promise<Set<string>> {
  const set = new Set<string>();
  for (const part of chunks(ids)) {
    const { data } = await (supabaseAdmin.from as any)("order_invoices").select("order_id").in("order_id", part);
    for (const r of (data ?? []) as { order_id: string }[]) set.add(r.order_id);
  }
  return set;
}

const targetSchema = z.enum(BATCH_TARGET_STATUSES);

// Aperçu avant lancement : ce que le lot va faire, sans rien écrire.
export const previewOrderBatch = createServerFn({ method: "POST" })
  .middleware([withSupabaseAuth, requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ orderIds: z.array(z.string().uuid()).min(1).max(MAX_ORDERS), targetStatus: targetSchema }).parse(d),
  )
  .handler(async ({ data, context }) => {
    if (!(await userHasAnyRole(context.userId, ["admin"]))) {
      return { ok: false as const, error: "forbidden" as const };
    }
    const orders = await fetchOrders([...new Set(data.orderIds)]);
    const protectedStatuses = BATCH_PROTECTED_STATUSES as readonly string[];
    const eligible = orders.filter((o) => !protectedStatuses.includes(o.status));
    const skipped = orders.length - eligible.length;
    const alreadyAtTarget = eligible.filter((o) => o.status === data.targetStatus).length;

    let invoiceRanges: ReturnType<typeof planInvoiceRanges> = [];
    let alreadyInvoiced = 0;
    if (data.targetStatus === "Livrée") {
      const invoiced = await fetchInvoicedIds(eligible.map((o) => o.id));
      alreadyInvoiced = invoiced.size;
      const year = new Date().getFullYear();
      const { data: counters } = await (supabaseAdmin.from as any)("invoice_counters")
        .select("prefix, last_sequence")
        .eq("year", year);
      const lastSequences: Record<string, number> = {};
      for (const c of (counters ?? []) as { prefix: string; last_sequence: number }[]) lastSequences[c.prefix] = c.last_sequence;
      invoiceRanges = planInvoiceRanges(
        eligible.map((o) => ({ delivery_type: o.delivery_type, hasInvoice: invoiced.has(o.id) })),
        lastSequences,
        year,
      );
    }

    return {
      ok: true as const,
      total: orders.length,
      toProcess: eligible.length,
      skipped,
      alreadyAtTarget,
      alreadyInvoiced,
      invoiceRanges,
    };
  });

// Crée le lot puis le lance en arrière-plan : la réponse est immédiate, le traitement continue côté serveur.
export const createOrderBatchJob = createServerFn({ method: "POST" })
  .middleware([withSupabaseAuth, requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        targetStatus: targetSchema,
        deliveredAt: z.string().datetime().nullable().optional(),
        notify: z.boolean(),
        items: z
          .array(z.object({ orderId: z.string().uuid(), deliveredAt: z.string().datetime().nullable().optional() }))
          .min(1)
          .max(MAX_ORDERS),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    if (!(await userHasAnyRole(context.userId, ["admin"]))) {
      return { ok: false as const, error: "forbidden" as const };
    }

    // Un seul lot actif à la fois : évite deux traitements concurrents sur les mêmes commandes et
    // garantit une numérotation de factures chronologique.
    const { data: active } = await jobs().select("id").in("status", ["queued", "running"]).limit(1);
    if ((active ?? []).length > 0) return { ok: false as const, error: "job_in_progress" as const };

    // Ordre de traitement : par date de paiement croissante (numérotation des factures chronologique).
    const unique = new Map(data.items.map((i) => [i.orderId, i]));
    const orders = await fetchOrders([...unique.keys()]);
    const sorted = orders.sort((a, b) => (a.paid_at ?? "").localeCompare(b.paid_at ?? ""));
    if (sorted.length === 0) return { ok: false as const, error: "no_orders" as const };

    const { data: job, error: jobError } = await jobs()
      .insert({
        created_by: context.userId,
        target_status: data.targetStatus,
        delivered_at: data.deliveredAt ?? null,
        notify: data.notify,
        total: sorted.length,
      })
      .select("id")
      .single();
    if (jobError || !job) return { ok: false as const, error: jobError?.message ?? "job_insert_failed" };

    const rows = sorted.map((o, position) => ({
      job_id: job.id,
      order_id: o.id,
      position,
      delivered_at: unique.get(o.id)?.deliveredAt ?? null,
    }));
    for (const part of chunks(rows, 500)) {
      const { error } = await jobItems().insert(part);
      if (error) {
        await jobs().delete().eq("id", job.id);
        return { ok: false as const, error: error.message };
      }
    }

    startOrderBatchJob(job.id);
    return { ok: true as const, jobId: job.id as string, total: sorted.length };
  });

export type OrderBatchJobRow = {
  id: string;
  target_status: string;
  status: "queued" | "running" | "done";
  total: number;
  success_count: number;
  failed_count: number;
  skipped_count: number;
  created_at: string;
  finished_at: string | null;
  problems: { order_number: string; status: "failed" | "skipped"; error: string | null }[];
};

// Polling de l'interface : renvoie les derniers lots et relance ceux qui seraient orphelins.
export const listOrderBatchJobs = createServerFn({ method: "POST" })
  .middleware([withSupabaseAuth, requireSupabaseAuth])
  .handler(async ({ context }) => {
    if (!(await userHasAnyRole(context.userId, ["admin"]))) {
      return { ok: false as const, error: "forbidden" as const, jobs: [] as OrderBatchJobRow[] };
    }
    await resumeStaleOrderBatchJobs();

    const { data } = await jobs()
      .select("id, target_status, status, total, success_count, failed_count, skipped_count, created_at, finished_at")
      .order("created_at", { ascending: false })
      .limit(3);
    const list = (data ?? []) as Omit<OrderBatchJobRow, "problems">[];

    const result: OrderBatchJobRow[] = [];
    for (const j of list) {
      let problems: OrderBatchJobRow["problems"] = [];
      if (j.failed_count + j.skipped_count > 0) {
        const { data: items } = await jobItems()
          .select("status, error, orders(order_number)")
          .eq("job_id", j.id)
          .in("status", ["failed", "skipped"])
          .order("position", { ascending: true })
          .limit(50);
        problems = ((items ?? []) as any[]).map((i) => ({
          order_number: i.orders?.order_number ?? "?",
          status: i.status,
          error: i.error,
        }));
      }
      result.push({ ...j, problems });
    }
    return { ok: true as const, jobs: result };
  });

// Remet en file les commandes en échec d'un lot terminé (ex. facture non générée) et relance le traitement.
export const retryOrderBatchJob = createServerFn({ method: "POST" })
  .middleware([withSupabaseAuth, requireSupabaseAuth])
  .inputValidator((d) => z.object({ jobId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    if (!(await userHasAnyRole(context.userId, ["admin"]))) {
      return { ok: false as const, error: "forbidden" as const };
    }
    const { data: active } = await jobs().select("id").in("status", ["queued", "running"]).limit(1);
    if ((active ?? []).length > 0) return { ok: false as const, error: "job_in_progress" as const };

    const { error } = await jobItems().update({ status: "pending", error: null }).eq("job_id", data.jobId).eq("status", "failed");
    if (error) return { ok: false as const, error: error.message };
    await jobs().update({ status: "queued", finished_at: null, heartbeat_at: null }).eq("id", data.jobId);
    startOrderBatchJob(data.jobId);
    return { ok: true as const };
  });
