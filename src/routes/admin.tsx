import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { Download, ShieldCheck } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { RequireAuth } from "@/components/RequireAuth";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/lib/store";
import { toast } from "sonner";

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

function AdminPage() {
  const { isAdmin, authLoading } = useStore();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) { setLoading(false); return; }
    (async () => {
      const { data, error } = await supabase
        .from("order_items")
        .select(`
          child_prenom, child_nom, child_classe, child_section,
          product_name, product_ref, size, quantity, unit_price, line_total,
          orders!inner ( order_number, created_at, status, family_civilite, family_nom, family_prenom, family_email, family_telephone )
        `)
        .order("created_at", { foreignTable: "orders", ascending: false });
      if (error) { toast.error(error.message); setLoading(false); return; }
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
  }, [isAdmin]);

  const exportExcel = () => {
    const data = rows.map((r) => ({
      "N° Commande": r.order_number,
      "Date": new Date(r.created_at).toLocaleDateString("fr-FR"),
      "Statut": r.status,
      "Famille": `${r.family_civilite ?? ""} ${r.family_prenom} ${r.family_nom}`.trim(),
      "Email": r.family_email,
      "Téléphone": r.family_telephone ?? "",
      "Enfant": `${r.child_prenom} ${r.child_nom}`,
      "Classe": r.child_classe ?? "",
      "Section": r.child_section ?? "",
      "Produit": r.product_name,
      "Référence": r.product_ref,
      "Taille": r.size,
      "Quantité": r.quantity,
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
    return <div className="min-h-screen bg-background"><SiteHeader schoolName={SCHOOL_LABEL} /></div>;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader schoolName={SCHOOL_LABEL} />
        <section className="mx-auto max-w-3xl px-4 py-20 text-center">
          <ShieldCheck className="mx-auto h-10 w-10 text-muted-foreground" />
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground">Accès réservé</h1>
          <p className="mt-2 text-sm text-muted-foreground">Cette page est réservée aux administrateurs de l'établissement.</p>
        </section>
        <SiteFooter />
      </div>
    );
  }

  const totalCommandes = new Set(rows.map((r) => r.order_number)).size;
  const totalArticles = rows.reduce((s, r) => s + r.quantity, 0);
  const totalCA = rows.reduce((s, r) => s + r.line_total, 0);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader schoolName={SCHOOL_LABEL} />
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
              <span className="h-px w-6 bg-gold" /> Espace administrateur
            </span>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Commandes fournisseur</h1>
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

        <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-card">
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
                  <tr><td colSpan={9} className="px-4 py-6 text-center text-muted-foreground">Chargement…</td></tr>
                )}
                {!loading && rows.length === 0 && (
                  <tr><td colSpan={9} className="px-4 py-6 text-center text-muted-foreground">Aucune commande pour le moment.</td></tr>
                )}
                {rows.map((r, i) => (
                  <tr key={i} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium text-foreground">{r.order_number}</td>
                    <td className="px-4 py-3 text-muted-foreground">{new Date(r.created_at).toLocaleDateString("fr-FR")}</td>
                    <td className="px-4 py-3">{r.family_prenom} {r.family_nom}</td>
                    <td className="px-4 py-3">{r.child_prenom} {r.child_nom}</td>
                    <td className="px-4 py-3 text-muted-foreground">{r.child_classe ?? "—"}</td>
                    <td className="px-4 py-3">{r.product_name} <span className="text-xs text-muted-foreground">({r.product_ref})</span></td>
                    <td className="px-4 py-3">{r.size}</td>
                    <td className="px-4 py-3 text-right">{r.quantity}</td>
                    <td className="px-4 py-3 text-right font-semibold">{r.line_total.toFixed(2)} €</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
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
