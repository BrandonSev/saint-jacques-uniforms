import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Lock, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { ShellMotif } from "@/components/SchoolMotif";
import { useStore, type CartItem, type Child } from "@/lib/store";

export const Route = createFileRoute("/panier")({
  head: () => ({
    meta: [{ title: "Mon panier — Espace familles" }],
  }),
  component: PanierPage,
});

type Group = { child: Child | null; items: CartItem[] };

function PanierPage() {
  const { user, profile, cart, children, cartCount, updateQty, removeFromCart, checkout } = useStore();
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(false);

  const groups = useMemo<Group[]>(() => {
    const map = new Map<string, Group>();
    for (const item of cart) {
      const child = children.find((c) => c.id === item.childId) ?? null;
      const key = item.childId || "none";
      if (!map.has(key)) map.set(key, { child, items: [] });
      map.get(key)!.items.push(item);
    }
    return Array.from(map.values());
  }, [cart, children]);

  const subtotal = cart.reduce((s, i) => s + i.qty * i.price, 0);
  const delivery = 0;
  const total = subtotal + delivery;

  const onCheckout = async () => {
    if (!user) { navigate({ to: "/login" }); return; }
    if (!profile) { toast.error("Profil non chargé"); return; }
    setProcessing(true);
    try {
      const { orderNumber } = await checkout();
      toast.success(`Commande ${orderNumber} enregistrée !`);
      navigate({ to: "/enfants" });
    } catch (err: any) {
      toast.error(err.message || "Erreur lors du paiement");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader schoolName="Saint-Jacques de Compostelle — Dax" />

      <section className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute -top-10 left-0 -z-0 h-80 w-80 text-primary">
          <ShellMotif className="h-full w-full" opacity={0.045} />
        </div>
        <div className="relative flex items-baseline justify-between">
          <div>
            <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
              <span className="h-px w-6 bg-gold" /> Famille {profile?.nom || ""}
            </span>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Mon panier</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {cartCount} article{cartCount > 1 ? "s" : ""} · {groups.length} enfant{groups.length > 1 ? "s" : ""}
            </p>
          </div>
          <Link to="/niveau" className="hidden text-sm text-primary hover:underline sm:inline">
            ← Continuer mes achats
          </Link>
        </div>

        {cart.length === 0 ? (
          <div className="mt-12 rounded-3xl border border-dashed border-border bg-card p-16 text-center">
            <ShoppingBag className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-4 text-sm text-muted-foreground">Votre panier est vide.</p>
            <Link to="/niveau" className="mt-6 inline-flex h-11 items-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground">Découvrir la boutique</Link>
          </div>
        ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
          <div className="space-y-6">
            {groups.map((group, i) => (
              <ChildGroup key={group.child?.id ?? `none-${i}`} group={group} onQty={updateQty} onRemove={removeFromCart} />
            ))}
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
              <h2 className="text-lg font-semibold tracking-tight text-foreground">Récapitulatif</h2>
              <dl className="mt-5 space-y-3 text-sm">
                <Row label={`Sous-total (${cartCount} articles)`} value={`${subtotal.toFixed(2)} €`} />
                <Row label="Livraison à domicile" value="Offerte" valueClass="text-primary" />
                <Row label="TVA incluse" value={`${(subtotal * 0.2).toFixed(2)} €`} muted />
              </dl>
              <div className="my-5 h-px bg-border" />
              <div className="flex items-baseline justify-between">
                <span className="text-base font-semibold text-foreground">Total</span>
                <span className="text-2xl font-semibold text-foreground">{total.toFixed(2)} €</span>
              </div>
              <button onClick={onCheckout} disabled={processing} className="mt-6 inline-flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-card)] hover:bg-primary/90 disabled:opacity-60">
                <Lock className="h-4 w-4" />
                {processing ? "Traitement…" : user ? "Valider la commande" : "Se connecter pour commander"}
              </button>
              <p className="mt-3 text-center text-[11px] text-muted-foreground">
                Paiement sécurisé · CB · Prélèvement · 3× sans frais
              </p>

              <div className="mt-6 rounded-xl bg-secondary p-4 text-xs leading-relaxed text-foreground/75">
                <p className="font-semibold text-foreground">Livraison à domicile</p>
                <p className="mt-1">Vos commandes seront expédiées à l'adresse indiquée dans votre profil sous 5 à 7 jours ouvrés.</p>
              </div>
            </div>
          </aside>
        </div>
        )}
      </section>

      <SiteFooter />
    </div>
  );
}

function ChildGroup({ group, onQty, onRemove }: { group: Group; onQty: (id: string, qty: number) => void; onRemove: (id: string) => void }) {
  const totalQty = group.items.reduce((a, i) => a + i.qty, 0);
  return (
    <section className="overflow-hidden rounded-3xl border border-border bg-card">
      <header className="flex items-center justify-between border-b border-border bg-secondary/60 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
            {group.child?.initials ?? "—"}
          </div>
          <div>
            <h3 className="text-base font-semibold tracking-tight text-foreground">Pour {group.child ? `${group.child.prenom} ${group.child.nom}` : "—"}</h3>
            <p className="text-xs text-muted-foreground">{group.child ? [group.child.classe, group.child.section].filter(Boolean).join(" · ") || "—" : "Enfant non défini"}</p>
          </div>
        </div>
        <span className="rounded-full bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
          {totalQty} article{totalQty > 1 ? "s" : ""}
        </span>
      </header>

      <ul className="divide-y divide-border">
        {group.items.map((item) => (
          <li key={item.id} className="flex items-center gap-4 px-6 py-5">
            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-border bg-secondary">
              <img src={item.image} alt={item.name} className="h-full w-full object-cover" loading="lazy" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h4 className="truncate text-sm font-semibold text-foreground">{item.name}</h4>
                  <p className="mt-0.5 text-xs text-muted-foreground">Réf. {item.ref}</p>
                  <p className="mt-2 text-xs text-foreground/80">
                    Taille <span className="font-semibold">{item.size}</span>
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-base font-semibold text-foreground">
                    {(item.qty * item.price).toFixed(2)} €
                  </div>
                  <div className="text-xs text-muted-foreground">{item.price.toFixed(2)} € l'unité</div>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div className="inline-flex h-9 items-center rounded-lg border border-border bg-background">
                  <button onClick={() => onQty(item.id, item.qty - 1)} className="px-3 text-muted-foreground hover:text-foreground"><Minus className="h-3.5 w-3.5" /></button>
                  <span className="w-7 text-center text-sm font-semibold">{item.qty}</span>
                  <button onClick={() => onQty(item.id, item.qty + 1)} className="px-3 text-muted-foreground hover:text-foreground"><Plus className="h-3.5 w-3.5" /></button>
                </div>
                <button onClick={() => onRemove(item.id)} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-3.5 w-3.5" /> Retirer
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Row({ label, value, valueClass = "", muted = false }: { label: string; value: string; valueClass?: string; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <dt className={muted ? "text-muted-foreground" : "text-foreground/80"}>{label}</dt>
      <dd className={`font-medium ${valueClass || (muted ? "text-muted-foreground" : "text-foreground")}`}>{value}</dd>
    </div>
  );
}