import { createFileRoute, Link } from "@tanstack/react-router";
import { Fragment, useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { Download, ShieldCheck, AlertTriangle, X, ImageIcon, Truck, Save, Users, Trash2 } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { RequireAuth } from "@/components/RequireAuth";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/lib/store";
import { toast } from "sonner";
import { sendOrderStatusUpdate, sendIncidentUpdate, sendOrderCorrectionUpdate, sendTestRandomEmail, sendOrderCancellation, sendOrderRefund } from "@/lib/email.functions";
import { refundOrder, listOrderRefunds, type OrderRefundRow } from "@/lib/order-refunds.functions";
import { getOrderBilling, saveOrderBilling, type OrderBillingRow } from "@/lib/order-billing.functions";
import { updateOrderStatus, getOrderInvoice, getInvoiceDownloadUrl, type OrderInvoiceRow } from "@/lib/order-invoices.functions";
import {
  getShippingSettings,
  saveShippingSettings,
  getOrderShippingSlip,
  getShippingSlipDownloadUrl,
  type OrderShippingSlipRow,
} from "@/lib/shipping-settings.functions";
import { listRoleAssignments, setUserRole, sendTestApelReminder, sendTechnicalFixNotice, sendUrgentOrderReminder, listAllFamilies, apelListFamilies, applyOrderCorrectionStock } from "@/lib/apel.functions";
import { listCustomTemplates, saveCustomTemplate, sendCustomBulkEmail } from "@/lib/email-templates-admin.functions";
import { formatCivilite } from "@/lib/utils";
import { BlouseStockManager } from "@/components/BlouseStockManager";

const SCHOOL_LABEL = "Saint-Jacques-de-Compostelle — Dax";
const SCHOOL_SHORT = "Saint-Jacques";
const STANDARD_SIZES = ["4 ans", "6 ans", "8 ans", "10 ans", "12 ans", "14 ans", "16 ans", "18 ans"];

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

type Correction = {
  id: string;
  order_id: string;
  order_item_id: string;
  field: string;
  old_value: string;
  new_value: string;
  status: string;
  note: string | null;
  requester_email: string;
  created_at: string;
  resolved_at: string | null;
  order_number?: string;
  family_prenom?: string;
  family_nom?: string;
  order_status?: string;
  product_name?: string;
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

const ORDER_STATUSES = ["En attente", "Paiement validé", "En préparation", "Expédiée", "Livrée", "Annulée", "Remboursée"] as const;

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
  delivery_type: string;
  tracking_number: string | null;
  tracking_carrier: string | null;
  payplug_payment_id: string | null;
  paid_at: string | null;
};

function AdminPage() {
  const { isAdmin, authLoading } = useStore();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [incidentsLoading, setIncidentsLoading] = useState(true);
  const [tab, setTab] = useState<"orders" | "tracking" | "incidents" | "corrections" | "roles" | "emails">("orders");
  const [orderRows, setOrderRows] = useState<OrderRow[]>([]);
  const [orderRowsLoading, setOrderRowsLoading] = useState(true);
  const [openIncident, setOpenIncident] = useState<Incident | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [corrections, setCorrections] = useState<Correction[]>([]);
  const [correctionsLoading, setCorrectionsLoading] = useState(true);
  const [correctionModalOpen, setCorrectionModalOpen] = useState(false);

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      setIncidentsLoading(false);
      setOrderRowsLoading(false);
      setCorrectionsLoading(false);
      return;
    }
    (async () => {
      const { data, error } = await supabase
        .from("orders")
        .select(
          "id, order_number, created_at, status, total_amount, family_prenom, family_nom, family_email, shipping_mode, delivery_type, tracking_number, tracking_carrier, payplug_payment_id, paid_at",
        )
        .not("paid_at", "is", null)
        .order("created_at", { ascending: false });
      if (error) {
        toast.error(error.message);
        setOrderRowsLoading(false);
        return;
      }
      const paidOrders = (data ?? []).filter(
        (o: any) => o.status !== "Annulée" && o.status !== "Remboursée",
      );
      setOrderRows(paidOrders as unknown as OrderRow[]);
      setOrderRowsLoading(false);
    })();
    (async () => {
      const { data, error } = await supabase
        .from("order_items")
        .select(
          `
          child_prenom, child_nom, child_classe, child_section,
          product_name, product_ref, size, quantity, unit_price, line_total,
          orders!inner ( order_number, created_at, status, paid_at, family_civilite, family_nom, family_prenom, family_email, family_telephone )
        `,
        )
        .not("orders.paid_at", "is", null)
        .order("created_at", { foreignTable: "orders", ascending: false });
      if (error) {
        toast.error(error.message);
        setLoading(false);
        return;
      }
      const flat: Row[] = (data ?? [])
        .filter((r: any) => r.orders?.paid_at != null && r.orders?.status !== "Annulée")
        .map((r: any) => ({
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
    (async () => {
      const { data, error } = await supabase
        .from("order_corrections")
        .select(
          `
          id, order_id, order_item_id, field, old_value, new_value, status, note, requester_email, created_at, resolved_at,
          orders!inner ( order_number, status, family_prenom, family_nom ),
          order_items!inner ( product_name, child_prenom, child_nom )
        `,
        )
        .order("created_at", { ascending: false });
      if (error) {
        toast.error(error.message);
        setCorrectionsLoading(false);
        return;
      }
      const flat: Correction[] = (data ?? []).map((r: any) => ({
        id: r.id,
        order_id: r.order_id,
        order_item_id: r.order_item_id,
        field: r.field,
        old_value: r.old_value,
        new_value: r.new_value,
        status: r.status,
        note: r.note,
        requester_email: r.requester_email,
        created_at: r.created_at,
        resolved_at: r.resolved_at,
        order_number: r.orders?.order_number,
        order_status: r.orders?.status,
        family_prenom: r.orders?.family_prenom,
        family_nom: r.orders?.family_nom,
        product_name: r.order_items?.product_name,
        child_prenom: r.order_items?.child_prenom,
        child_nom: r.order_items?.child_nom,
      }));
      setCorrections(flat);
      setCorrectionsLoading(false);
    })();
  }, [isAdmin]);

  const updateIncidentStatus = async (incident: Incident, status: string) => {
    const { error } = await supabase.from("order_incidents").update({ status }).eq("id", incident.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setIncidents((prev) => prev.map((i) => (i.id === incident.id ? { ...i, status } : i)));
    if (openIncident?.id === incident.id) setOpenIncident({ ...openIncident, status });
    sendIncidentUpdate({ data: { incidentId: incident.id } }).catch(() => {});
    toast.success("Statut mis à jour");
  };

  const applyCorrection = async (correction: Correction) => {
    const stockResult = await applyOrderCorrectionStock({ data: { correctionId: correction.id } });
    if (!stockResult.ok) {
      toast.error(
        (stockResult as any).error === "stock_exhausted"
          ? `Stock épuisé pour la taille ${correction.new_value} — choisissez une autre taille`
          : (stockResult as any).error || "Erreur lors de l'ajustement du stock",
      );
      return;
    }
    const { error: itemError } = await supabase
      .from("order_items")
      .update({ size: correction.new_value })
      .eq("id", correction.order_item_id);
    if (itemError) {
      toast.error(itemError.message);
      return;
    }
    const resolvedAt = new Date().toISOString();
    const { error } = await supabase
      .from("order_corrections")
      .update({ status: "Résolu", resolved_at: resolvedAt })
      .eq("id", correction.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setCorrections((prev) =>
      prev.map((c) => (c.id === correction.id ? { ...c, status: "Résolu", resolved_at: resolvedAt } : c)),
    );
    sendOrderCorrectionUpdate({ data: { correctionId: correction.id } }).catch(() => {});
    toast.success("Taille corrigée et famille notifiée");
  };

  const cancelCorrection = async (correction: Correction) => {
    const resolvedAt = new Date().toISOString();
    const { error } = await supabase
      .from("order_corrections")
      .update({ status: "Annulé", resolved_at: resolvedAt })
      .eq("id", correction.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setCorrections((prev) =>
      prev.map((c) => (c.id === correction.id ? { ...c, status: "Annulé", resolved_at: resolvedAt } : c)),
    );
    toast.success("Demande annulée");
  };

  const updateOrder = async (
    orderId: string,
    patch: Partial<Pick<OrderRow, "status" | "tracking_number" | "tracking_carrier">>,
    notify: boolean,
  ): Promise<boolean> => {
    // Le changement de statut passe par une server function (plutôt qu'un update client direct) :
    // le passage à "Livrée" doit déclencher la génération atomique de la facture (numéro
    // comptable séquentiel + PDF), ce qui ne peut pas se faire de façon fiable côté client.
    if (patch.status !== undefined) {
      const result = await updateOrderStatus({
        data: {
          orderId,
          status: patch.status,
          trackingNumber: patch.tracking_number,
          trackingCarrier: patch.tracking_carrier,
        },
      });
      if (!result.ok) {
        toast.error(result.error);
        return false;
      }
      setOrderRows((prev) => prev.map((o) => (o.id === orderId ? { ...o, ...patch } : o)));
      if (notify) sendOrderStatusUpdate({ data: { orderId } }).catch(() => {});
      if (result.invoiceNumber) toast.success(`Commande mise à jour — facture ${result.invoiceNumber} générée`);
      else toast.success("Commande mise à jour");
      return true;
    }

    const { error } = await supabase.from("orders").update(patch).eq("id", orderId);
    if (error) {
      toast.error(error.message);
      return false;
    }
    setOrderRows((prev) => prev.map((o) => (o.id === orderId ? { ...o, ...patch } : o)));
    if (notify) {
      sendOrderStatusUpdate({ data: { orderId } }).catch(() => {});
    }
    toast.success("Commande mise à jour");
    return true;
  };

  const getSignedPhotoUrl = async (path: string): Promise<string | null> => {
    const { data, error } = await supabase.storage.from("incident-photos").createSignedUrl(path, 60 * 60);
    if (error) return null;
    return data.signedUrl;
  };

  const exportExcel = () => {
    const data = rows.map((r) => ({
      "N° Commande": r.order_number,
      Date: new Date(r.created_at).toLocaleDateString("fr-FR"),
      Statut: r.status,
      Famille: `${formatCivilite(r.family_civilite)} ${r.family_prenom} ${r.family_nom}`.trim(),
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
  const totalCA_HT = totalCA / 1.2;
  const incidentsEnAttente = incidents.filter((i) => ["À traiter", "En attente"].includes(i.status)).length;
  const correctionsEnAttente = corrections.filter((c) => c.status === "À traiter").length;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader schoolName={SCHOOL_LABEL} />
      <section className="mx-auto max-w-6xl w-full px-4 pt-6 pb-12 sm:px-6 lg:px-8">
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

        <div className="mt-6 grid gap-3 sm:grid-cols-4">
          <Stat label="Commandes" value={totalCommandes.toString()} />
          <Stat label="Articles" value={totalArticles.toString()} />
          <Stat label="Total HT" value={`${totalCA_HT.toFixed(2)} €`} />
          <Stat label="Total TTC" value={`${totalCA.toFixed(2)} €`} />
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
          <button
            onClick={() => setTab("corrections")}
            className={`relative rounded-lg px-4 py-2 text-sm font-medium transition-colors ${tab === "corrections" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            Corrections
            {correctionsEnAttente > 0 && (
              <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-semibold text-destructive-foreground">
                {correctionsEnAttente}
              </span>
            )}
          </button>
          <button
            onClick={() => setTab("roles")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${tab === "roles" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Users className="mr-1 inline h-3.5 w-3.5" /> Rôles
          </button>
          <button
            onClick={() => setTab("emails")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${tab === "emails" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            Emails
          </button>
          <Link
            to="/apel"
            className="inline-flex items-center gap-1 rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <Users className="mr-1 inline h-3.5 w-3.5" /> Espace APEL
          </Link>
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

        {tab === "tracking" && <TrackingPanel orders={orderRows} loading={orderRowsLoading} onUpdate={updateOrder} />}

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

        {tab === "corrections" && (
          <div className="mt-4">
            <div className="mb-3 flex justify-end">
              <button
                onClick={() => setCorrectionModalOpen(true)}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                Nouvelle demande
              </button>
            </div>
            <div className="overflow-hidden rounded-2xl border border-border bg-card">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-secondary text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Commande</th>
                      <th className="px-4 py-3">Famille</th>
                      <th className="px-4 py-3">Enfant</th>
                      <th className="px-4 py-3">Article</th>
                      <th className="px-4 py-3">Taille actuelle → demandée</th>
                      <th className="px-4 py-3">Statut</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {correctionsLoading && (
                      <tr>
                        <td colSpan={8} className="px-4 py-6 text-center text-muted-foreground">
                          Chargement…
                        </td>
                      </tr>
                    )}
                    {!correctionsLoading && corrections.length === 0 && (
                      <tr>
                        <td colSpan={8} className="px-4 py-6 text-center text-muted-foreground">
                          Aucune demande de correction.
                        </td>
                      </tr>
                    )}
                    {corrections.map((c) => (
                      <tr key={c.id} className="hover:bg-muted/30">
                        <td className="px-4 py-3 text-muted-foreground">
                          {new Date(c.created_at).toLocaleDateString("fr-FR")}
                        </td>
                        <td className="px-4 py-3 font-medium text-foreground">
                          {c.order_number ?? "—"}
                          {(c.order_status === "Expédiée" || c.order_status === "Livrée") && (
                            <span className="ml-2 inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                              Déjà {c.order_status.toLowerCase()}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {c.family_prenom} {c.family_nom}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {c.child_prenom} {c.child_nom}
                        </td>
                        <td className="px-4 py-3">{c.product_name ?? "—"}</td>
                        <td className="px-4 py-3">
                          {c.old_value} → <strong>{c.new_value}</strong>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
                              c.status === "Résolu"
                                ? "bg-emerald-100 text-emerald-700"
                                : c.status === "Annulé"
                                  ? "bg-secondary text-muted-foreground"
                                  : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {c.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {c.status === "À traiter" && (
                            <div className="flex justify-end gap-3">
                              <button
                                onClick={() => applyCorrection(c)}
                                className="text-xs font-semibold text-primary hover:underline"
                              >
                                Appliquer
                              </button>
                              <button
                                onClick={() => cancelCorrection(c)}
                                className="text-xs font-semibold text-muted-foreground hover:underline"
                              >
                                Annuler
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {tab === "roles" && <RolesPanel />}
        {tab === "emails" && <EmailsPanel />}
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
      {correctionModalOpen && (
        <CorrectionCreateModal
          onClose={() => setCorrectionModalOpen(false)}
          onCreated={(c) =>
            setCorrections((prev) => [
              {
                id: c.id,
                order_id: c.order_id,
                order_item_id: c.order_item_id,
                field: c.field,
                old_value: c.old_value,
                new_value: c.new_value,
                status: c.status,
                note: c.note,
                requester_email: c.requester_email,
                created_at: c.created_at,
                resolved_at: c.resolved_at,
                order_number: c.order_number,
                order_status: c.order_status,
                family_prenom: c.family_prenom,
                family_nom: c.family_nom,
                product_name: c.product_name,
                child_prenom: c.child_prenom,
                child_nom: c.child_nom,
              },
              ...prev,
            ])
          }
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

function RolesPanel() {
  const [assignments, setAssignments] = useState<
    Array<{ user_id: string; role: string; email: string; prenom: string; nom: string; created_at: string }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"apel" | "admin">("apel");
  const [busy, setBusy] = useState(false);
  const [fixTestEmail, setFixTestEmail] = useState("");
  const [fixBusy, setFixBusy] = useState(false);
  const [fixMode, setFixMode] = useState<"all" | "select" | "manual">("all");
  const [fixFamilies, setFixFamilies] = useState<
    Array<{ id: string; email: string; prenom: string; nom: string }>
  >([]);
  const [fixSelected, setFixSelected] = useState<Record<string, boolean>>({});
  const [fixSearch, setFixSearch] = useState("");
  const [fixLoaded, setFixLoaded] = useState(false);
  const [fixRawEmails, setFixRawEmails] = useState("");

  const [urgentDeadline, setUrgentDeadline] = useState("dimanche 26 juillet 2026");
  const [urgentTestEmail, setUrgentTestEmail] = useState("");
  const [urgentBusy, setUrgentBusy] = useState(false);
  const [urgentMode, setUrgentMode] = useState<"all" | "select" | "manual">("all");
  const [urgentFamilies, setUrgentFamilies] = useState<
    Array<{ id: string; email: string; prenom: string; nom: string }>
  >([]);
  const [urgentSelected, setUrgentSelected] = useState<Record<string, boolean>>({});
  const [urgentSearch, setUrgentSearch] = useState("");
  const [urgentLoaded, setUrgentLoaded] = useState(false);
  const [urgentRawEmails, setUrgentRawEmails] = useState("");

  const loadUrgentFamilies = async () => {
    const r = await listAllFamilies({ data: {} });
    if (r.ok) {
      setUrgentFamilies(r.families as any);
      setUrgentLoaded(true);
    } else toast.error((r as any).error || "Erreur de chargement");
  };

  const loadFixFamilies = async () => {
    const r = await listAllFamilies({ data: {} });
    if (r.ok) {
      setFixFamilies(r.families as any);
      setFixLoaded(true);
    } else toast.error((r as any).error || "Erreur de chargement");
  };

  const refresh = async () => {
    setLoading(true);
    const r = await listRoleAssignments({ data: {} });
    if (r.ok) setAssignments(r.assignments as any);
    else toast.error(r.error || "Erreur de chargement");
    setLoading(false);
  };
  useEffect(() => {
    refresh();
  }, []);

  const grant = async () => {
    if (!email.trim()) return;
    setBusy(true);
    const r = await setUserRole({ data: { email: email.trim(), role, action: "grant" } });
    setBusy(false);
    if (!r.ok)
      toast.error(
        r.error === "user_not_found"
          ? "Utilisateur introuvable (l'email doit déjà avoir un compte)"
          : r.error || "Erreur",
      );
    else {
      toast.success(`Rôle ${role} attribué à ${email}`);
      setEmail("");
      refresh();
    }
  };

  const revoke = async (userEmail: string, userRole: string) => {
    if (!confirm(`Retirer le rôle ${userRole} à ${userEmail} ?`)) return;
    const r = await setUserRole({ data: { email: userEmail, role: userRole as "apel" | "admin", action: "revoke" } });
    if (!r.ok) toast.error(r.error || "Erreur");
    else {
      toast.success("Rôle retiré");
      refresh();
    }
  };

  return (
    <div className="mt-4 space-y-6">
      <BlouseStockManager />
      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="text-base font-semibold text-foreground">Test email APEL</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Envoie un email de relance APEL au compte de test{" "}
          <strong>brandon@franceuniformes.fr</strong>.
        </p>
        <button
          onClick={async () => {
            const r = await sendTestApelReminder({ data: {} });
            if (r.ok) toast.success(`Email envoyé à ${r.recipient}`);
            else toast.error(r.error || "Erreur");
          }}
          className="mt-3 h-10 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          Envoyer le test
        </button>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="text-base font-semibold text-foreground">Email « souci technique résolu »</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Informe les familles inscrites que le problème de connexion / création de compte est résolu et qu'elles
          peuvent à nouveau accéder à leur espace et commander.
        </p>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[220px]">
            <label className="text-xs font-medium text-muted-foreground">Envoyer un test à</label>
            <input
              type="email"
              value={fixTestEmail}
              onChange={(e) => setFixTestEmail(e.target.value)}
              placeholder="test@example.com"
              className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none"
            />
          </div>
          <button
            onClick={async () => {
              if (!fixTestEmail.trim()) return;
              setFixBusy(true);
              const r = await sendTechnicalFixNotice({ data: { testEmail: fixTestEmail.trim() } });
              setFixBusy(false);
              if (r.ok) toast.success(`Email de test envoyé à ${fixTestEmail.trim()}`);
              else toast.error((r as any).error || "Erreur");
            }}
            disabled={fixBusy || !fixTestEmail.trim()}
            className="h-10 rounded-lg border border-border px-4 text-sm font-semibold text-foreground hover:bg-muted/40 disabled:opacity-50"
          >
            Envoyer un test
          </button>
        </div>

        <div className="mt-5 border-t border-border pt-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Destinataires :</span>
            <button
              onClick={() => setFixMode("all")}
              className={`h-8 rounded-lg px-3 text-xs font-semibold ${fixMode === "all" ? "bg-primary text-primary-foreground" : "border border-border text-foreground hover:bg-muted/40"}`}
            >
              Toutes les familles
            </button>
            <button
              onClick={() => {
                setFixMode("select");
                if (!fixLoaded) loadFixFamilies();
              }}
              className={`h-8 rounded-lg px-3 text-xs font-semibold ${fixMode === "select" ? "bg-primary text-primary-foreground" : "border border-border text-foreground hover:bg-muted/40"}`}
            >
              Sélectionner
            </button>
            <button
              onClick={() => setFixMode("manual")}
              className={`h-8 rounded-lg px-3 text-xs font-semibold ${fixMode === "manual" ? "bg-primary text-primary-foreground" : "border border-border text-foreground hover:bg-muted/40"}`}
            >
              Saisir manuellement
            </button>
          </div>

          {fixMode === "select" && (
            <div className="mt-3">
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="search"
                  value={fixSearch}
                  onChange={(e) => setFixSearch(e.target.value)}
                  placeholder="Rechercher (nom, prénom, email)…"
                  className="h-9 flex-1 min-w-[200px] rounded-lg border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none"
                />
                <button
                  onClick={() => {
                    const visible = fixFamilies.filter((f) => {
                      const q = fixSearch.trim().toLowerCase();
                      if (!q) return true;
                      return `${f.prenom} ${f.nom} ${f.email}`.toLowerCase().includes(q);
                    });
                    const next = { ...fixSelected };
                    visible.forEach((f) => (next[f.id] = true));
                    setFixSelected(next);
                  }}
                  className="h-9 rounded-lg border border-border px-3 text-xs font-semibold hover:bg-muted/40"
                >
                  Tout cocher
                </button>
                <button
                  onClick={() => setFixSelected({})}
                  className="h-9 rounded-lg border border-border px-3 text-xs font-semibold hover:bg-muted/40"
                >
                  Tout décocher
                </button>
              </div>
              <div className="mt-3 max-h-64 overflow-y-auto rounded-lg border border-border divide-y divide-border">
                {!fixLoaded && <p className="px-3 py-4 text-sm text-muted-foreground">Chargement…</p>}
                {fixLoaded &&
                  fixFamilies
                    .filter((f) => {
                      const q = fixSearch.trim().toLowerCase();
                      if (!q) return true;
                      return `${f.prenom} ${f.nom} ${f.email}`.toLowerCase().includes(q);
                    })
                    .map((f) => (
                      <label key={f.id} className="flex cursor-pointer items-center gap-3 px-3 py-2 text-sm hover:bg-muted/30">
                        <input
                          type="checkbox"
                          checked={!!fixSelected[f.id]}
                          onChange={(e) => setFixSelected((s) => ({ ...s, [f.id]: e.target.checked }))}
                        />
                        <span className="font-medium">{f.prenom} {f.nom}</span>
                        <span className="text-muted-foreground">{f.email}</span>
                      </label>
                    ))}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {Object.values(fixSelected).filter(Boolean).length} famille(s) sélectionnée(s)
              </p>
            </div>
          )}

          {fixMode === "manual" && (
            <div className="mt-3">
              <label className="text-xs font-medium text-muted-foreground">
                Emails (séparés par des virgules)
              </label>
              <textarea
                value={fixRawEmails}
                onChange={(e) => setFixRawEmails(e.target.value)}
                placeholder="email1@example.com, email2@example.com, …"
                rows={4}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
            </div>
          )}

          <button
            onClick={async () => {
              const ids = Object.keys(fixSelected).filter((id) => fixSelected[id]);
              if (fixMode === "select" && ids.length === 0) {
                toast.error("Sélectionnez au moins une famille");
                return;
              }
              if (fixMode === "manual") {
                const emails = fixRawEmails.split(",").map((e) => e.trim()).filter(Boolean);
                if (emails.length === 0) {
                  toast.error("Saisissez au moins un email");
                  return;
                }
                const invalid = emails.filter((e) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
                if (invalid.length > 0) {
                  toast.error(`Emails invalides : ${invalid.join(", ")}`);
                  return;
                }
                if (!confirm(`Envoyer cet email à ${emails.length} adresse(s) ?`)) return;
                setFixBusy(true);
                const r = await sendTechnicalFixNotice({ data: { rawEmails: emails } });
                setFixBusy(false);
                if (r.ok) toast.success(`Email envoyé à ${r.sent} / ${r.total} destinataire(s)`);
                else toast.error((r as any).error || "Erreur");
                return;
              }
              const label = fixMode === "all" ? "TOUTES les familles inscrites" : `${ids.length} famille(s) sélectionnée(s)`;
              if (!confirm(`Envoyer cet email à ${label} ?`)) return;
              setFixBusy(true);
              const r = await sendTechnicalFixNotice({ data: fixMode === "select" ? { userIds: ids } : {} });
              setFixBusy(false);
              if (r.ok) toast.success(`Email envoyé à ${r.sent} / ${r.total} famille(s)`);
              else toast.error((r as any).error || "Erreur");
            }}
            disabled={fixBusy}
            className="mt-4 h-10 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {fixMode === "all" && "Envoyer à toutes les familles"}
            {fixMode === "select" && "Envoyer aux familles sélectionnées"}
            {fixMode === "manual" && "Envoyer aux adresses saisies"}
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="text-base font-semibold text-foreground">Email « relance urgente commande groupée »</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Relance les familles n'ayant pas encore commandé, en précisant que passé la date limite indiquée ci-dessous,
          les commandes ne pourront plus être intégrées à la livraison groupée de l'établissement et seront livrées
          individuellement.
        </p>

        <div className="mt-4">
          <label className="text-xs font-medium text-muted-foreground">Date limite (affichée dans le mail)</label>
          <input
            type="text"
            value={urgentDeadline}
            onChange={(e) => setUrgentDeadline(e.target.value)}
            placeholder="ex : 15 août 2026"
            className="mt-1 h-10 w-full max-w-xs rounded-lg border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none"
          />
        </div>

        <div className="mt-4 flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[220px]">
            <label className="text-xs font-medium text-muted-foreground">Envoyer un test à</label>
            <input
              type="email"
              value={urgentTestEmail}
              onChange={(e) => setUrgentTestEmail(e.target.value)}
              placeholder="test@example.com"
              className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none"
            />
          </div>
          <button
            onClick={async () => {
              if (!urgentTestEmail.trim() || !urgentDeadline.trim()) return;
              setUrgentBusy(true);
              const r = await sendUrgentOrderReminder({
                data: { testEmail: urgentTestEmail.trim(), deadline: urgentDeadline.trim() },
              });
              setUrgentBusy(false);
              if (r.ok) toast.success(`Email de test envoyé à ${urgentTestEmail.trim()}`);
              else toast.error((r as any).error || "Erreur");
            }}
            disabled={urgentBusy || !urgentTestEmail.trim() || !urgentDeadline.trim()}
            className="h-10 rounded-lg border border-border px-4 text-sm font-semibold text-foreground hover:bg-muted/40 disabled:opacity-50"
          >
            Envoyer un test
          </button>
        </div>

        <div className="mt-5 border-t border-border pt-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Destinataires :</span>
            <button
              onClick={() => setUrgentMode("all")}
              className={`h-8 rounded-lg px-3 text-xs font-semibold ${urgentMode === "all" ? "bg-primary text-primary-foreground" : "border border-border text-foreground hover:bg-muted/40"}`}
            >
              Toutes les familles
            </button>
            <button
              onClick={() => {
                setUrgentMode("select");
                if (!urgentLoaded) loadUrgentFamilies();
              }}
              className={`h-8 rounded-lg px-3 text-xs font-semibold ${urgentMode === "select" ? "bg-primary text-primary-foreground" : "border border-border text-foreground hover:bg-muted/40"}`}
            >
              Sélectionner
            </button>
            <button
              onClick={() => setUrgentMode("manual")}
              className={`h-8 rounded-lg px-3 text-xs font-semibold ${urgentMode === "manual" ? "bg-primary text-primary-foreground" : "border border-border text-foreground hover:bg-muted/40"}`}
            >
              Saisir manuellement
            </button>
          </div>

          {urgentMode === "select" && (
            <div className="mt-3">
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="search"
                  value={urgentSearch}
                  onChange={(e) => setUrgentSearch(e.target.value)}
                  placeholder="Rechercher (nom, prénom, email)…"
                  className="h-9 flex-1 min-w-[200px] rounded-lg border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none"
                />
                <button
                  onClick={() => {
                    const visible = urgentFamilies.filter((f) => {
                      const q = urgentSearch.trim().toLowerCase();
                      if (!q) return true;
                      return `${f.prenom} ${f.nom} ${f.email}`.toLowerCase().includes(q);
                    });
                    const next = { ...urgentSelected };
                    visible.forEach((f) => (next[f.id] = true));
                    setUrgentSelected(next);
                  }}
                  className="h-9 rounded-lg border border-border px-3 text-xs font-semibold hover:bg-muted/40"
                >
                  Tout cocher
                </button>
                <button
                  onClick={() => setUrgentSelected({})}
                  className="h-9 rounded-lg border border-border px-3 text-xs font-semibold hover:bg-muted/40"
                >
                  Tout décocher
                </button>
              </div>
              <div className="mt-3 max-h-64 overflow-y-auto rounded-lg border border-border divide-y divide-border">
                {!urgentLoaded && <p className="px-3 py-4 text-sm text-muted-foreground">Chargement…</p>}
                {urgentLoaded &&
                  urgentFamilies
                    .filter((f) => {
                      const q = urgentSearch.trim().toLowerCase();
                      if (!q) return true;
                      return `${f.prenom} ${f.nom} ${f.email}`.toLowerCase().includes(q);
                    })
                    .map((f) => (
                      <label key={f.id} className="flex cursor-pointer items-center gap-3 px-3 py-2 text-sm hover:bg-muted/30">
                        <input
                          type="checkbox"
                          checked={!!urgentSelected[f.id]}
                          onChange={(e) => setUrgentSelected((s) => ({ ...s, [f.id]: e.target.checked }))}
                        />
                        <span className="font-medium">{f.prenom} {f.nom}</span>
                        <span className="text-muted-foreground">{f.email}</span>
                      </label>
                    ))}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {Object.values(urgentSelected).filter(Boolean).length} famille(s) sélectionnée(s)
              </p>
            </div>
          )}

          {urgentMode === "manual" && (
            <div className="mt-3">
              <label className="text-xs font-medium text-muted-foreground">
                Emails (séparés par des virgules)
              </label>
              <textarea
                value={urgentRawEmails}
                onChange={(e) => setUrgentRawEmails(e.target.value)}
                placeholder="email1@example.com, email2@example.com, …"
                rows={4}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
            </div>
          )}

          <button
            onClick={async () => {
              if (!urgentDeadline.trim()) {
                toast.error("Renseignez la date limite");
                return;
              }
              const ids = Object.keys(urgentSelected).filter((id) => urgentSelected[id]);
              if (urgentMode === "select" && ids.length === 0) {
                toast.error("Sélectionnez au moins une famille");
                return;
              }
              if (urgentMode === "manual") {
                const emails = urgentRawEmails.split(",").map((e) => e.trim()).filter(Boolean);
                if (emails.length === 0) {
                  toast.error("Saisissez au moins un email");
                  return;
                }
                const invalid = emails.filter((e) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
                if (invalid.length > 0) {
                  toast.error(`Emails invalides : ${invalid.join(", ")}`);
                  return;
                }
                if (!confirm(`Envoyer cet email à ${emails.length} adresse(s) ?`)) return;
                setUrgentBusy(true);
                const r = await sendUrgentOrderReminder({
                  data: { rawEmails: emails, deadline: urgentDeadline.trim() },
                });
                setUrgentBusy(false);
                if (r.ok) toast.success(`Email envoyé à ${r.sent} / ${r.total} destinataire(s)`);
                else toast.error((r as any).error || "Erreur");
                return;
              }
              const label = urgentMode === "all" ? "TOUTES les familles inscrites" : `${ids.length} famille(s) sélectionnée(s)`;
              if (!confirm(`Envoyer cet email à ${label} ?`)) return;
              setUrgentBusy(true);
              const r = await sendUrgentOrderReminder({
                data: {
                  deadline: urgentDeadline.trim(),
                  ...(urgentMode === "select" ? { userIds: ids } : {}),
                },
              });
              setUrgentBusy(false);
              if (r.ok) toast.success(`Email envoyé à ${r.sent} / ${r.total} famille(s)`);
              else toast.error((r as any).error || "Erreur");
            }}
            disabled={urgentBusy}
            className="mt-4 h-10 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {urgentMode === "all" && "Envoyer à toutes les familles"}
            {urgentMode === "select" && "Envoyer aux familles sélectionnées"}
            {urgentMode === "manual" && "Envoyer aux adresses saisies"}
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="text-base font-semibold text-foreground">Attribuer un rôle</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Le rôle <strong>APEL</strong> permet à l'Association des Parents d'Élèves de consulter la liste des familles
          et leur statut de commande, et d'envoyer des relances par email. L'utilisateur doit déjà avoir créé son
          compte.
        </p>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[220px]">
            <label className="text-xs font-medium text-muted-foreground">{"EMAIL\n"} du compte</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="parent@example.com"
              className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Rôle</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as "apel" | "admin")}
              className="mt-1 h-10 rounded-lg border border-border bg-background px-3 text-sm"
            >
              <option value="apel">APEL</option>
              <option value="admin">Administrateur</option>
            </select>
          </div>
          <button
            onClick={grant}
            disabled={busy || !email.trim()}
            className="h-10 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            Attribuer
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Utilisateur</th>
                <th className="px-4 py-3">{"EMAIL\n"}</th>
                <th className="px-4 py-3">Rôle</th>
                <th className="px-4 py-3">Attribué le</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                    Chargement…
                  </td>
                </tr>
              )}
              {!loading && assignments.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                    Aucun rôle attribué.
                  </td>
                </tr>
              )}
              {assignments.map((a) => (
                <tr key={`${a.user_id}-${a.role}`} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">
                    {a.prenom} {a.nom}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{a.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${a.role === "admin" ? "bg-primary/15 text-primary" : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"}`}
                    >
                      {a.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(a.created_at).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => revoke(a.email, a.role)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--rouge)] hover:underline"
                    >
                      <Trash2 className="h-3 w-3" /> Retirer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
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
              Commande {incident.order_number} — déclaré le {new Date(incident.created_at).toLocaleDateString("fr-FR")}
            </p>
          </div>
          <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-4 px-6 py-5 text-sm">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              label="Famille"
              value={`${incident.family_prenom ?? ""} ${incident.family_nom ?? ""}`.trim() || "—"}
            />
            <Field label={"EMAIL\n"} value={incident.family_email ?? "—"} />
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
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Description</div>
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

type OrderItemRow = { id: string; product_name: string; size: string; line_total: number };

// Bouton déclencheur, prévu pour rester dans la rangée de boutons (le <td> d'actions) : le
// panneau déplié, lui, est rendu par RefundPanelContent dans une <tr> pleine largeur séparée
// (voir TrackingPanel) car il est trop grand pour tenir dans cette cellule.
function RefundTriggerButton({ disabled, open, onOpen }: { disabled: boolean; open: boolean; onOpen: () => void }) {
  if (open) return null;
  return (
    <button
      onClick={onOpen}
      disabled={disabled}
      className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-[11px] font-semibold text-foreground hover:bg-muted disabled:opacity-50"
      title={disabled ? "Commande non payée via PayPlug" : undefined}
    >
      Rembourser
    </button>
  );
}

function RefundPanelContent({ orderId, onClose }: { orderId: string; onClose: () => void }) {
  const [items, setItems] = useState<OrderItemRow[]>([]);
  const [refunds, setRefunds] = useState<OrderRefundRow[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    const [{ data: itemRows }, refundsResult] = await Promise.all([
      supabase.from("order_items").select("id, product_name, size, line_total").eq("order_id", orderId),
      listOrderRefunds({ data: { orderId } }),
    ]);
    setItems((itemRows ?? []) as OrderItemRow[]);
    if (refundsResult.ok) setRefunds(refundsResult.refunds);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const alreadyRefundedIds = new Set(refunds.filter((r) => r.status === "Réussi").flatMap((r) => r.order_item_ids));
  const total = items.filter((i) => selected.has(i.id)).reduce((s, i) => s + Number(i.line_total), 0);

  const submit = async () => {
    if (selected.size === 0) return;
    setSubmitting(true);
    const result = await refundOrder({ data: { orderId, orderItemIds: Array.from(selected), reason: reason || undefined } });
    setSubmitting(false);
    if (!result.ok) {
      toast.error(`Remboursement échoué : ${result.error}`);
      await load();
      return;
    }
    toast.success(`Remboursement de ${result.amount.toFixed(2)} € effectué`);
    sendOrderRefund({ data: { refundId: result.refundId } }).catch(() => {});
    setSelected(new Set());
    setReason("");
    await load();
  };

  return (
    <div className="rounded-lg border border-border bg-muted/20 p-3 text-xs">
      {loading && <p className="text-muted-foreground">Chargement…</p>}
      {!loading && (
        <>
          <div className="space-y-1">
            {items.map((i) => {
              const refunded = alreadyRefundedIds.has(i.id);
              return (
                <label key={i.id} className={`flex items-center gap-2 ${refunded ? "opacity-40" : ""}`}>
                  <input
                    type="checkbox"
                    disabled={refunded}
                    checked={selected.has(i.id)}
                    onChange={() => toggle(i.id)}
                  />
                  {i.product_name} — {i.size} ({Number(i.line_total).toFixed(2)} €)
                  {refunded && <span className="italic"> déjà remboursé</span>}
                </label>
              );
            })}
          </div>
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Motif (optionnel)"
            className="mt-2 h-8 w-full rounded-md border border-border bg-background px-2 text-xs"
          />
          <div className="mt-2 flex items-center justify-between">
            <span className="font-semibold">Total sélectionné : {total.toFixed(2)} €</span>
            <button
              onClick={submit}
              disabled={selected.size === 0 || submitting}
              className="rounded-md bg-primary px-3 py-1.5 text-[11px] font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {submitting ? "…" : `Rembourser ${total.toFixed(2)} €`}
            </button>
          </div>
          {refunds.length > 0 && (
            <div className="mt-3 border-t border-border pt-2">
              <p className="mb-1 font-semibold text-muted-foreground">Historique</p>
              {refunds.map((r) => (
                <div key={r.id} className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>
                    {new Date(r.created_at).toLocaleDateString("fr-FR")} — {Number(r.amount).toFixed(2)} €
                    {r.reason ? ` (${r.reason})` : ""}
                  </span>
                  <span className={r.status === "Réussi" ? "text-emerald-600" : "text-destructive"}>{r.status}</span>
                </div>
              ))}
            </div>
          )}
          <button onClick={onClose} className="mt-2 text-[11px] text-muted-foreground hover:underline">
            Fermer
          </button>
        </>
      )}
    </div>
  );
}

// Édition de facturation réservée aux commandes déjà "Livrée" (voir saveOrderBilling) : une fois
// la commande livrée, seules d'éventuelles corrections de facturation restent possibles.
function BillingTriggerButton({ disabled, open, onOpen }: { disabled: boolean; open: boolean; onOpen: () => void }) {
  if (open) return null;
  return (
    <button
      onClick={onOpen}
      disabled={disabled}
      className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-[11px] font-semibold text-foreground hover:bg-muted disabled:opacity-50"
      title={disabled ? "Disponible une fois la commande livrée" : undefined}
    >
      Facturation
    </button>
  );
}

function BillingPanelContent({
  orderId,
  defaultName,
  onClose,
}: {
  orderId: string;
  defaultName: string;
  onClose: () => void;
}) {
  const [billing, setBilling] = useState<OrderBillingRow | null>(null);
  const [invoice, setInvoice] = useState<OrderInvoiceRow | null>(null);
  const [form, setForm] = useState({
    billingName: "",
    billingAddress: "",
    billingPostal: "",
    billingCity: "",
    note: "",
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const load = async () => {
    setLoading(true);
    const [result, invoiceResult] = await Promise.all([
      getOrderBilling({ data: { orderId } }),
      getOrderInvoice({ data: { orderId } }),
    ]);
    if (result.ok) {
      setBilling(result.billing);
      setForm({
        billingName: result.billing?.billing_name ?? defaultName,
        billingAddress: result.billing?.billing_address ?? "",
        billingPostal: result.billing?.billing_postal ?? "",
        billingCity: result.billing?.billing_city ?? "",
        note: result.billing?.note ?? "",
      });
    }
    if (invoiceResult.ok) setInvoice(invoiceResult.invoice);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const submit = async () => {
    setSaving(true);
    const result = await saveOrderBilling({
      data: {
        orderId,
        billingName: form.billingName || undefined,
        billingAddress: form.billingAddress || undefined,
        billingPostal: form.billingPostal || undefined,
        billingCity: form.billingCity || undefined,
        note: form.note || undefined,
      },
    });
    setSaving(false);
    if (!result.ok) {
      toast.error(`Enregistrement échoué : ${result.error}`);
      return;
    }
    toast.success("Facturation mise à jour");
    await load();
  };

  const download = async () => {
    setDownloading(true);
    const result = await getInvoiceDownloadUrl({ data: { orderId } });
    setDownloading(false);
    if (!result.ok || !result.url) {
      toast.error("Téléchargement impossible");
      return;
    }
    window.open(result.url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="rounded-lg border border-border bg-muted/20 p-3 text-xs">
      {loading && <p className="text-muted-foreground">Chargement…</p>}
      {!loading && (
        <>
          {invoice ? (
            <div className="mb-3 flex items-center justify-between rounded-md border border-border bg-background px-3 py-2">
              <span>
                Facture <span className="font-mono font-semibold">{invoice.invoice_number}</span> — générée le{" "}
                {new Date(invoice.created_at).toLocaleDateString("fr-FR")}
              </span>
              <button
                onClick={download}
                disabled={downloading || !invoice.pdf_path}
                className="rounded-md bg-primary px-3 py-1.5 text-[11px] font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {downloading ? "…" : "Télécharger"}
              </button>
            </div>
          ) : (
            <p className="mb-3 text-muted-foreground">
              Aucune facture générée (créée automatiquement au passage au statut « Livrée »).
            </p>
          )}
          <div className="grid grid-cols-2 gap-2">
            <input
              value={form.billingName}
              onChange={(e) => setForm((f) => ({ ...f, billingName: e.target.value }))}
              placeholder="Nom / raison sociale"
              className="col-span-2 h-8 rounded-md border border-border bg-background px-2 text-xs"
            />
            <input
              value={form.billingAddress}
              onChange={(e) => setForm((f) => ({ ...f, billingAddress: e.target.value }))}
              placeholder="Adresse de facturation"
              className="col-span-2 h-8 rounded-md border border-border bg-background px-2 text-xs"
            />
            <input
              value={form.billingPostal}
              onChange={(e) => setForm((f) => ({ ...f, billingPostal: e.target.value }))}
              placeholder="Code postal"
              className="h-8 rounded-md border border-border bg-background px-2 text-xs"
            />
            <input
              value={form.billingCity}
              onChange={(e) => setForm((f) => ({ ...f, billingCity: e.target.value }))}
              placeholder="Ville"
              className="h-8 rounded-md border border-border bg-background px-2 text-xs"
            />
          </div>
          <input
            value={form.note}
            onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
            placeholder="Note (optionnel)"
            className="mt-2 h-8 w-full rounded-md border border-border bg-background px-2 text-xs"
          />
          <div className="mt-2 flex items-center justify-between">
            {billing?.updated_at ? (
              <span className="text-[11px] text-muted-foreground">
                Dernière modification : {new Date(billing.updated_at).toLocaleString("fr-FR")}
              </span>
            ) : (
              <span />
            )}
            <button
              onClick={submit}
              disabled={saving}
              className="rounded-md bg-primary px-3 py-1.5 text-[11px] font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {saving ? "…" : "Enregistrer"}
            </button>
          </div>
          <button onClick={onClose} className="mt-2 text-[11px] text-muted-foreground hover:underline">
            Fermer
          </button>
        </>
      )}
    </div>
  );
}

// Bordereau de livraison : généré automatiquement à la commande pour les livraisons
// individuelles (voir generateOrderShippingSlip, appelée depuis checkout côté client).
function ShippingSlipTriggerButton({ disabled, open, onOpen }: { disabled: boolean; open: boolean; onOpen: () => void }) {
  if (open) return null;
  return (
    <button
      onClick={onOpen}
      disabled={disabled}
      className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-[11px] font-semibold text-foreground hover:bg-muted disabled:opacity-50"
      title={disabled ? "Uniquement pour les livraisons individuelles" : undefined}
    >
      Bordereau
    </button>
  );
}

function ShippingSlipPanelContent({ orderId, onClose }: { orderId: string; onClose: () => void }) {
  const [slip, setSlip] = useState<OrderShippingSlipRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const load = async () => {
    setLoading(true);
    const result = await getOrderShippingSlip({ data: { orderId } });
    if (result.ok) setSlip(result.slip);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const download = async () => {
    setDownloading(true);
    const result = await getShippingSlipDownloadUrl({ data: { orderId } });
    setDownloading(false);
    if (!result.ok || !result.url) {
      toast.error("Téléchargement impossible");
      return;
    }
    window.open(result.url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="rounded-lg border border-border bg-muted/20 p-3 text-xs">
      {loading && <p className="text-muted-foreground">Chargement…</p>}
      {!loading && (
        <>
          {slip ? (
            <div className="flex items-center justify-between rounded-md border border-border bg-background px-3 py-2">
              <span>
                Bordereau <span className="font-mono font-semibold">{slip.slip_number}</span> — généré le{" "}
                {new Date(slip.created_at).toLocaleDateString("fr-FR")}
              </span>
              <button
                onClick={download}
                disabled={downloading || !slip.pdf_path}
                className="rounded-md bg-primary px-3 py-1.5 text-[11px] font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {downloading ? "…" : "Télécharger"}
              </button>
            </div>
          ) : (
            <p className="text-muted-foreground">Aucun bordereau généré pour cette commande.</p>
          )}
          <button onClick={onClose} className="mt-2 text-[11px] text-muted-foreground hover:underline">
            Fermer
          </button>
        </>
      )}
    </div>
  );
}

// Paramètres globaux de livraison groupée : date limite et frais fixes de livraison
// individuelle appliqués aux commandes passées après cette date.
function ShippingSettingsPanel() {
  const [deadline, setDeadline] = useState("");
  const [fee, setFee] = useState("0");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const settings = await getShippingSettings();
    setDeadline(settings.group_order_deadline ? settings.group_order_deadline.slice(0, 16) : "");
    setFee(String(settings.individual_shipping_fee));
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async () => {
    setSaving(true);
    const result = await saveShippingSettings({
      data: {
        groupOrderDeadline: deadline ? new Date(deadline).toISOString() : null,
        individualShippingFee: Number(fee) || 0,
      },
    });
    setSaving(false);
    if (!result.ok) {
      toast.error(`Enregistrement échoué : ${result.error}`);
      return;
    }
    toast.success("Paramètres de livraison mis à jour");
  };

  return (
    <div className="mb-4 rounded-2xl border border-border bg-card p-4">
      <h3 className="text-sm font-semibold text-foreground">Livraison groupée / individuelle</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        Après la date limite, la livraison à l'établissement n'est plus proposée : les commandes basculent
        automatiquement en livraison individuelle à domicile, avec frais de port et bordereau générés à la commande.
      </p>
      {loading ? (
        <p className="mt-3 text-xs text-muted-foreground">Chargement…</p>
      ) : (
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <label className="text-xs">
            <span className="mb-1 block font-medium text-muted-foreground">Date limite commande groupée</span>
            <input
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="h-9 rounded-md border border-border bg-background px-2 text-xs"
            />
          </label>
          <label className="text-xs">
            <span className="mb-1 block font-medium text-muted-foreground">Frais livraison individuelle (€)</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={fee}
              onChange={(e) => setFee(e.target.value)}
              className="h-9 w-28 rounded-md border border-border bg-background px-2 text-xs"
            />
          </label>
          <button
            onClick={submit}
            disabled={saving}
            className="h-9 rounded-md bg-primary px-4 text-[11px] font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? "…" : "Enregistrer"}
          </button>
        </div>
      )}
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
  ) => Promise<boolean>;
}) {
  const [drafts, setDrafts] = useState<Record<string, { tracking_number: string; tracking_carrier: string }>>({});
  const [refundOpenOrderId, setRefundOpenOrderId] = useState<string | null>(null);
  const [billingOpenOrderId, setBillingOpenOrderId] = useState<string | null>(null);
  const [slipOpenOrderId, setSlipOpenOrderId] = useState<string | null>(null);

  const draftFor = (o: OrderRow) =>
    drafts[o.id] ?? {
      tracking_number: o.tracking_number ?? "",
      tracking_carrier: o.tracking_carrier ?? "",
    };

  const setDraft = (id: string, patch: Partial<{ tracking_number: string; tracking_carrier: string }>) =>
    setDrafts((prev) => ({ ...prev, [id]: { ...draftFor(orders.find((o) => o.id === id)!), ...patch } }));

  return (
    <div className="mt-4">
      <ShippingSettingsPanel />
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Commande</th>
              <th className="px-4 py-3">Famille</th>
              <th className="px-4 py-3">Mode</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3">Transporteur</th>
              <th className="px-4 py-3">N° de suivi</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-muted-foreground">
                  Chargement…
                </td>
              </tr>
            )}
            {!loading && orders.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-muted-foreground">
                  Aucune commande.
                </td>
              </tr>
            )}
            {orders.map((o) => {
              const d = draftFor(o);
              const refundOpen = refundOpenOrderId === o.id;
              const billingOpen = billingOpenOrderId === o.id;
              const slipOpen = slipOpenOrderId === o.id;
              return (
                <Fragment key={o.id}>
                  <tr className="hover:bg-muted/30">
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
                      <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5">
                        Retrait
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5">
                        <Truck className="h-3 w-3" /> Domicile
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {o.delivery_type === "individual" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100">
                        Individuelle
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5">
                        Groupée
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
                        <option key={s} value={s}>
                          {s}
                        </option>
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
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          const blocking = ["Expédiée", "Livrée", "Annulée", "Remboursée"].includes(o.status);
                          const confirmMsg = blocking
                            ? `Cette commande est déjà "${o.status}". Confirmer l'annulation quand même ?`
                            : `Annuler la commande ${o.order_number} ?`;
                          if (!window.confirm(confirmMsg)) return;
                          const reason = window.prompt("Motif de l'annulation (optionnel)") ?? undefined;
                          onUpdate(o.id, { status: "Annulée" }, false).then((success) => {
                            if (!success) return;
                            sendOrderCancellation({ data: { orderId: o.id, reason } }).catch(() => {});
                          });
                        }}
                        className="inline-flex items-center gap-1 rounded-md border border-destructive/40 px-3 py-1.5 text-[11px] font-semibold text-destructive hover:bg-destructive/10"
                      >
                        Annuler
                      </button>
                      <RefundTriggerButton
                        disabled={!o.payplug_payment_id}
                        open={refundOpen}
                        onOpen={() => setRefundOpenOrderId(o.id)}
                      />
                      <BillingTriggerButton
                        disabled={o.status !== "Livrée"}
                        open={billingOpen}
                        onOpen={() => setBillingOpenOrderId(o.id)}
                      />
                      <ShippingSlipTriggerButton
                        disabled={o.delivery_type !== "individual"}
                        open={slipOpen}
                        onOpen={() => setSlipOpenOrderId(o.id)}
                      />
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
                    </div>
                  </td>
                  </tr>
                  {refundOpen && (
                    <tr>
                      <td colSpan={8} className="bg-muted/10 px-4 py-3">
                        <RefundPanelContent orderId={o.id} onClose={() => setRefundOpenOrderId(null)} />
                      </td>
                    </tr>
                  )}
                  {billingOpen && (
                    <tr>
                      <td colSpan={8} className="bg-muted/10 px-4 py-3">
                        <BillingPanelContent
                          orderId={o.id}
                          defaultName={`${o.family_prenom} ${o.family_nom}`.trim()}
                          onClose={() => setBillingOpenOrderId(null)}
                        />
                      </td>
                    </tr>
                  )}
                  {slipOpen && (
                    <tr>
                      <td colSpan={8} className="bg-muted/10 px-4 py-3">
                        <ShippingSlipPanelContent orderId={o.id} onClose={() => setSlipOpenOrderId(null)} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      </div>
    </div>
  );
}

type CustomTemplate = {
  id: string;
  name: string;
  header_title: string;
  body: string;
  button_label: string | null;
  button_url: string | null;
  signature_role: string;
  updated_at: string;
};

type FamilyRow = {
  user_id: string;
  family_prenom: string;
  family_nom: string;
  family_email: string;
};

function EmailsPanel() {
  const [templates, setTemplates] = useState<CustomTemplate[]>([]);
  const [templateId, setTemplateId] = useState<string | undefined>(undefined);
  const [name, setName] = useState("");
  const [headerTitle, setHeaderTitle] = useState("");
  const [body, setBody] = useState("");
  const [buttonLabel, setButtonLabel] = useState("");
  const [buttonUrl, setButtonUrl] = useState("");
  const [signatureRole, setSignatureRole] = useState("technique");
  const [saving, setSaving] = useState(false);

  const [recipientTab, setRecipientTab] = useState<"families" | "raw">("families");
  const [families, setFamilies] = useState<FamilyRow[]>([]);
  const [familiesLoading, setFamiliesLoading] = useState(true);
  const [familySearch, setFamilySearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [rawEmailsText, setRawEmailsText] = useState("");
  const [sending, setSending] = useState(false);
  const [lastResult, setLastResult] = useState<{ sent: number; total: number; errors: Array<{ email: string; reason: string }> } | null>(null);

  const refreshTemplates = async () => {
    const r = await listCustomTemplates({ data: {} });
    if (r.ok) setTemplates(r.templates as CustomTemplate[]);
    else toast.error(r.error || "Erreur de chargement des templates");
  };

  useEffect(() => {
    refreshTemplates();
    (async () => {
      setFamiliesLoading(true);
      const r = await apelListFamilies({ data: {} });
      if (r.ok) setFamilies(r.families as FamilyRow[]);
      setFamiliesLoading(false);
    })();
  }, []);

  const loadTemplate = (id: string) => {
    const t = templates.find((tpl) => tpl.id === id);
    if (!t) return;
    setTemplateId(t.id);
    setName(t.name);
    setHeaderTitle(t.header_title);
    setBody(t.body);
    setButtonLabel(t.button_label ?? "");
    setButtonUrl(t.button_url ?? "");
    setSignatureRole(t.signature_role);
  };

  const handleSave = async () => {
    if (!name.trim() || !headerTitle.trim() || !body.trim()) {
      toast.error("Nom, titre et corps du message sont requis");
      return;
    }
    setSaving(true);
    const r = await saveCustomTemplate({
      data: {
        id: templateId,
        name: name.trim(),
        headerTitle: headerTitle.trim(),
        body,
        buttonLabel: buttonLabel.trim() || undefined,
        buttonUrl: buttonUrl.trim() || undefined,
        signatureRole: signatureRole.trim() || "technique",
      },
    });
    setSaving(false);
    if (!r.ok) {
      toast.error(r.error || "Échec de la sauvegarde");
      return;
    }
    toast.success("Template enregistré");
    setTemplateId(r.id);
    refreshTemplates();
  };

  const filteredFamilies = useMemo(() => {
    const q = familySearch.trim().toLowerCase();
    if (!q) return families;
    return families.filter(
      (f) =>
        f.family_nom?.toLowerCase().includes(q) ||
        f.family_prenom?.toLowerCase().includes(q) ||
        f.family_email?.toLowerCase().includes(q),
    );
  }, [families, familySearch]);

  const toggleAll = () => {
    if (selected.size === filteredFamilies.length) setSelected(new Set());
    else setSelected(new Set(filteredFamilies.map((f) => f.user_id)));
  };
  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  const parsedRawEmails = useMemo(
    () =>
      Array.from(
        new Set(
          rawEmailsText
            .split(/[\n,]+/)
            .map((e) => e.trim())
            .filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)),
        ),
      ),
    [rawEmailsText],
  );

  const recipientCount = selected.size + parsedRawEmails.length;

  const handleSend = async () => {
    if (!headerTitle.trim() || !body.trim()) {
      toast.error("Titre et corps du message sont requis");
      return;
    }
    if (recipientCount === 0) {
      toast.error("Sélectionnez au moins un destinataire");
      return;
    }
    if (!confirm(`Envoyer cet email à ${recipientCount} destinataire(s) ?`)) return;
    setSending(true);
    setLastResult(null);
    try {
      const r = await sendCustomBulkEmail({
        data: {
          profileIds: Array.from(selected),
          rawEmails: parsedRawEmails,
          headerTitle: headerTitle.trim(),
          body,
          buttonLabel: buttonLabel.trim() || undefined,
          buttonUrl: buttonUrl.trim() || undefined,
          signatureRole: signatureRole.trim() || "technique",
        },
      });
      if (!r.ok) {
        toast.error(r.error || "Échec de l'envoi");
      } else {
        toast.success(`${r.sent} email(s) envoyé(s) sur ${r.total}`);
        setLastResult({ sent: r.sent, total: r.total, errors: r.errors });
        setSelected(new Set());
        setRawEmailsText("");
      }
    } catch (e: any) {
      toast.error(e?.message ?? "Erreur");
    } finally {
      setSending(false);
    }
  };

  const previewParagraphs = body.split(/\n\s*\n/).filter((p) => p.trim().length > 0);

  return (
    <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="text-base font-semibold text-foreground">Composer un email</h2>

        <label className="mt-4 block text-xs font-medium text-muted-foreground">Charger un template existant</label>
        <select
          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          value={templateId ?? ""}
          onChange={(e) => (e.target.value ? loadTemplate(e.target.value) : setTemplateId(undefined))}
        >
          <option value="">— Nouveau template —</option>
          {templates.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>

        <label className="mt-4 block text-xs font-medium text-muted-foreground">Nom du template</label>
        <input
          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Relance inscription résolue"
        />

        <label className="mt-4 block text-xs font-medium text-muted-foreground">Titre du header</label>
        <input
          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          value={headerTitle}
          onChange={(e) => setHeaderTitle(e.target.value)}
        />

        <label className="mt-4 block text-xs font-medium text-muted-foreground">Corps du message</label>
        <textarea
          className="mt-1 h-32 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Séparez les paragraphes par une ligne vide"
        />

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-muted-foreground">Texte du bouton</label>
            <input
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              value={buttonLabel}
              onChange={(e) => setButtonLabel(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground">Lien du bouton</label>
            <input
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              value={buttonUrl}
              onChange={(e) => setButtonUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>
        </div>

        <label className="mt-4 block text-xs font-medium text-muted-foreground">Signature</label>
        <input
          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          value={signatureRole}
          onChange={(e) => setSignatureRole(e.target.value)}
        />

        <button
          onClick={handleSave}
          disabled={saving}
          className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {saving ? "Enregistrement…" : "Enregistrer le template"}
        </button>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="text-base font-semibold text-foreground">Aperçu</h2>
        <div className="mt-3 overflow-hidden rounded-xl border border-border">
          <div style={{ backgroundColor: "#0a2540", padding: "26px 32px" }}>
            <p style={{ fontSize: "22px", fontWeight: 600, color: "#ffffff", margin: 0 }}>{headerTitle || "Titre du header"}</p>
          </div>
          <div style={{ height: "3px", backgroundColor: "#c8102e" }} />
          <div style={{ padding: "24px", backgroundColor: "#ffffff" }}>
            <p style={{ fontSize: "15px", color: "#1a1a1a", margin: "0 0 14px" }}>Bonjour,</p>
            {previewParagraphs.length === 0 ? (
              <p style={{ fontSize: "15px", color: "#999999", margin: "0 0 14px" }}>Corps du message…</p>
            ) : (
              previewParagraphs.map((p, i) => (
                <p key={i} style={{ fontSize: "15px", color: "#1a1a1a", margin: "0 0 14px" }}>
                  {p}
                </p>
              ))
            )}
            {buttonLabel && buttonUrl ? (
              <span
                style={{
                  display: "inline-block",
                  background: "#0a2540",
                  color: "#ffffff",
                  padding: "12px 24px",
                  borderRadius: "8px",
                  fontWeight: 600,
                  fontSize: "14px",
                }}
              >
                {buttonLabel}
              </span>
            ) : null}
          </div>
          <div style={{ backgroundColor: "#f5f5f5", padding: "16px 24px", textAlign: "center" }}>
            <p style={{ fontSize: "12px", color: "#666666", margin: 0, fontWeight: 600 }}>France Uniformes — Uniformes scolaires sur mesure</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 lg:col-span-2">
        <h2 className="text-base font-semibold text-foreground">Destinataires</h2>
        <div className="mt-3 inline-flex rounded-xl border border-border bg-muted p-1">
          <button
            onClick={() => setRecipientTab("families")}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${recipientTab === "families" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
          >
            Familles
          </button>
          <button
            onClick={() => setRecipientTab("raw")}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${recipientTab === "raw" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
          >
            Emails collés
          </button>
        </div>

        {recipientTab === "families" && (
          <div className="mt-4">
            <input
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              placeholder="Rechercher une famille…"
              value={familySearch}
              onChange={(e) => setFamilySearch(e.target.value)}
            />
            {familiesLoading ? (
              <p className="mt-3 text-sm text-muted-foreground">Chargement…</p>
            ) : (
              <div className="mt-3 max-h-64 overflow-y-auto rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="w-8 p-2">
                        <input
                          type="checkbox"
                          checked={filteredFamilies.length > 0 && selected.size === filteredFamilies.length}
                          onChange={toggleAll}
                        />
                      </th>
                      <th className="p-2 text-left">Nom</th>
                      <th className="p-2 text-left">Email</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFamilies.map((f) => (
                      <tr key={f.user_id} className="border-b border-border last:border-0">
                        <td className="p-2">
                          <input type="checkbox" checked={selected.has(f.user_id)} onChange={() => toggleOne(f.user_id)} />
                        </td>
                        <td className="p-2">
                          {f.family_prenom} {f.family_nom}
                        </td>
                        <td className="p-2 text-muted-foreground">{f.family_email}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {recipientTab === "raw" && (
          <div className="mt-4">
            <textarea
              className="h-32 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              placeholder={"une adresse par ligne, ou séparées par des virgules"}
              value={rawEmailsText}
              onChange={(e) => setRawEmailsText(e.target.value)}
            />
            <p className="mt-1 text-xs text-muted-foreground">{parsedRawEmails.length} adresse(s) valide(s) détectée(s)</p>
          </div>
        )}

        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{recipientCount} destinataire(s) sélectionné(s)</span>
          <button
            onClick={handleSend}
            disabled={sending || recipientCount === 0}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {sending ? "Envoi…" : `Envoyer à ${recipientCount} destinataire(s)`}
          </button>
        </div>

        {lastResult && (
          <div className="mt-4 rounded-lg border border-border bg-muted/30 p-3 text-sm">
            <p>
              {lastResult.sent} envoyé(s) sur {lastResult.total}.
            </p>
            {lastResult.errors.length > 0 && (
              <ul className="mt-2 list-disc pl-5 text-xs text-destructive">
                {lastResult.errors.map((e, i) => (
                  <li key={i}>
                    {e.email} — {e.reason}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function CorrectionCreateModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (correction: {
    id: string;
    order_id: string;
    order_item_id: string;
    field: string;
    old_value: string;
    new_value: string;
    status: string;
    note: string | null;
    requester_email: string;
    created_at: string;
    resolved_at: string | null;
    order_number: string;
    order_status: string;
    family_prenom: string;
    family_nom: string;
    product_name: string;
    child_prenom: string;
    child_nom: string;
  }) => void;
}) {
  const [orderNumber, setOrderNumber] = useState("");
  const [searching, setSearching] = useState(false);
  const [foundOrder, setFoundOrder] = useState<
    { id: string; order_number: string; status: string; family_email: string; family_prenom: string; family_nom: string } | null
  >(null);
  const [orderItems, setOrderItems] = useState<
    { id: string; product_name: string; product_id: string; size: string; child_prenom: string; child_nom: string }[]
  >([]);
  const [selectedItemId, setSelectedItemId] = useState("");
  const [newSize, setNewSize] = useState("");
  const [requesterEmail, setRequesterEmail] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [blouseStock, setBlouseStock] = useState<Record<string, number>>({});

  useEffect(() => {
    supabase
      .from("blouse_stock")
      .select("size, remaining")
      .then(({ data }) => {
        const map: Record<string, number> = {};
        for (const r of (data ?? []) as Array<{ size: string; remaining: number }>) map[r.size] = r.remaining;
        setBlouseStock(map);
      });
  }, []);

  const searchOrder = async () => {
    setSearching(true);
    setFoundOrder(null);
    setOrderItems([]);
    setSelectedItemId("");
    setRequesterEmail("");
    const { data: order, error } = await supabase
      .from("orders")
      .select("id, order_number, status, family_email, family_prenom, family_nom")
      .eq("order_number", orderNumber.trim())
      .maybeSingle();
    setSearching(false);
    if (error || !order) {
      toast.error("Commande introuvable");
      return;
    }
    setFoundOrder(order);
    setRequesterEmail(order.family_email ?? "");
    const { data: itemsData } = await supabase
      .from("order_items")
      .select("id, product_name, product_id, size, child_prenom, child_nom")
      .eq("order_id", order.id);
    setOrderItems(
      (itemsData ?? []) as {
        id: string;
        product_name: string;
        product_id: string;
        size: string;
        child_prenom: string;
        child_nom: string;
      }[],
    );
  };

  const selectedItem = orderItems.find((i) => i.id === selectedItemId);
  const isBlouse = selectedItem?.product_id === "blouse-officielle";

  const submit = async () => {
    if (!foundOrder || !selectedItem || !newSize.trim() || !requesterEmail.trim()) {
      toast.error("Merci de remplir tous les champs requis.");
      return;
    }
    setSaving(true);
    const { data, error } = await supabase
      .from("order_corrections")
      .insert({
        order_id: foundOrder.id,
        order_item_id: selectedItem.id,
        old_value: selectedItem.size,
        new_value: newSize.trim(),
        requester_email: requesterEmail.trim(),
        note: note.trim() || null,
      })
      .select()
      .single();
    setSaving(false);
    if (error || !data) {
      toast.error(error?.message ?? "Erreur lors de la création");
      return;
    }
    toast.success("Demande créée");
    onCreated({
      ...(data as any),
      order_number: foundOrder.order_number,
      order_status: foundOrder.status,
      family_prenom: foundOrder.family_prenom,
      family_nom: foundOrder.family_nom,
      product_name: selectedItem.product_name,
      child_prenom: selectedItem.child_prenom,
      child_nom: selectedItem.child_nom,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-card p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-foreground">Nouvelle demande de correction</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <div>
            <label className="text-xs font-medium text-foreground">N° de commande</label>
            <div className="mt-1 flex gap-2">
              <input
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                className="h-10 flex-1 rounded-lg border border-border bg-background px-3 text-sm"
                placeholder="CMD-20260504-C001-001"
              />
              <button
                onClick={searchOrder}
                disabled={searching || !orderNumber.trim()}
                className="h-10 rounded-lg bg-secondary px-3 text-sm font-medium disabled:opacity-50"
              >
                Rechercher
              </button>
            </div>
            {foundOrder && (foundOrder.status === "Expédiée" || foundOrder.status === "Livrée") && (
              <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-amber-700">
                <AlertTriangle className="h-3.5 w-3.5" /> Cette commande est déjà {foundOrder.status.toLowerCase()} —
                une correction directe n'est pas appropriée, orientez la famille vers un retour/échange.
              </p>
            )}
          </div>

          {foundOrder && orderItems.length > 0 && (
            <div>
              <label className="text-xs font-medium text-foreground">Article concerné</label>
              <select
                value={selectedItemId}
                onChange={(e) => {
                  setSelectedItemId(e.target.value);
                  setNewSize("");
                }}
                className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
              >
                <option value="">— Choisir —</option>
                {orderItems.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.child_prenom} {i.child_nom} — {i.product_name} (taille actuelle : {i.size})
                  </option>
                ))}
              </select>
            </div>
          )}

          {selectedItem && (
            <div>
              <label className="text-xs font-medium text-foreground">Nouvelle taille</label>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {STANDARD_SIZES.map((s) => {
                  const rem = isBlouse ? (blouseStock[s] ?? null) : null;
                  const isOut = rem !== null && rem <= 0;
                  const isCurrent = s === selectedItem.size;
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => !isOut && setNewSize(s)}
                      disabled={isOut}
                      title={
                        isCurrent
                          ? "Taille actuelle"
                          : rem === null
                            ? undefined
                            : isOut
                              ? `Taille ${s} en rupture de stock`
                              : `${rem} restante(s)`
                      }
                      className={`relative h-12 min-w-[3.5rem] rounded-md border px-2 text-xs font-medium transition-all ${
                        isOut
                          ? "cursor-not-allowed border-border bg-muted text-muted-foreground line-through opacity-60"
                          : newSize === s
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-card text-foreground hover:border-primary/40"
                      }`}
                    >
                      <span className="block">
                        {s}
                        {isCurrent && <span className="ml-1 text-[9px]">(actuelle)</span>}
                      </span>
                      {rem !== null && (
                        <span
                          className={`mt-0.5 block text-[9px] font-normal leading-none ${
                            isOut ? "text-red-600" : newSize === s ? "text-primary-foreground/80" : "text-muted-foreground"
                          }`}
                        >
                          {isOut ? "Rupture" : `${rem} dispo.`}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-foreground">Email de la famille</label>
            <input
              value={requesterEmail}
              onChange={(e) => setRequesterEmail(e.target.value)}
              className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
              placeholder="manon.bauzet@gmail.com"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-foreground">Note (optionnel)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              rows={2}
              placeholder="Contexte du mail reçu"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="h-10 rounded-lg px-4 text-sm font-medium text-muted-foreground">
            Annuler
          </button>
          <button
            onClick={submit}
            disabled={saving}
            className="h-10 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            Créer la demande
          </button>
        </div>
      </div>
    </div>
  );
}
