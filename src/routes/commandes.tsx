import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Package, ChevronDown, ChevronUp, AlertTriangle, X } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { ShellMotif } from "@/components/SchoolMotif";
import { useStore } from "@/lib/store";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PageWatermark } from "@/components/PageWatermark";

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

const INCIDENT_TYPES: { value: string; label: string; eligible: boolean }[] = [
  { value: "malfacon", label: "Malfaçon / défaut de fabrication", eligible: true },
  { value: "erreur_envoi", label: "Erreur d'envoi (mauvais produit ou taille)", eligible: true },
  { value: "article_manquant", label: "Article manquant", eligible: true },
  { value: "taille_inadaptee", label: "Taille inadaptée (non porté)", eligible: false },
  { value: "usure_normale", label: "Usure normale", eligible: false },
  { value: "autre", label: "Autre", eligible: false },
];

function CommandesPage() {
  const { user, profile, authLoading, isAdmin } = useStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);
  const [incidentItem, setIncidentItem] = useState<OrderItem | null>(null);

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
      <div className="relative flex min-h-screen flex-col bg-background/80">
      <PageWatermark />
        <SiteHeader schoolName="Saint-Jacques-de-Compostelle — Dax" />
        <section className="mx-auto max-w-xl px-4 py-20 text-center">
          <h1 className="text-2xl font-semibold">Espace réservé aux familles</h1>
          <p className="mt-3 text-sm text-muted-foreground">Connectez-vous pour consulter vos commandes.</p>
          <Link to="/login" className="mt-6 inline-flex h-11 items-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground">Se connecter</Link>
        </section>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader schoolName="Saint-Jacques-de-Compostelle — Dax" />
      <section className="relative w-full px-4 py-12 sm:px-6 lg:px-8">
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
                            <th className="pb-2 text-right">Action</th>
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
                              <td className="py-2.5 text-right">
                                <button
                                  onClick={() => setIncidentItem(i)}
                                  className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1 text-[11px] font-medium text-muted-foreground hover:border-destructive/40 hover:text-destructive"
                                >
                                  <AlertTriangle className="h-3 w-3" /> Déclarer un incident
                                </button>
                              </td>
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
      {incidentItem && (
        <IncidentModal
          item={incidentItem}
          userId={user!.id}
          onClose={() => setIncidentItem(null)}
        />
      )}
      <SiteFooter />
    </div>
  );
}

function IncidentModal({ item, userId, onClose }: { item: OrderItem; userId: string; onClose: () => void }) {
  const [qty, setQty] = useState(1);
  const [type, setType] = useState(INCIDENT_TYPES[0].value);
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const selected = INCIDENT_TYPES.find((t) => t.value === type)!;

  const submit = async () => {
    if (description.trim().length < 10) {
      toast.error("Merci de décrire l'incident (10 caractères min).");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("order_incidents").insert({
      order_id: item.order_id,
      order_item_id: item.id,
      user_id: userId,
      quantity: qty,
      incident_type: type,
      description: description.trim(),
      eligible: selected.eligible,
      status: selected.eligible ? "À traiter" : "Non éligible",
    });
    setSubmitting(false);
    if (error) { toast.error("Erreur lors de l'envoi"); return; }
    toast.success(selected.eligible ? "Incident déclaré, nous reviendrons vers vous." : "Déclaration enregistrée — non éligible à une prise en charge.");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-foreground">Déclarer un incident</h3>
            <p className="mt-1 text-xs text-muted-foreground">{item.product_name} · Taille {item.size} · {item.child_prenom}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-muted-foreground hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>

        <div className="mt-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-foreground">Quantité concernée</label>
            <div className="mt-1 flex items-center gap-2">
              {Array.from({ length: item.quantity }, (_, k) => k + 1).map((n) => (
                <button key={n} onClick={() => setQty(n)}
                  className={`h-9 w-9 rounded-lg border text-sm font-medium ${qty === n ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground hover:bg-muted"}`}>
                  {n}
                </button>
              ))}
              <span className="text-xs text-muted-foreground">/ {item.quantity} commandé{item.quantity > 1 ? "s" : ""}</span>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-foreground">Type d'incident</label>
            <select value={type} onChange={(e) => setType(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm">
              {INCIDENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            <p className={`mt-1 text-[11px] ${selected.eligible ? "text-emerald-600" : "text-amber-600"}`}>
              {selected.eligible ? "✓ Éligible à une prise en charge — étude du dossier sous 5 jours." : "⚠ Ce motif n'ouvre généralement pas droit à prise en charge."}
            </p>
          </div>

          <div>
            <label className="text-xs font-medium text-foreground">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4}
              placeholder="Décrivez précisément le problème observé…"
              className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm" />
          </div>

          <div className="rounded-lg bg-secondary/60 p-3 text-[11px] leading-relaxed text-muted-foreground">
            Les frais de retour sont à la charge de l'expéditeur dans tous les cas.
          </div>

          <div className="flex gap-2">
            <button onClick={onClose} className="flex-1 rounded-lg border border-border bg-card py-2 text-sm font-medium hover:bg-muted">Annuler</button>
            <button onClick={submit} disabled={submitting} className="flex-1 rounded-lg bg-primary py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60">
              {submitting ? "Envoi…" : "Envoyer la déclaration"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}