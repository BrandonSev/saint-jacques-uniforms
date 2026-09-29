import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { applyOrderStatus, generateInvoiceForOrder } from "@/server/orderInvoice.server";
import { sendOrderStatusEmail } from "@/server/email.server";
import { BATCH_PROTECTED_STATUSES, resolveDeliveredAt } from "@/lib/batchDelivery";

// Worker des lots de changement de statut (voir supabase/migrations/20260924120000_order_batch_jobs.sql).
// Il tourne dans le processus serveur (Node persistant) : `startOrderBatchJob` ne bloque pas l'appelant.
// Un lot « running » dont le heartbeat est plus vieux que STALE_MS est considéré orphelin (redéploiement,
// crash) et repris à la prochaine occasion (`resumeStaleOrderBatchJobs`, appelé par le polling de l'admin).
// Le traitement d'une commande est idempotent (facture déjà émise = même numéro), une reprise est donc sûre.

const STALE_MS = 90_000;
const NOTIFY_DELAY_MS = 150;

// Cast : tables ajoutées par la migration 20260924120000, types Supabase pas encore régénérés.
const jobs = () => (supabaseAdmin.from as any)("order_batch_jobs");
const jobItems = () => (supabaseAdmin.from as any)("order_batch_job_items");

type Job = {
  id: string;
  target_status: string;
  delivered_at: string | null;
  notify: boolean;
};

type Item = { id: string; order_id: string; delivered_at: string | null };

type ItemResult = { status: "success" | "failed" | "skipped"; error?: string; invoiceNumber?: string };

const running = new Set<string>();

export function startOrderBatchJob(jobId: string): void {
  if (running.has(jobId)) return;
  running.add(jobId);
  void runJob(jobId)
    .catch((e) => console.error("[order-batch] job", jobId, e))
    .finally(() => running.delete(jobId));
}

/** Relance les lots en attente ou orphelins (heartbeat trop ancien). */
export async function resumeStaleOrderBatchJobs(): Promise<void> {
  const staleBefore = new Date(Date.now() - STALE_MS).toISOString();
  const { data } = await jobs()
    .select("id")
    .or(`status.eq.queued,and(status.eq.running,heartbeat_at.lt.${staleBefore})`);
  for (const j of (data ?? []) as { id: string }[]) startOrderBatchJob(j.id);
}

async function claim(jobId: string): Promise<Job | null> {
  const staleBefore = new Date(Date.now() - STALE_MS).toISOString();
  const { data } = await jobs()
    .update({ status: "running", heartbeat_at: new Date().toISOString() })
    .eq("id", jobId)
    .or(`status.eq.queued,and(status.eq.running,heartbeat_at.lt.${staleBefore})`)
    .select("id, target_status, delivered_at, notify");
  return ((data ?? [])[0] as Job | undefined) ?? null;
}

async function countItems(jobId: string, status: string): Promise<number> {
  const { count } = await jobItems().select("id", { count: "exact", head: true }).eq("job_id", jobId).eq("status", status);
  return count ?? 0;
}

async function runJob(jobId: string): Promise<void> {
  const job = await claim(jobId);
  if (!job) return;

  const counts = {
    success: await countItems(jobId, "success"),
    failed: await countItems(jobId, "failed"),
    skipped: await countItems(jobId, "skipped"),
  };

  for (;;) {
    const { data: batch } = await jobItems()
      .select("id, order_id, delivered_at")
      .eq("job_id", jobId)
      .eq("status", "pending")
      .order("position", { ascending: true })
      .limit(20);
    const items = (batch ?? []) as Item[];
    if (items.length === 0) break;

    for (const item of items) {
      let result: ItemResult;
      try {
        result = await processItem(job, item);
      } catch (e: any) {
        result = { status: "failed", error: e?.message ?? String(e) };
      }
      counts[result.status]++;
      await jobItems()
        .update({
          status: result.status,
          error: result.error ?? null,
          invoice_number: result.invoiceNumber ?? null,
          processed_at: new Date().toISOString(),
        })
        .eq("id", item.id);
      await jobs()
        .update({
          success_count: counts.success,
          failed_count: counts.failed,
          skipped_count: counts.skipped,
          heartbeat_at: new Date().toISOString(),
        })
        .eq("id", jobId);
    }
  }

  await jobs().update({ status: "done", finished_at: new Date().toISOString() }).eq("id", jobId);
}

async function processItem(job: Job, item: Item): Promise<ItemResult> {
  const { data: order } = await supabaseAdmin
    .from("orders")
    .select("id, order_number, status, delivered_at, family_email, family_prenom, family_nom, tracking_number, tracking_carrier")
    .eq("id", item.order_id)
    .maybeSingle();
  if (!order) return { status: "failed", error: "Commande introuvable" };
  if ((BATCH_PROTECTED_STATUSES as readonly string[]).includes(order.status)) {
    return { status: "skipped", error: `Commande ${order.status.toLowerCase()} : non modifiée` };
  }

  const deliveredAt =
    job.target_status === "Livrée"
      ? resolveDeliveredAt({ itemDate: item.delivered_at, jobDate: job.delivered_at, existing: order.delivered_at })
      : undefined;

  const statusError = await applyOrderStatus(order.id, job.target_status, { deliveredAt });
  if (statusError) return { status: "failed", error: statusError };

  let invoiceNumber: string | undefined;
  if (job.target_status === "Livrée") {
    const invoice = await generateInvoiceForOrder(order.id);
    if (!invoice.ok) return { status: "failed", error: `Statut mis à jour mais facture non générée : ${invoice.error}` };
    invoiceNumber = invoice.invoiceNumber;
  }

  if (job.notify && order.family_email) {
    try {
      await sendOrderStatusEmail(order.family_email, order.family_prenom ?? "", order.order_number, job.target_status, {
        trackingNumber: order.tracking_number,
        trackingCarrier: order.tracking_carrier,
        familyName: order.family_nom ?? undefined,
      });
    } catch (e: any) {
      // La commande est bien traitée : l'échec d'envoi d'e-mail ne la fait pas échouer.
      console.error("[order-batch] e-mail non envoyé", order.order_number, e);
    }
    await new Promise((r) => setTimeout(r, NOTIFY_DELAY_MS));
  }

  return { status: "success", invoiceNumber };
}
