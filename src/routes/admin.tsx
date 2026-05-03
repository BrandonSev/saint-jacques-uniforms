import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { Download, ShieldCheck, AlertTriangle, X, ImageIcon, Truck, Save } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { RequireAuth } from "@/components/RequireAuth";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/lib/store";
import { toast } from "sonner";
import { sendOrderStatusUpdate, sendIncidentUpdate } from "@/server/email.functions";

const SCHOOL_LABEL = "Saint-Jacques-de-Compostelle — Dax";
const SCHOOL_SHORT = "Saint-Jacques";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: `Espace administrateur — ${SCHOOL_SHORT}` }] }),
  component: () => (
    <RequireAuth>
      <AdminPage />
    </RequireAuth>
  ),
});

type Row = {
  order_number: string;
  created_at: string;
  status: string;
  family_civilite: string | null;
  family_nom: string;
  family_prenom: string;
  family_email: string;
  family_telephone: string | null;
  child_prenom: string;
  child_nom: string;
  child_classe: string | null;
  child_section: string | null;
  product_name: string;
  product_ref: string;
  variant: string | null;
  size: string;
  quantity: number;
  unit_price: number;
  line_total: number;
};

type Incident = {
  id: string;
  order_id: string;
  order_item_id: string;
  user_id: string;
  incident_type: string;
  description: string;
  quantity: number;
  eligible: boolean;
  status: string;
  photos: string[];
  created_at: string;
  updated_at: string;
  order_number?: string;
  family_nom?: string;
  family_prenom?: string;
  family_email?: string;
  product_name?: string;
  product_ref?: string;
  size?: string;
  child_prenom?: string;
  child_nom?: string;
};

const INCIDENT_TYPE_LABELS: Record<string, string> = {
  malfacon: "Malfaçon / défaut de fabrication",
  erreur_envoi: "Erreur d'envoi",
  article_manquant: "Article manquant",
  taille_inadaptee: "Taille inadaptée",
  usure_normale: "Usure normale",
  autre: "Autre",
};

const INCIDENT_STATUSES = [
  "À traiter",
  "En attente",
  "En cours de traitement",
  "Résolu",
  "Non éligible",
  "Refusé",
] as const;

const ORDER_STATUSES = [
  "En attente",
  "Paiement validé",
  "En préparation",
  "Expédiée",
  "Livrée",
  "Annulée",
] as const;

type OrderRow = {
  id: string;
  order_number: string;
  created_at: string;
  status: string;
  total_amount: number;
  family_prenom: string;
  family_nom: string;
  family_email: string;
  shipping_mode: string;
  tracking_number: string | null;
  tracking_carrier: string | null;
};

function AdminPage() {
  const { isAdmin, authLoading } = useStore();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [incidentsLoading, setIncidentsLoading] = useState(true);
  const [tab, setTab] = useState<"orders" | "tracking" | "incidents">("orders");
  const [orderRows, setOrderRows] = useState<OrderRow[]>([]);
  const [orderRowsLoading, setOrderRowsLoading] = useState(true);
  const [openIncident, setOpenIncident] = useState<Incident | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      setIncidentsLoading(false);
      setOrderRowsLoading(false);
      return;
    }
    (async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, order_number, created_at, status, total_amount, family_prenom, family_nom, family_email, shipping_mode, tracking_number, tracking_carrier")
        .order("created_at", { ascending: false });
      if (error) {
        toast.error(error.message);
        setOrderRowsLoading(false);
        return;
      }
      setOrderRows((data ?? []) as OrderRow[]);
      setOrderRowsLoading(false);
    })();
    (async () => {
      const { data, error } = await supabase
        .from("order_items")
        .select(
          `
          child_prenom, child_nom, child_classe, child_section,
          product_name, product_ref, size, quantity, unit_price, line_total,
          orders!inner ( order_number, created_at, status, family_civilite, family_nom, family_prenom, family_email, family_telephone )
        `,
        )
        .order("created_at", { foreignTable: "orders", ascending: false });
      if (error) {
        toast.error(error.message);
        setLoading(false);
        return;
      }
      const flat: Row[] = (data ?? []).map((r: any) => ({
        order_number: r.orders.order_number,
        created_at: r.orders.created_at,
        status: r.orders.status,
        family_civilite: r.orders.family_civilite,
        family_nom: r.orders.family_nom,
        family_prenom: r.orders.family_prenom,
        family_email: r.orders.family_email,
        family_telephone: r.orders.family_telephone,
        child_prenom: r.child_prenom,
        child_nom: r.child_nom,
        child_classe: r.child_classe,
        child_section: r.child_section,
        product_name: r.product_name,
        product_ref: r.product_ref,
        variant: null,
        size: r.size,
        quantity: r.quantity,
        unit_price: Number(r.unit_price),
        line_total: Number(r.line_total),
      }));
      setRows(flat);
      setLoading(false);
    })();
    (async () => {
      const { data, error } = await supabase
        .from("order_incidents")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) {
        toast.error(error.message);
        setIncidentsLoading(false);
        return;
      }
      const rawIncidents = (data ?? []) as any[];
      const orderIds = Array.from(new Set(rawIncidents.map((r) => r.order_id)));
      const itemIds = Array.from(new Set(rawIncidents.map((r) => r.order_item_id)));
      const [{ data: ordersData }, { data: itemsData }] = await Promise.all([
        orderIds.length
          ? supabase
              .from("orders")
              .select("id, order_number, family_nom, family_prenom, family_email")
              .in("id", orderIds)
          : Promise.resolve({ data: [] as any[] }),
        itemIds.length
          ? supabase
              .from("order_items")
              .select("id, product_name, product_ref, size, child_prenom, child_nom")
              .in("id", itemIds)
          : Promise.resolve({ data: [] as any[] }),
      ]);
      const ordersMap = new Map<string, any>((ordersData ?? []).map((o: any) => [o.id, o]));
      const itemsMap = new Map<string, any>((itemsData ?? []).map((it: any) => [it.id, it]));
      const flat: Incident[] = rawIncidents.map((r: any) => ({
        id: r.id,
        order_id: r.order_id,
        order_item_id: r.order_item_id,
        user_id: r.user_id,
        incident_type: r.incident_type,
        description: r.description,
        quantity: r.quantity,
        eligible: r.eligible,
        status: r.status,
        photos: r.photos ?? [],
        created_at: r.created_at,
        updated_at: r.updated_at,
        order_number: ordersMap.get(r.order_id)?.order_number,
        family_nom: ordersMap.get(r.order_id)?.family_nom,
        family_prenom: ordersMap.get(r.order_id)?.family_prenom,
        family_email: ordersMap.get(r.order_id)?.family_email,
        product_name: itemsMap.get(r.order_item_id)?.product_name,
        product_ref: itemsMap.get(r.order_item_id)?.product_ref,
        size: itemsMap.get(r.order_item_id)?.size,
        child_prenom: itemsMap.get(r.order_item_id)?.child_prenom,
        child_nom: itemsMap.get(r.order_item_id)?.child_nom,
      }));
      setIncidents(flat);
      setIncidentsLoading(false);
    })();
  }, [isAdmin]);

  const updateIncidentStatus = async (incident: Incident, status: string) => {
    const { error } = await supabase
      .from("order_incidents")
      .update({ status })
      .eq("id", incident.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setIncidents((prev) => prev.map((i) => (i.id === incident.id ? { ...i, status } : i)));
    if (openIncident?.id === incident.id) setOpenIncident({ ...openIncident, status });
    sendIncidentUpdate({ data: { incidentId: incident.id } }).catch(() => {});
    toast.success("Statut mis à jour");
  };

  const updateOrder = async (
    orderId: string,
    patch: Partial<Pick<OrderRow, "status" | "tracking_number" | "tracking_carrier">>,
    notify: boolean,
  ) => {
    const update: any = { ...patch };
    if (patch.status === "Livrée") update.delivered_at = new Date().toISOString();
    const { error } = await supabase.from("orders").update(update).eq("id", orderId);
    if (error) {
      toast.error(error.message);
      return;
    }
    setOrderRows((prev) => prev.map((o) => (o.id === orderId ? { ...o, ...patch } : o)));
    if (notify) {
      sendOrderStatusUpdate({ data: { orderId } }).catch(() => {});
    }
    toast.success("Commande mise à jour");
  };

  const getSignedPhotoUrl = async (path: string): Promise<string | null> => {
    const { data, error } = await supabase.storage
      .from("incident-photos")
      .createSignedUrl(path, 60 * 60);
    if (error) return null;
    return data.signedUrl;
  };

  const exportExcel = () => {
    const data = rows.map((r) => ({
      "N° Commande": r.order_number,
      Date: new Date(r.created_at).toLocaleDateString("fr-FR"),
      Statut: r.status,
      Famille: `${r.family_civilite ?? ""} ${r.family_prenom} ${r.family_nom}`.trim(),
      Email: r.family_email,
      Téléphone: r.family_telephone ?? "",
      Enfant: `${r.child_prenom} ${r.child_nom}`,
      Classe: r.child_classe ?? "",
      Section: r.child_section ?? "",
      Produit: r.product_name,
      Référence: r.product_ref,
      Taille: r.size,
      Quantité: r.quantity,
      "Prix unitaire (€)": r.unit_price,
      "Total ligne (€)": r.line_total,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Commandes");
    const fname = `commandes-saint-jacques-${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, fname);
    toast.success(`Export généré : ${fname}`);
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <SiteHeader schoolName={SCHOOL_LABEL} />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <SiteHeader schoolName={SCHOOL_LABEL} />
        <section className="mx-auto max-w-3xl px-4 py-20 text-center">
          <ShieldCheck className="mx-auto h-10 w-10 text-muted-foreground" />
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground">Accès réservé</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Cette page est réservée aux administrateurs de l'établissement.
          </p>
        </section>
        <SiteFooter />
      </div>
    );
  }

  const totalCommandes = new Set(rows.map((r) => r.order_number)).size;
  const totalArticles = rows.reduce((s, r) => s + r.quantity, 0);
  const totalCA = rows.reduce((s, r) => s + r.line_total, 0);
  const incidentsEnAttente = incidents.filter((i) =>
    ["À traiter", "En attente"].includes(i.status),
  ).length;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader schoolName={SCHOOL_LABEL} />
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
              <span className="h-px w-6 bg-gold" /> Espace administrateur
            </span>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Commandes fournisseur
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">Vue consolidée de toutes les commandes familles.</p>
          </div>
          <button
            onClick={exportExcel}
            disabled={rows.length === 0}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            <Download className="h-4 w-4" /> Exporter Excel fournisseur
          </button>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <Stat label="Commandes" value={totalCommandes.toString()} />
          <Stat label="Articles" value={totalArticles.toString()} />
          <Stat label="Total" value={`${totalCA.toFixed(2)} €`} />
        </div>

        <div className="mt-8 inline-flex rounded-xl border border-border bg-card p-1">
          <button
            onClick={() => setTab("orders")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${tab === "orders" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            Commandes
          </button>
          <button
            onClick={() => setTab("tracking")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${tab === "tracking" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            Suivi & expédition
          </button>
          <button
            onClick={() => setTab("incidents")}
            className={`relative rounded-lg px-4 py-2 text-sm font-medium transition-colors ${tab === "incidents" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            Incidents
            {incidentsEnAttente > 0 && (
              <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-semibold text-destructive-foreground">
                {incidentsEnAttente}
              </span>
            )}
          </button>
        </div>

        {tab === "orders" && (
        <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Commande</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Famille</th>
                  <th className="px-4 py-3">Enfant</th>
                  <th className="px-4 py-3">Classe</th>
                  <th className="px-4 py-3">Produit</th>
                  <th className="px-4 py-3">Taille</th>
                  <th className="px-4 py-3 text-right">Qté</th>
                  <th className="px-4 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading && (
                  <tr>
                    <td colSpan={9} className="px-4 py-6 text-center text-muted-foreground">
                      Chargement…
                    </td>
                  </tr>
                )}
                {!loading && rows.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-4 py-6 text-center text-muted-foreground">
                      Aucune commande pour le moment.
                    </td>
                  </tr>
                )}
                {rows.map((r, i) => (
                  <tr key={i} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium text-foreground">{r.order_number}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(r.created_at).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="px-4 py-3">
                      {r.family_prenom} {r.family_nom}
                    </td>
                    <td className="px-4 py-3">
                      {r.child_prenom} {r.child_nom}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{r.child_classe ?? "—"}</td>
                    <td className="px-4 py-3">
                      {r.product_name} <span className="text-xs text-muted-foreground">({r.product_ref})</span>
                    </td>
                    <td className="px-4 py-3">{r.size}</td>
                    <td className="px-4 py-3 text-right">{r.quantity}</td>
                    <td className="px-4 py-3 text-right font-semibold">{r.line_total.toFixed(2)} €</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        )}

        {tab === "tracking" && (
          <TrackingPanel
            orders={orderRows}
            loading={orderRowsLoading}
            onUpdate={updateOrder}
          />
        )}

        {tab === "incidents" && (
          <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-card">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-secondary text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Commande</th>
                    <th className="px-4 py-3">Famille</th>
                    <th className="px-4 py-3">Produit</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3 text-center">Qté</th>
                    <th className="px-4 py-3">Éligibilité</th>
                    <th className="px-4 py-3">Statut</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {incidentsLoading && (
                    <tr>
                      <td colSpan={9} className="px-4 py-6 text-center text-muted-foreground">
                        Chargement…
                      </td>
                    </tr>
                  )}
                  {!incidentsLoading && incidents.length === 0 && (
                    <tr>
                      <td colSpan={9} className="px-4 py-6 text-center text-muted-foreground">
                        Aucun incident déclaré.
                      </td>
                    </tr>
                  )}
                  {incidents.map((inc) => (
                    <tr key={inc.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(inc.created_at).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="px-4 py-3 font-medium text-foreground">{inc.order_number ?? "—"}</td>
                      <td className="px-4 py-3">
                        {inc.family_prenom} {inc.family_nom}
                      </td>
                      <td className="px-4 py-3">
                        {inc.product_name} <span className="text-xs text-muted-foreground">({inc.size})</span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {INCIDENT_TYPE_LABELS[inc.incident_type] ?? inc.incident_type}
                      </td>
                      <td className="px-4 py-3 text-center">{inc.quantity}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${inc.eligible ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}
                        >
                          {inc.eligible ? "Éligible" : "Non éligible"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={inc.status}
                          onChange={(e) => updateIncidentStatus(inc, e.target.value)}
                          className="h-8 rounded-md border border-border bg-background px-2 text-xs"
                        >
                          {INCIDENT_STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setOpenIncident(inc)}
                          className="text-xs font-semibold text-primary hover:underline"
                        >
                          Détails
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {openIncident && (
        <IncidentDetailsModal
          incident={openIncident}
          onClose={() => setOpenIncident(null)}
          onStatusChange={(s) => updateIncidentStatus(openIncident, s)}
          onPreviewPhoto={async (p) => {
            const url = await getSignedPhotoUrl(p);
            if (url) setPhotoPreview(url);
            else toast.error("Photo introuvable");
          }}
        />
      )}
      {photoPreview && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4"
          onClick={() => setPhotoPreview(null)}
        >
          <img src={photoPreview} alt="Preuve incident" className="max-h-[90vh] max-w-[90vw] rounded-lg" />
        </div>
      )}

      <SiteFooter />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card px-5 py-4">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-foreground">{value}</div>
    </div>
  );
}

function IncidentDetailsModal({
  incident,
  onClose,
  onStatusChange,
  onPreviewPhoto,
}: {
  incident: Incident;
  onClose: () => void;
  onStatusChange: (status: string) => void;
  onPreviewPhoto: (path: string) => void;
}) {
  const [thumbs, setThumbs] = useState<Record<string, string>>({});

  useEffect(() => {
    (async () => {
      const map: Record<string, string> = {};
      await Promise.all(
        (incident.photos ?? []).map(async (p) => {
          const { data } = await supabase.storage.from("incident-photos").createSignedUrl(p, 60 * 60);
          if (data?.signedUrl) map[p] = data.signedUrl;
        }),
      );
      setThumbs(map);
    })();
  }, [incident.id, incident.photos]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
              <AlertTriangle className="h-4 w-4" /> Incident
            </div>
            <h2 className="mt-1 text-lg font-semibold text-foreground">
              {INCIDENT_TYPE_LABELS[incident.incident_type] ?? incident.incident_type}
            </h2>
            <p className="text-xs text-muted-foreground">
              Commande {incident.order_number} — déclaré le{" "}
              {new Date(incident.created_at).toLocaleDateString("fr-FR")}
            </p>
          </div>
          <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-4 px-6 py-5 text-sm">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Famille" value={`${incident.family_prenom ?? ""} ${incident.family_nom ?? ""}`.trim() || "—"} />
            <Field label="Email" value={incident.family_email ?? "—"} />
            <Field label="Enfant" value={`${incident.child_prenom ?? ""} ${incident.child_nom ?? ""}`.trim() || "—"} />
            <Field
              label="Produit"
              value={`${incident.product_name ?? "—"} · Taille ${incident.size ?? "—"} · Qté ${incident.quantity}`}
            />
            <Field
              label="Éligibilité"
              value={incident.eligible ? "Éligible à un remboursement / échange" : "Non éligible"}
            />
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Statut</div>
              <select
                value={incident.status}
                onChange={(e) => onStatusChange(e.target.value)}
                className="mt-1 h-9 w-full rounded-md border border-border bg-background px-2 text-sm"
              >
                {INCIDENT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Description
            </div>
            <p className="mt-1 whitespace-pre-wrap rounded-lg border border-border bg-muted/30 p-3 text-sm">
              {incident.description}
            </p>
          </div>
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Photos ({incident.photos?.length ?? 0})
            </div>
            {incident.photos && incident.photos.length > 0 ? (
              <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
                {incident.photos.map((p) => (
                  <button
                    key={p}
                    onClick={() => onPreviewPhoto(p)}
                    className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-muted"
                  >
                    {thumbs[p] ? (
                      <img
                        src={thumbs[p]}
                        alt="Preuve"
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                        <ImageIcon className="h-5 w-5" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <p className="mt-1 text-xs text-muted-foreground">Aucune photo jointe.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm text-foreground">{value}</div>
    </div>
  );
}

function TrackingPanel({
  orders,
  loading,
  onUpdate,
}: {
  orders: OrderRow[];
  loading: boolean;
  onUpdate: (
    orderId: string,
    patch: Partial<Pick<OrderRow, "status" | "tracking_number" | "tracking_carrier">>,
    notify: boolean,
  ) => Promise<void>;
}) {
  const [drafts, setDrafts] = useState<Record<string, { tracking_number: string; tracking_carrier: string }>>({});

  const draftFor = (o: OrderRow) =>
    drafts[o.id] ?? {
      tracking_number: o.tracking_number ?? "",
      tracking_carrier: o.tracking_carrier ?? "",
    };

  const setDraft = (id: string, patch: Partial<{ tracking_number: string; tracking_carrier: string }>) =>
    setDrafts((prev) => ({ ...prev, [id]: { ...draftFor(orders.find((o) => o.id === id)!), ...patch } }));

  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Commande</th>
              <th className="px-4 py-3">Famille</th>
              <th className="px-4 py-3">Mode</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3">Transporteur</th>
              <th className="px-4 py-3">N° de suivi</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading && (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-muted-foreground">Chargement…</td></tr>
            )}
            {!loading && orders.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-muted-foreground">Aucune commande.</td></tr>
            )}
            {orders.map((o) => {
              const d = draftFor(o);
              return (
                <tr key={o.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium text-foreground">
                    {o.order_number}
                    <div className="text-[11px] text-muted-foreground">
                      {new Date(o.created_at).toLocaleDateString("fr-FR")} · {Number(o.total_amount).toFixed(2)} €
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {o.family_prenom} {o.family_nom}
                    <div className="text-[11px] text-muted-foreground">{o.family_email}</div>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {o.shipping_mode === "pickup" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5">Retrait</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5">
                        <Truck className="h-3 w-3" /> Domicile
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={o.status}
                      onChange={(e) => onUpdate(o.id, { status: e.target.value }, true)}
                      className="h-8 rounded-md border border-border bg-background px-2 text-xs"
                    >
                      {ORDER_STATUSES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <input
                      value={d.tracking_carrier}
                      onChange={(e) => setDraft(o.id, { tracking_carrier: e.target.value })}
                      placeholder="Colissimo, Chronopost…"
                      className="h-8 w-32 rounded-md border border-border bg-background px-2 text-xs"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      value={d.tracking_number}
                      onChange={(e) => setDraft(o.id, { tracking_number: e.target.value })}
                      placeholder="N° de suivi"
                      className="h-8 w-40 rounded-md border border-border bg-background px-2 text-xs font-mono"
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() =>
                        onUpdate(
                          o.id,
                          {
                            tracking_number: d.tracking_number || null,
                            tracking_carrier: d.tracking_carrier || null,
                          },
                          true,
                        )
                      }
                      className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-[11px] font-semibold text-primary-foreground hover:bg-primary/90"
                    >
                      <Save className="h-3 w-3" /> Enregistrer
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
