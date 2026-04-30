import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Download, Package, ShieldAlert } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { useStore } from "@/lib/store";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — Commandes" }] }),
  component: AdminPage,
});

type Order = {
  id: string;
  order_number: string;
  status: string;
  total_amount: number;
  family_civilite: string | null;
  family_prenom: string;
  family_nom: string;
  family_email: string;
  family_telephone: string | null;
  created_at: string;
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

function AdminPage() {
  const { user, isAdmin, authLoading } = useStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin) return;
    (async () => {
      const [{ data: o }, { data: it }] = await Promise.all([
        supabase.from("orders").select("*").order("created_at", { ascending: false }),
        supabase.from("order_items").select("*"),
      ]);
      setOrders((o ?? []) as Order[]);
      setItems((it ?? []) as OrderItem[]);
      setLoading(false);
    })();
  }, [isAdmin]);

  if (authLoading) return null;

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader schoolName="Saint-Jacques de Compostelle — Dax" />
        <section className="mx-auto max-w-xl px-4 py-20 text-center">
          <ShieldAlert className="mx-auto h-10 w-10 text-muted-foreground" />
          <h1 className="mt-4 text-2xl font-semibold">Accès refusé</h1>
          <p className="mt-3 text-sm text-muted-foreground">Cet espace est réservé aux administrateurs.</p>
          <Link to="/" className="mt-6 inline-flex h-11 items-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground">Retour à l'accueil</Link>
        </section>
      </div>
    );
  }

  const exportCsv = () => {
    const headers = ["Commande", "Date", "Statut", "Total", "Famille", "Email", "Téléphone", "Enfant", "Classe", "Section", "Produit", "Référence", "Taille", "Quantité", "PU", "Total ligne"];
    const rows: string[][] = [];
    for (const o of orders) {
      const oItems = items.filter((i) => i.order_id === o.id);
      const family = `${o.family_civilite ?? ""} ${o.family_prenom} ${o.family_nom}`.trim();
      const date = new Date(o.created_at).toLocaleDateString("fr-FR");
      if (oItems.length === 0) {
        rows.push([o.order_number, date, o.status, String(o.total_amount), family, o.family_email, o.family_telephone ?? "", "", "", "", "", "", "", "", "", ""]);
      } else {
        for (const i of oItems) {
          rows.push([
            o.order_number, date, o.status, String(o.total_amount), family, o.family_email, o.family_telephone ?? "",
            `${i.child_prenom} ${i.child_nom}`, i.child_classe ?? "", i.child_section ?? "",
            i.product_name, i.product_ref, i.size, String(i.quantity), String(i.unit_price), String(i.line_total),
          ]);
        }
      }
    }
    const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const csv = [headers, ...rows].map((r) => r.map(escape).join(";")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `commandes-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader schoolName="Saint-Jacques de Compostelle — Dax" />
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
              <span className="h-px w-6 bg-gold" /> Espace administrateur
            </span>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Commandes</h1>
            <p className="mt-2 text-sm text-muted-foreground">{orders.length} commande{orders.length > 1 ? "s" : ""}</p>
          </div>
          <button
            onClick={exportCsv}
            disabled={orders.length === 0}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-card)] hover:bg-primary/90 disabled:opacity-50"
          >
            <Download className="h-4 w-4" /> Exporter pour le fournisseur (CSV)
          </button>
        </div>

        {loading ? (
          <p className="mt-10 text-sm text-muted-foreground">Chargement…</p>
        ) : orders.length === 0 ? (
          <div className="mt-12 rounded-3xl border border-dashed border-border bg-card p-16 text-center">
            <Package className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-4 text-sm text-muted-foreground">Aucune commande pour le moment.</p>
          </div>
        ) : (
          <div className="mt-8 space-y-3">
            {orders.map((o) => {
              const oItems = items.filter((i) => i.order_id === o.id);
              const isOpen = openId === o.id;
              return (
                <article key={o.id} className="overflow-hidden rounded-2xl border border-border bg-card">
                  <button onClick={() => setOpenId(isOpen ? null : o.id)} className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left hover:bg-muted/30">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Package className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-foreground">{o.order_number}</div>
                        <div className="text-xs text-muted-foreground">{o.family_civilite} {o.family_prenom} {o.family_nom} · {o.family_email}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="rounded-full bg-secondary px-3 py-1 text-[11px] font-medium text-foreground/80">{o.status}</span>
                      <span className="text-base font-semibold">{Number(o.total_amount).toFixed(2)} €</span>
                      <span className="hidden text-xs text-muted-foreground sm:inline">{new Date(o.created_at).toLocaleDateString("fr-FR")}</span>
                    </div>
                  </button>
                  {isOpen && (
                    <div className="border-t border-border bg-secondary/40 px-6 py-5">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                            <th className="pb-2">Enfant</th>
                            <th className="pb-2">Produit</th>
                            <th className="pb-2">Taille</th>
                            <th className="pb-2 text-right">Qté</th>
                            <th className="pb-2 text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {oItems.map((i) => (
                            <tr key={i.id}>
                              <td className="py-2.5 text-foreground">{i.child_prenom} {i.child_nom}<div className="text-[11px] text-muted-foreground">{[i.child_section, i.child_classe].filter(Boolean).join(" · ")}</div></td>
                              <td className="py-2.5">{i.product_name}<div className="text-[11px] text-muted-foreground">Réf. {i.product_ref}</div></td>
                              <td className="py-2.5">{i.size}</td>
                              <td className="py-2.5 text-right">{i.quantity}</td>
                              <td className="py-2.5 text-right font-semibold">{Number(i.line_total).toFixed(2)} €</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
      <SiteFooter />
    </div>
  );
}