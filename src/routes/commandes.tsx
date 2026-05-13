import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Package,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  X,
  ImagePlus,
  Trash2,
  CheckCircle2,
  Clock,
  XCircle,
  FileDown,
  Truck,
  CreditCard,
} from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { ShellMotif } from "@/components/SchoolMotif";
import { useStore } from "@/lib/store";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PageWatermark } from "@/components/PageWatermark";
import { downloadOrderPdf, type PdfOrder } from "@/lib/orderPdf";
import { sendIncidentNotifications } from "@/server/email.functions";
import { createOrderPayment } from "@/server/payplug.functions";

export const Route = createFileRoute("/commandes")({
  head: () => ({ meta: [{ title: "Mes commandes — Espace familles" }] }),
  component: CommandesPage,
});

type Order = {
  id: string;
  order_number: string;
  status: string;
  total_amount: number;
  created_at: string;
  shipping_mode?: string | null;
  shipping_label?: string | null;
  shipping_recipient?: string | null;
  shipping_address?: string | null;
  shipping_postal?: string | null;
  shipping_city?: string | null;
  tracking_number?: string | null;
  tracking_carrier?: string | null;
  paid_at?: string | null;
  family_civilite?: string | null;
  family_prenom?: string;
  family_nom?: string;
  family_email?: string;
  family_telephone?: string | null;
};

type OrderItem = {
  id: string;
  order_id: string;
  product_name: string;
  product_ref: string;
  size: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  child_prenom: string;
  child_nom: string;
  child_classe: string | null;
  child_section: string | null;
};

type Incident = {
  id: string;
  order_id: string;
  order_item_id: string;
  status: string;
  incident_type: string;
  eligible: boolean;
  created_at: string;
};

type StatusHistory = {
  id: string;
  order_id: string;
  status: string;
  created_at: string;
  note: string | null;
};

const TIMELINE_STEPS = [
  "En attente",
  "Paiement validé",
  "En préparation",
  "Expédiée",
  "Livrée",
] as const;

function OrderTimeline({ history, currentStatus }: { history: StatusHistory[]; currentStatus: string }) {
  const passed = new Set<string>();
  history.forEach((h) => passed.add(h.status));
  passed.add(currentStatus);
  const lastIdx = TIMELINE_STEPS.findIndex((s) => s === currentStatus);
  return (
    <div className="mb-4 rounded-xl border border-border bg-background/60 p-4">
      <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        <Truck className="h-3.5 w-3.5" /> Suivi de la commande
      </div>
      <ol className="flex flex-wrap items-center gap-2">
        {TIMELINE_STEPS.map((step, idx) => {
          const reached = passed.has(step) || (lastIdx >= 0 && idx <= lastIdx);
          const isCurrent = step === currentStatus;
          return (
            <li key={step} className="flex items-center gap-2">
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold ${
                  isCurrent
                    ? "bg-primary text-primary-foreground ring-2 ring-primary/30"
                    : reached
                      ? "bg-emerald-500 text-white"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {reached ? "✓" : idx + 1}
              </span>
              <span className={`text-xs ${isCurrent ? "font-semibold text-foreground" : reached ? "text-foreground" : "text-muted-foreground"}`}>
                {step}
              </span>
              {idx < TIMELINE_STEPS.length - 1 && <span className="mx-1 text-muted-foreground">›</span>}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function statusKind(status: string): "open" | "done" | "rejected" {
  if (["Résolu"].includes(status)) return "done";
  if (["Refusé", "Non éligible"].includes(status)) return "rejected";
  return "open";
}

function IncidentAlert({ status, createdAt }: { status: string; createdAt: string }) {
  const kind = statusKind(status);
  const config =
    kind === "done"
      ? {
          wrap: "border-emerald-300 bg-emerald-50 text-emerald-800",
          icon: "bg-emerald-500 text-white",
          Icon: CheckCircle2,
          title: "Incident résolu",
        }
      : kind === "rejected"
        ? {
            wrap: "border-rose-300 bg-rose-50 text-rose-800",
            icon: "bg-rose-500 text-white",
            Icon: XCircle,
            title: status === "Non éligible" ? "Incident non pris en charge" : "Incident refusé",
          }
        : {
            wrap: "border-amber-300 bg-amber-50 text-amber-900",
            icon: "bg-amber-500 text-white",
            Icon: AlertTriangle,
            title: status === "À traiter" ? "Incident ouvert — en attente de traitement" : `Incident — ${status}`,
          };
  const Icon = config.Icon;
  const date = new Date(createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
  return (
    <div className={`mt-2 flex items-start gap-2 rounded-lg border px-2.5 py-2 text-[11px] font-medium ${config.wrap}`}>
      <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${config.icon}`}>
        <Icon className="h-3.5 w-3.5" />
      </span>
      <div className="flex-1">
        <div className="text-[12px] font-semibold leading-tight">{config.title}</div>
        <div className="mt-0.5 text-[10px] opacity-80">Déclaré le {date}</div>
      </div>
    </div>
  );
}

const INCIDENT_TYPES: { value: string; label: string; eligible: boolean }[] = [
  { value: "malfacon", label: "Malfaçon / défaut de fabrication", eligible: true },
  { value: "erreur_envoi", label: "Erreur d'envoi (mauvais produit ou taille)", eligible: true },
  { value: "erreur_commande", label: "Erreur de commande", eligible: true },
  { value: "article_manquant", label: "Article manquant", eligible: true },
  { value: "taille_inadaptee", label: "Taille inadaptée (non porté)", eligible: false },
  { value: "usure_normale", label: "Usure normale", eligible: false },
  { value: "autre", label: "Autre", eligible: false },
];

function CommandesPage() {
  const { user, profile, authLoading, isAdmin } = useStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [history, setHistory] = useState<StatusHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);
  const [incidentItem, setIncidentItem] = useState<OrderItem | null>(null);
  const [resumingId, setResumingId] = useState<string | null>(null);

  const resumePayment = async (o: Order) => {
    setResumingId(o.id);
    try {
      const res = await createOrderPayment({ data: { orderId: o.id } });
      if (res.ok) {
        window.location.href = res.paymentUrl;
        return;
      }
      if (res.error === "already_paid") {
        toast.success("Cette commande est déjà payée.");
        await reload();
      } else {
        toast.error("Impossible de relancer le paiement. Réessayez dans quelques instants.");
      }
    } catch (e) {
      toast.error("Erreur lors de la relance du paiement.");
    } finally {
      setResumingId(null);
    }
  };

  const reload = async () => {
    const { data: o } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
    const ids = (o ?? []).map((x: any) => x.id);
    const [{ data: it }, { data: inc }, { data: hist }] = await Promise.all([
      ids.length
        ? supabase.from("order_items").select("*").in("order_id", ids)
        : Promise.resolve({ data: [] as OrderItem[] }),
      ids.length
        ? supabase
            .from("order_incidents")
            .select("id, order_id, order_item_id, status, incident_type, eligible, created_at")
            .in("order_id", ids)
        : Promise.resolve({ data: [] as Incident[] }),
      ids.length
        ? supabase
            .from("order_status_history")
            .select("id, order_id, status, created_at, note")
            .in("order_id", ids)
            .order("created_at", { ascending: true })
        : Promise.resolve({ data: [] as StatusHistory[] }),
    ]);
    setOrders((o ?? []) as Order[]);
    setItems((it ?? []) as OrderItem[]);
    setIncidents((inc ?? []) as Incident[]);
    setHistory((hist ?? []) as StatusHistory[]);
    setLoading(false);
  };

  const handleDownloadPdf = (o: Order) => {
    const oItems = items.filter((i) => i.order_id === o.id);
    const pdfData: PdfOrder = {
      orderNumber: o.order_number,
      createdAt: o.created_at,
      status: o.status,
      totalAmount: Number(o.total_amount),
      family: {
        civilite: o.family_civilite ?? profile?.civilite ?? null,
        prenom: o.family_prenom ?? profile?.prenom ?? "",
        nom: o.family_nom ?? profile?.nom ?? "",
        email: o.family_email ?? profile?.email ?? "",
        telephone: o.family_telephone ?? profile?.telephone ?? null,
      },
      shipping: {
        mode: o.shipping_mode ?? "home",
        label: o.shipping_label,
        recipient: o.shipping_recipient,
        address: o.shipping_address,
        postal: o.shipping_postal,
        city: o.shipping_city,
      },
      items: oItems.map((i) => ({
        child: `${i.child_prenom} ${i.child_nom}`.trim(),
        productName: i.product_name,
        productRef: i.product_ref,
        size: i.size,
        quantity: i.quantity,
        unitPrice: Number(i.unit_price),
        lineTotal: Number(i.line_total),
      })),
      trackingNumber: o.tracking_number,
      trackingCarrier: o.tracking_carrier,
      paidAt: o.paid_at,
    };
    downloadOrderPdf(pdfData);
  };

  useEffect(() => {
    if (!user) return;
    reload();
  }, [user]);

  if (authLoading) return null;

  if (isAdmin) return <Navigate to="/admin" />;

  if (!user) {
    return (
      <div className="relative flex min-h-screen flex-col bg-background/80">
        <PageWatermark />
        <SiteHeader schoolName="Saint-Jacques-de-Compostelle — Dax" />
        <section className="mx-auto max-w-xl px-4 py-20 text-center">
          <h1 className="text-2xl font-semibold">Espace réservé aux familles</h1>
          <p className="mt-3 text-sm text-muted-foreground">Connectez-vous pour consulter vos commandes.</p>
          <Link
            to="/login"
            className="mt-6 inline-flex h-11 items-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground"
          >
            Se connecter
          </Link>
        </section>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader schoolName="Saint-Jacques-de-Compostelle — Dax" />
      <section className="relative mx-auto max-w-6xl w-full px-4 py-12 sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute -top-10 right-0 -z-0 h-72 w-72 text-primary">
          <ShellMotif className="h-full w-full" opacity={0.045} />
        </div>
        <div className="relative">
          <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
            <span className="h-px w-6 bg-gold" /> Famille {profile?.family_name || profile?.nom || ""}
          </span>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Mes commandes</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {orders.length} commande{orders.length > 1 ? "s" : ""}
          </p>
        </div>

        {loading ? (
          <p className="mt-10 text-sm text-muted-foreground">Chargement…</p>
        ) : orders.length === 0 ? (
          <div className="mt-12 rounded-3xl border border-dashed border-border bg-card p-16 text-center">
            <Package className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-4 text-sm text-muted-foreground">Aucune commande pour le moment.</p>
            <Link
              to="/boutique"
              className="mt-6 inline-flex h-11 items-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground"
            >
              Découvrir la boutique
            </Link>
          </div>
        ) : (
          <div className="mt-8 space-y-3">
            {orders.map((o) => {
              const oItems = items.filter((i) => i.order_id === o.id);
              const oIncidents = incidents.filter((i) => i.order_id === o.id);
              const openCount = oIncidents.filter((i) => statusKind(i.status) === "open").length;
              const doneCount = oIncidents.filter((i) => statusKind(i.status) === "done").length;
              const rejectedCount = oIncidents.filter((i) => statusKind(i.status) === "rejected").length;
              const isOpen = openId === o.id;
              return (
                <article key={o.id} className="overflow-hidden rounded-2xl border border-border bg-card">
                  <button
                    onClick={() => setOpenId(isOpen ? null : o.id)}
                    className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left hover:bg-muted/30 sm:gap-4 sm:px-6"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Package className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold text-foreground">{o.order_number}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(o.created_at).toLocaleDateString("fr-FR", {
                            day: "2-digit",
                            month: "long",
                            year: "numeric",
                          })}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5 sm:hidden">
                          <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-foreground/80">
                            {o.status}
                          </span>
                        </div>
                        {oIncidents.length > 0 && (
                          <div className="mt-1 flex flex-wrap items-center gap-1.5">
                            {openCount > 0 && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                                <Clock className="h-3 w-3" /> {openCount} en cours
                              </span>
                            )}
                            {doneCount > 0 && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                                <CheckCircle2 className="h-3 w-3" /> {doneCount} traité{doneCount > 1 ? "s" : ""}
                              </span>
                            )}
                            {rejectedCount > 0 && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold text-rose-700">
                                <XCircle className="h-3 w-3" /> {rejectedCount} non pris en charge
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2 sm:gap-4">
                      <span className="hidden rounded-full bg-secondary px-3 py-1 text-[11px] font-medium text-foreground/80 sm:inline">
                        {o.status}
                      </span>
                      <span className="whitespace-nowrap text-sm font-semibold sm:text-base">
                        {Number(o.total_amount).toFixed(2)} €
                      </span>
                      {isOpen ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </button>
                  {isOpen && (
                    <div className="border-t border-border bg-secondary/40 px-6 py-5">
                      <OrderTimeline
                        history={history.filter((h) => h.order_id === o.id)}
                        currentStatus={o.status}
                      />
                      {(o.tracking_number || o.shipping_address) && (
                        <div className="mb-4 grid gap-3 sm:grid-cols-2">
                          {o.shipping_mode === "home" && o.shipping_address && (
                            <div className="rounded-lg border border-border bg-card p-3 text-xs">
                              <div className="font-semibold text-foreground">Livraison à domicile</div>
                              <div className="mt-1 text-muted-foreground">
                                {o.shipping_recipient && <div>{o.shipping_recipient}</div>}
                                <div>{o.shipping_address}</div>
                                <div>{[o.shipping_postal, o.shipping_city].filter(Boolean).join(" ")}</div>
                              </div>
                            </div>
                          )}
                          {o.shipping_mode === "pickup" && (
                            <div className="rounded-lg border border-border bg-card p-3 text-xs">
                              <div className="font-semibold text-foreground">Retrait à l'établissement</div>
                              <div className="mt-1 text-muted-foreground">Secrétariat — Saint-Jacques</div>
                            </div>
                          )}
                          {o.tracking_number && (
                            <div className="rounded-lg border border-border bg-card p-3 text-xs">
                              <div className="font-semibold text-foreground">Numéro de suivi</div>
                              <div className="mt-1 text-muted-foreground">
                                {o.tracking_carrier ? `${o.tracking_carrier} · ` : ""}
                                <span className="font-mono">{o.tracking_number}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      <div className="mb-4 flex flex-wrap items-center justify-end gap-2">
                        {!o.paid_at &&
                          ["En attente", "En attente paiement", "Paiement échoué"].includes(o.status) && (
                            <button
                              onClick={() => resumePayment(o)}
                              disabled={resumingId === o.id}
                              className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
                            >
                              <CreditCard className="h-3.5 w-3.5" />
                              {resumingId === o.id ? "Redirection…" : "Reprendre le paiement"}
                            </button>
                          )}
                        {o.paid_at && (
                          <button
                            onClick={() => handleDownloadPdf(o)}
                            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:border-primary hover:text-primary"
                          >
                            <FileDown className="h-3.5 w-3.5" /> Voir la facture
                          </button>
                        )}
                      </div>
                      {/* Vue tableau (desktop/tablette) */}
                      <table className="hidden w-full text-sm md:table">
                        <thead>
                          <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                            <th className="pb-2">Enfant</th>
                            <th className="pb-2">Produit</th>
                            <th className="pb-2">Taille</th>
                            <th className="pb-2 text-right">Qté</th>
                            <th className="pb-2 text-right">Total</th>
                            <th className="pb-2 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {oItems.map((i) => {
                            const itemIncidents = oIncidents.filter((x) => x.order_item_id === i.id);
                            return (
                              <tr key={i.id}>
                                <td className="py-2.5 text-foreground">
                                  {i.child_prenom} {i.child_nom}
                                  <div className="text-[11px] text-muted-foreground">
                                    {[i.child_section, i.child_classe].filter(Boolean).join(" · ")}
                                  </div>
                                </td>
                                <td className="py-2.5">
                                  {i.product_name}
                                  <div className="text-[11px] text-muted-foreground">Réf. {i.product_ref}</div>
                                  {itemIncidents.length > 0 && (
                                    <div className="max-w-fit space-y-1.5">
                                      {itemIncidents.map((inc) => (
                                        <IncidentAlert key={inc.id} status={inc.status} createdAt={inc.created_at} />
                                      ))}
                                    </div>
                                  )}
                                </td>
                                <td className="py-2.5">{i.size}</td>
                                <td className="py-2.5 text-right">{i.quantity}</td>
                                <td className="py-2.5 text-right font-semibold">{Number(i.line_total).toFixed(2)} €</td>
                                <td className="py-2.5 text-right">
                                  <button
                                    onClick={() => setIncidentItem(i)}
                                    className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1 text-[11px] font-medium text-muted-foreground hover:border-destructive/40 hover:text-destructive"
                                  >
                                    <AlertTriangle className="h-3 w-3" /> Déclarer un incident
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>

                      {/* Vue cartes (mobile) */}
                      <ul className="space-y-3 md:hidden">
                        {oItems.map((i) => {
                          const itemIncidents = oIncidents.filter((x) => x.order_item_id === i.id);
                          return (
                            <li key={i.id} className="rounded-xl border border-border bg-card p-3">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                  <div className="text-sm font-semibold text-foreground">
                                    {i.product_name}
                                  </div>
                                  <div className="text-[11px] text-muted-foreground">Réf. {i.product_ref}</div>
                                </div>
                                <div className="text-right">
                                  <div className="text-sm font-semibold">{Number(i.line_total).toFixed(2)} €</div>
                                  <div className="text-[11px] text-muted-foreground">Qté {i.quantity}</div>
                                </div>
                              </div>
                              <dl className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                                <div className="rounded-md bg-muted/40 px-2 py-1.5">
                                  <dt className="font-semibold uppercase tracking-wider text-muted-foreground">Enfant</dt>
                                  <dd className="mt-0.5 text-foreground">
                                    {i.child_prenom} {i.child_nom}
                                    {(i.child_section || i.child_classe) && (
                                      <div className="text-[10px] text-muted-foreground">
                                        {[i.child_section, i.child_classe].filter(Boolean).join(" · ")}
                                      </div>
                                    )}
                                  </dd>
                                </div>
                                <div className="rounded-md bg-muted/40 px-2 py-1.5">
                                  <dt className="font-semibold uppercase tracking-wider text-muted-foreground">Taille</dt>
                                  <dd className="mt-0.5 text-foreground">{i.size}</dd>
                                </div>
                              </dl>
                              {itemIncidents.length > 0 && (
                                <div className="mt-2 space-y-1.5">
                                  {itemIncidents.map((inc) => (
                                    <IncidentAlert key={inc.id} status={inc.status} createdAt={inc.created_at} />
                                  ))}
                                </div>
                              )}
                              <button
                                onClick={() => setIncidentItem(i)}
                                className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-muted-foreground hover:border-destructive/40 hover:text-destructive"
                              >
                                <AlertTriangle className="h-3.5 w-3.5" /> Déclarer un incident
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
      {incidentItem && (
        <IncidentModal
          item={incidentItem}
          userId={user!.id}
          onClose={() => setIncidentItem(null)}
          onSubmitted={reload}
        />
      )}
      <SiteFooter />
    </div>
  );
}

function IncidentModal({
  item,
  userId,
  onClose,
  onSubmitted,
}: {
  item: OrderItem;
  userId: string;
  onClose: () => void;
  onSubmitted?: () => void;
}) {
  const [qty, setQty] = useState(1);
  const [type, setType] = useState(INCIDENT_TYPES[0].value);
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [photos, setPhotos] = useState<{ path: string; preview: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const selected = INCIDENT_TYPES.find((t) => t.value === type)!;

  const MAX_PHOTOS = 5;
  const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const slots = MAX_PHOTOS - photos.length;
    if (slots <= 0) {
      toast.error(`Maximum ${MAX_PHOTOS} photos.`);
      return;
    }
    setUploading(true);
    const uploaded: { path: string; preview: string }[] = [];
    for (const file of Array.from(files).slice(0, slots)) {
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} n'est pas une image.`);
        continue;
      }
      if (file.size > MAX_SIZE) {
        toast.error(`${file.name} dépasse 5 Mo.`);
        continue;
      }
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${userId}/${item.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from("incident-photos").upload(path, file, {
        contentType: file.type,
        upsert: false,
      });
      if (error) {
        toast.error(`Échec de l'upload : ${file.name}`);
        continue;
      }
      const { data: signed } = await supabase.storage.from("incident-photos").createSignedUrl(path, 3600);
      uploaded.push({ path, preview: signed?.signedUrl || "" });
    }
    setPhotos((p) => [...p, ...uploaded]);
    setUploading(false);
  };

  const removePhoto = async (path: string) => {
    await supabase.storage.from("incident-photos").remove([path]);
    setPhotos((p) => p.filter((x) => x.path !== path));
  };

  const submit = async () => {
    if (description.trim().length < 10) {
      toast.error("Merci de décrire l'incident (10 caractères min).");
      return;
    }
    setSubmitting(true);
    const { data: inserted, error } = await supabase.from("order_incidents").insert({
      order_id: item.order_id,
      order_item_id: item.id,
      user_id: userId,
      quantity: qty,
      incident_type: type,
      description: description.trim(),
      eligible: selected.eligible,
      status: selected.eligible ? "À traiter" : "Non éligible",
      photos: photos.map((p) => p.path),
    }).select("id").single();
    setSubmitting(false);
    if (error) {
      toast.error("Erreur lors de l'envoi");
      return;
    }
    if (inserted?.id) {
      sendIncidentNotifications({ data: { incidentId: inserted.id } }).catch(() => {});
    }
    toast.success(
      selected.eligible
        ? "Incident déclaré, nous reviendrons vers vous."
        : "Déclaration enregistrée — non éligible à une prise en charge.",
    );
    onSubmitted?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-card p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-foreground">Déclarer un incident</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {item.product_name} · Taille {item.size} · {item.child_prenom}
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-muted-foreground hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-foreground">Quantité concernée</label>
            <div className="mt-1 flex items-center gap-2">
              {Array.from({ length: item.quantity }, (_, k) => k + 1).map((n) => (
                <button
                  key={n}
                  onClick={() => setQty(n)}
                  className={`h-9 w-9 rounded-lg border text-sm font-medium ${qty === n ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground hover:bg-muted"}`}
                >
                  {n}
                </button>
              ))}
              <span className="text-xs text-muted-foreground">
                / {item.quantity} commandé{item.quantity > 1 ? "s" : ""}
              </span>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-foreground">Type d'incident</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
            >
              {INCIDENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            <p className={`mt-1 text-[11px] ${selected.eligible ? "text-emerald-600" : "text-amber-600"}`}>
              {selected.eligible
                ? "✓ Éligible à une prise en charge — étude du dossier sous 5 jours."
                : "⚠ Ce motif n'ouvre généralement pas droit à prise en charge."}
            </p>
          </div>

          <div>
            <label className="text-xs font-medium text-foreground">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Décrivez précisément le problème observé…"
              className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-foreground">
              Photos{" "}
              <span className="text-muted-foreground">
                ({photos.length}/{MAX_PHOTOS})
              </span>
            </label>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Joignez jusqu'à {MAX_PHOTOS} photos pour illustrer le problème (5 Mo max par image).
            </p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {photos.map((p) => (
                <div
                  key={p.path}
                  className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-muted"
                >
                  {p.preview && <img src={p.preview} alt="Photo incident" className="h-full w-full object-cover" />}
                  <button
                    type="button"
                    onClick={() => removePhoto(p.path)}
                    className="absolute right-1 top-1 rounded-md bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                    aria-label="Supprimer la photo"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {photos.length < MAX_PHOTOS && (
                <label
                  className={`flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border bg-card text-[10px] text-muted-foreground hover:border-primary hover:text-primary ${uploading ? "pointer-events-none opacity-60" : ""}`}
                >
                  <ImagePlus className="h-4 w-4" />
                  <span>{uploading ? "Envoi…" : "Ajouter"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      handleFiles(e.target.files);
                      e.target.value = "";
                    }}
                  />
                </label>
              )}
            </div>
          </div>

          <div className="rounded-lg bg-secondary/60 p-3 text-[11px] leading-relaxed text-muted-foreground">
            Les frais de retour sont à la charge de l'expéditeur dans tous les cas.
          </div>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 rounded-lg border border-border bg-card py-2 text-sm font-medium hover:bg-muted"
            >
              Annuler
            </button>
            <button
              onClick={submit}
              disabled={submitting || uploading}
              className="flex-1 rounded-lg bg-primary py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
            >
              {submitting ? "Envoi…" : "Envoyer la déclaration"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
