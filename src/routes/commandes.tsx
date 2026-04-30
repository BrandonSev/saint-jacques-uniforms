import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Package, ChevronDown, ChevronUp } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { ShellMotif } from "@/components/SchoolMotif";
import { useStore } from "@/lib/store";
import { supabase } from "@/integrations/supabase/client";

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

function CommandesPage() {
  const { user, profile, authLoading, isAdmin } = useStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: o } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
      const ids = (o ?? []).map((x: any) => x.id);
      const { data: it } = ids.length
        ? await supabase.from("order_items").select("*").in("order_id", ids)
        : { data: [] as OrderItem[] };
      setOrders((o ?? []) as Order[]);
      setItems((it ?? []) as OrderItem[]);
      setLoading(false);
    })();
  }, [user]);

  if (authLoading) return null;

  if (isAdmin) return <Navigate to="/admin" />;

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader schoolName="Saint-Jacques de Compostelle — Dax" />
        <section className="mx-auto max-w-xl px-4 py-20 text-center">
          <h1 className="text-2xl font-semibold">Espace réservé aux familles</h1>
          <p className="mt-3 text-sm text-muted-foreground">Connectez-vous pour consulter vos commandes.</p>
          <Link to="/login" className="mt-6 inline-flex h-11 items-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground">Se connecter</Link>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader schoolName="Saint-Jacques de Compostelle — Dax" />
      <section className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute -top-10 right-0 -z-0 h-72 w-72 text-primary">
          <ShellMotif className="h-full w-full" opacity={0.045} />
        </div>
        <div className="relative">
          <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
            <span className="h-px w-6 bg-gold" /> Famille {profile?.family_name || profile?.nom || ""}
          </span>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Mes commandes</h1>
          <p className="mt-2 text-sm text-muted-foreground">{orders.length} commande{orders.length > 1 ? "s" : ""}</p>
        </div>

        {loading ? (
          <p className="mt-10 text-sm text-muted-foreground">Chargement…</p>
        ) : orders.length === 0 ? (
          <div className="mt-12 rounded-3xl border border-dashed border-border bg-card p-16 text-center">
            <Package className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-4 text-sm text-muted-foreground">Aucune commande pour le moment.</p>
            <Link to="/boutique" className="mt-6 inline-flex h-11 items-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground">Découvrir la boutique</Link>
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
                        <div className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="rounded-full bg-secondary px-3 py-1 text-[11px] font-medium text-foreground/80">{o.status}</span>
                      <span className="text-base font-semibold">{Number(o.total_amount).toFixed(2)} €</span>
                      {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
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