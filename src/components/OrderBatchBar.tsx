import { useEffect, useRef, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  createOrderBatchJob,
  listOrderBatchJobs,
  previewOrderBatch,
  retryOrderBatchJob,
  type OrderBatchJobRow,
} from "@/lib/order-batch.functions";
import { BATCH_TARGET_STATUSES, dateInputToIso, parseDeliveryDatesCsv } from "@/lib/batchDelivery";

type OrderRef = { id: string; order_number: string };

type Preview = {
  total: number;
  toProcess: number;
  skipped: number;
  alreadyAtTarget: number;
  alreadyInvoiced: number;
  invoiceRanges: { prefix: string; count: number; first: string; last: string }[];
};

const ERROR_LABELS: Record<string, string> = {
  job_in_progress: "Un lot est déjà en cours de traitement : attendez sa fin.",
  forbidden: "Action réservée aux administrateurs.",
  no_orders: "Aucune commande valide dans la sélection.",
};
const errorLabel = (e: string) => ERROR_LABELS[e] ?? e;

const JOB_STATUS_LABEL: Record<OrderBatchJobRow["status"], string> = {
  queued: "En file d'attente",
  running: "En cours",
  done: "Terminé",
};

const field = "h-9 rounded-md border border-border bg-background px-2 text-xs";
const primaryBtn =
  "h-9 rounded-md bg-primary px-4 text-[11px] font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50";
const ghostBtn =
  "h-9 rounded-md border border-border px-4 text-[11px] font-semibold text-muted-foreground hover:bg-muted/40 disabled:opacity-50";

/** Barre d'actions en lot : statut cible, date de livraison, import CSV, aperçu puis lancement du lot. */
export function BatchActionBar({
  selected,
  allOrders,
  locked,
  onClear,
  onLaunched,
}: {
  selected: OrderRef[];
  allOrders: OrderRef[];
  /** Un lot est déjà actif : on n'en lance pas un second. */
  locked: boolean;
  onClear: () => void;
  onLaunched: () => void;
}) {
  const [status, setStatus] = useState<string>("Livrée");
  const [date, setDate] = useState("");
  const [notify, setNotify] = useState(false);
  const [csvDates, setCsvDates] = useState<Record<string, string>>({});
  const [csvInfo, setCsvInfo] = useState<string | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const isDelivered = status === "Livrée";
  const ids = selected.map((o) => o.id);

  const resetPreview = () => setPreview(null);

  const onStatusChange = (value: string) => {
    setStatus(value);
    // On ne prévient pas les familles d'une livraison passée par défaut ; pour les autres statuts, comme avant.
    setNotify(value !== "Livrée");
    resetPreview();
  };

  const onCsv = async (file: File) => {
    const text = await file.text();
    const { dates, errors } = parseDeliveryDatesCsv(text);
    setCsvDates(dates);
    const known = new Set(allOrders.map((o) => o.order_number));
    const inSelection = new Set(selected.map((o) => o.order_number));
    const unknown = Object.keys(dates).filter((n) => !known.has(n));
    const parts = [
      `${Object.keys(dates).length} date(s) importée(s), ${Object.keys(dates).filter((n) => inSelection.has(n)).length} dans la sélection`,
    ];
    if (unknown.length) parts.push(`${unknown.length} commande(s) inconnue(s) : ${unknown.slice(0, 5).join(", ")}${unknown.length > 5 ? "…" : ""}`);
    if (errors.length) parts.push(`${errors.length} ligne(s) ignorée(s) : ${errors.slice(0, 3).join(" ; ")}`);
    setCsvInfo(parts.join(" — "));
    resetPreview();
  };

  const showPreview = async () => {
    setBusy(true);
    try {
      const r = await previewOrderBatch({ data: { orderIds: ids, targetStatus: status as (typeof BATCH_TARGET_STATUSES)[number] } });
      if (!r.ok) toast.error(errorLabel(r.error));
      else setPreview(r);
    } catch (e: any) {
      toast.error(e?.message ?? "Aperçu impossible");
    } finally {
      setBusy(false);
    }
  };

  const launch = async () => {
    setBusy(true);
    try {
      const r = await createOrderBatchJob({
        data: {
          targetStatus: status as (typeof BATCH_TARGET_STATUSES)[number],
          deliveredAt: isDelivered && date ? dateInputToIso(date) : null,
          notify,
          items: selected.map((o) => ({
            orderId: o.id,
            deliveredAt: isDelivered ? (csvDates[o.order_number] ?? null) : null,
          })),
        },
      });
      if (!r.ok) {
        toast.error(errorLabel(r.error));
        return;
      }
      toast.success(`Lot lancé : ${r.total} commande(s). Le traitement continue même si vous quittez la page.`);
      setPreview(null);
      onClear();
      onLaunched();
    } catch (e: any) {
      toast.error(e?.message ?? "Lancement impossible");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mb-4 rounded-2xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium text-foreground">
          {selected.length} commande{selected.length > 1 ? "s" : ""} sélectionnée{selected.length > 1 ? "s" : ""}
        </span>
        <select value={status} onChange={(e) => onStatusChange(e.target.value)} disabled={busy} className={field}>
          {BATCH_TARGET_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        {isDelivered && (
          <>
            <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
              Date de livraison
              <input
                type="date"
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  resetPreview();
                }}
                className={field}
              />
            </label>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.txt,text/csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void onCsv(f);
                e.target.value = "";
              }}
            />
            <button type="button" onClick={() => fileRef.current?.click()} disabled={busy} className={ghostBtn}>
              Importer des dates (CSV)
            </button>
          </>
        )}
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} disabled={busy} />
          Notifier les familles par email
        </label>
        <button onClick={showPreview} disabled={busy || locked} className={primaryBtn}>
          {busy && !preview ? "…" : "Aperçu et lancement"}
        </button>
        <button onClick={onClear} disabled={busy} className={ghostBtn}>
          Annuler la sélection
        </button>
      </div>

      <p className="mt-2 text-[11px] text-muted-foreground">
        « Expédiée » se fait ligne par ligne (n° de suivi requis).
        {isDelivered &&
          " La date de livraison est facultative (par défaut : la date déjà enregistrée, sinon aujourd'hui) ; le CSV attend « n° de commande ; date » (AAAA-MM-JJ ou JJ/MM/AAAA) et prime sur la date ci-dessus."}
      </p>
      {csvInfo && isDelivered && <p className="mt-1 text-[11px] text-foreground">{csvInfo}</p>}
      {locked && <p className="mt-1 text-[11px] text-amber-700 dark:text-amber-400">Un lot est en cours : attendez sa fin pour en lancer un autre.</p>}

      {preview && (
        <div className="mt-3 rounded-xl border border-primary/30 bg-primary/5 p-3 text-xs">
          <div className="font-semibold text-foreground">
            Passage en « {status} » — {preview.toProcess} commande(s) traitée(s)
          </div>
          <ul className="mt-1 list-disc space-y-0.5 pl-5 text-muted-foreground">
            {preview.skipped > 0 && <li>{preview.skipped} annulée(s)/remboursée(s) : ignorée(s)</li>}
            {preview.alreadyAtTarget > 0 && <li>{preview.alreadyAtTarget} déjà au statut « {status} » (statut inchangé, date mise à jour si fournie)</li>}
            {isDelivered && preview.alreadyInvoiced > 0 && <li>{preview.alreadyInvoiced} déjà facturée(s) : numéro conservé</li>}
            {isDelivered &&
              preview.invoiceRanges.map((r) => (
                <li key={r.prefix}>
                  {r.count} facture(s) {r.prefix} : {r.first === r.last ? r.first : `${r.first} → ${r.last}`}
                </li>
              ))}
            {isDelivered && <li>Traitées par date de paiement croissante ; ouverture des incidents côté familles</li>}
            <li>{notify ? "Les familles seront notifiées par e-mail" : "Aucun e-mail envoyé aux familles"}</li>
            {(status === "Annulée" || status === "Remboursée") && (
              <li className="text-amber-700 dark:text-amber-400">
                Ne déclenche ni remboursement PayPlug ni e-mail d'annulation : uniquement le changement de statut
              </li>
            )}
          </ul>
          <div className="mt-3 flex gap-2">
            <button onClick={launch} disabled={busy || preview.toProcess === 0} className={primaryBtn}>
              {busy ? "Lancement…" : "Lancer le traitement"}
            </button>
            <button onClick={resetPreview} disabled={busy} className={ghostBtn}>
              Retour
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/** Bandeau d'avancement du dernier lot ; interroge le serveur (ce qui relance aussi un lot orphelin). */
export function BatchJobsBanner({ onActiveChange, onJobDone }: { onActiveChange: (active: boolean) => void; onJobDone: () => void }) {
  const [job, setJob] = useState<OrderBatchJobRow | null>(null);
  const [hiddenId, setHiddenId] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);
  const prevActive = useRef<string | null>(null);
  const cbs = useRef({ onActiveChange, onJobDone });
  cbs.current = { onActiveChange, onJobDone };

  const refresh = async () => {
    try {
      const r = await listOrderBatchJobs();
      if (!r.ok) return null;
      const latest = r.jobs[0] ?? null;
      setJob(latest);
      const active = !!latest && latest.status !== "done";
      cbs.current.onActiveChange(active);
      if (prevActive.current && !active) cbs.current.onJobDone();
      prevActive.current = active && latest ? latest.id : null;
      return active;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const tick = async () => {
      const active = await refresh();
      if (cancelled) return;
      // Sondage rapide pendant un lot ; sinon un contrôle lent (reprise d'un lot lancé depuis un autre poste).
      timer = setTimeout(tick, active ? 3000 : 20000);
    };
    void tick();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!job || hiddenId === job.id) return null;
  const processed = job.success_count + job.failed_count + job.skipped_count;
  const pct = job.total > 0 ? Math.round((processed / job.total) * 100) : 0;
  const active = job.status !== "done";

  const retry = async () => {
    setRetrying(true);
    const r = await retryOrderBatchJob({ data: { jobId: job.id } });
    setRetrying(false);
    if (!r.ok) toast.error(errorLabel(r.error));
    else void refresh();
  };

  return (
    <div className="mb-4 rounded-2xl border border-border bg-card p-4 text-xs">
      <div className="flex flex-wrap items-center gap-3">
        {active && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
        <span className="font-semibold text-foreground">
          Lot « {job.target_status} » — {JOB_STATUS_LABEL[job.status]}
        </span>
        <span className="text-muted-foreground">
          {processed} / {job.total} · {job.success_count} réussie(s)
          {job.failed_count > 0 && <span className="text-destructive"> · {job.failed_count} échec(s)</span>}
          {job.skipped_count > 0 && ` · ${job.skipped_count} ignorée(s)`}
        </span>
        {!active && job.failed_count > 0 && (
          <button onClick={retry} disabled={retrying} className={ghostBtn}>
            Relancer les échecs
          </button>
        )}
        {!active && (
          <button onClick={() => setHiddenId(job.id)} className={ghostBtn}>
            Masquer
          </button>
        )}
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
        <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
      </div>
      {job.problems.length > 0 && (
        <details className="mt-2">
          <summary className="cursor-pointer text-muted-foreground">Détail des échecs et commandes ignorées</summary>
          <ul className="mt-1 space-y-0.5">
            {job.problems.map((p, i) => (
              <li key={i} className={p.status === "failed" ? "text-destructive" : "text-muted-foreground"}>
                <span className="font-mono">{p.order_number}</span> — {p.error ?? p.status}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

/** Télécharge le ZIP (PDF de factures + CSV récapitulatif) des commandes données. */
export function ExportInvoicesButton({ orderIds, label }: { orderIds: string[]; label: string }) {
  const [busy, setBusy] = useState(false);

  const run = async () => {
    if (orderIds.length === 0) return;
    setBusy(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;
      const res = await fetch("/api/admin/invoices-export", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ orderIds }),
      });
      if (!res.ok) throw new Error(`Export impossible (${res.status})`);
      const count = Number(res.headers.get("X-Invoice-Count") ?? 0);
      const missing = Number(res.headers.get("X-Invoice-Missing-Pdf") ?? 0);
      if (count === 0) {
        toast.warning("Aucune facture pour ces commandes.");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `factures-${new Date().toISOString().slice(0, 10)}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`${count} facture(s) exportée(s)${missing ? ` — ${missing} PDF manquant(s), signalé(s) dans le CSV` : ""}`);
    } catch (e: any) {
      toast.error(e?.message ?? "Export impossible");
    } finally {
      setBusy(false);
    }
  };

  return (
    <button onClick={run} disabled={busy || orderIds.length === 0} className={`${ghostBtn} inline-flex items-center gap-1.5`}>
      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
      {label}
    </button>
  );
}
