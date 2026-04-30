import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { RequireAuth } from "@/components/RequireAuth";
import { useMemo, useState } from "react";
import { AlertTriangle, Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { ShellMotif } from "@/components/SchoolMotif";
import { useStore, type CartItem, type Child } from "@/lib/store";

export const Route = createFileRoute("/panier")({
  head: () => ({
    meta: [{ title: "Mon panier — Espace familles" }],
  }),
  component: () => (
    <RequireAuth>
      <PanierPage />
    </RequireAuth>
  ),
});

type Group = { child: Child | null; items: CartItem[] };

function PanierPage() {
  const { user, profile, cart, children, cartCount, updateQty, removeFromCart, checkout } = useStore();
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [sizeConfirmed, setSizeConfirmed] = useState(false);

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
  const total = 0;

  const openConfirm = () => {
    if (!user) { navigate({ to: "/login" }); return; }
    if (!profile) { toast.error("Profil non chargé"); return; }
    setSizeConfirmed(false);
    setConfirmOpen(true);
  };

  const onCheckout = async () => {
    setProcessing(true);
    try {
      const { orderNumber } = await checkout();
      toast.success(`Commande ${orderNumber} enregistrée !`);
      setConfirmOpen(false);
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
          <Link to="/boutique" className="hidden text-sm text-primary hover:underline sm:inline">
            ← Continuer mes achats
          </Link>
        </div>

        {cart.length === 0 ? (
          <div className="mt-12 rounded-3xl border border-dashed border-border bg-card p-16 text-center">
            <ShoppingBag className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-4 text-sm text-muted-foreground">Votre panier est vide.</p>
            <Link to="/boutique" className="mt-6 inline-flex h-11 items-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground">Découvrir la boutique</Link>
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
                <Row label={`Articles`} value={`${cartCount}`} />
                <Row label="Enfants concernés" value={`${groups.length}`} />
              </dl>
              <div className="my-5 h-px bg-border" />
              <div className="flex items-baseline justify-between">
                <span className="text-base font-semibold text-foreground">Total à régler</span>
                <span className="text-2xl font-semibold text-foreground">{total.toFixed(2)} €</span>
              </div>
              <button onClick={openConfirm} disabled={processing} className="mt-6 inline-flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-card)] hover:bg-primary/90 disabled:opacity-60">
                {user ? "Envoyer ma commande" : "Se connecter pour commander"}
              </button>
              <p className="mt-3 text-center text-[11px] text-muted-foreground">
                Le paiement en ligne sera disponible prochainement.
              </p>

              <div className="mt-6 rounded-xl bg-secondary p-4 text-xs leading-relaxed text-foreground/75">
                <p className="font-semibold text-foreground">Commande transmise à l'établissement</p>
                <p className="mt-1">Votre commande sera enregistrée et préparée. Aucun paiement n'est requis pour le moment.</p>
              </div>
            </div>
          </aside>
        </div>
        )}
      </section>

      {confirmOpen && (
        <ConfirmModal
          groups={groups}
          subtotal={subtotal}
          processing={processing}
          sizeConfirmed={sizeConfirmed}
          onToggleSize={() => setSizeConfirmed((v) => !v)}
          onClose={() => !processing && setConfirmOpen(false)}
          onConfirm={onCheckout}
        />
      )}

      <SiteFooter />
    </div>
  );
}

function ConfirmModal({
  groups, subtotal, processing, sizeConfirmed, onToggleSize, onClose, onConfirm,
}: {
  groups: Group[];
  subtotal: number;
  processing: boolean;
  sizeConfirmed: boolean;
  onToggleSize: () => void;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-2xl overflow-hidden rounded-2xl bg-card shadow-2xl">
        <header className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-foreground">Confirmer ma commande</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">Vérifiez les tailles avant de valider — les échanges sont possibles sous 30 jours.</p>
          </div>
          <button type="button" onClick={onClose} disabled={processing} className="rounded-lg p-1.5 hover:bg-muted disabled:opacity-50">
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="max-h-[55vh] overflow-y-auto px-6 py-5">
          <div className="mb-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-semibold">Avez-vous bien vérifié la taille de chaque article ?</p>
              <p className="mt-1 opacity-90">En cas de doute, consultez le guide des tailles. Les uniformes sont préparés sur mesure pour chaque famille.</p>
            </div>
          </div>

          <ul className="space-y-4">
            {groups.map((group, i) => (
              <li key={group.child?.id ?? `none-${i}`} className="rounded-xl border border-border bg-background">
                <div className="flex items-center gap-3 border-b border-border px-4 py-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {group.child?.initials ?? "—"}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {group.child ? `${group.child.prenom} ${group.child.nom}` : "Enfant non défini"}
                    </p>
                    {group.child && (
                      <p className="text-[11px] text-muted-foreground">
                        {[group.child.classe, group.child.section].filter(Boolean).join(" · ") || "—"}
                      </p>
                    )}
                  </div>
                </div>
                <ul className="divide-y divide-border">
                  {group.items.map((item) => (
                    <li key={item.id} className="flex items-center justify-between gap-4 px-4 py-3 text-xs">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground">{item.name}</p>
                        <p className="mt-0.5 text-muted-foreground">Réf. {item.ref} · Qté {item.qty}</p>
                      </div>
                      <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
                        Taille {item.size}
                      </span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>

        <footer className="border-t border-border bg-secondary/40 px-6 py-4">
          <label className="flex items-start gap-2.5 text-xs text-foreground">
            <input
              type="checkbox"
              checked={sizeConfirmed}
              onChange={onToggleSize}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-border accent-primary"
            />
            <span>
              Je confirme avoir vérifié les <span className="font-semibold">tailles</span> et le <span className="font-semibold">destinataire</span> de chaque article.
            </span>
          </label>

          <div className="mt-4 flex items-center justify-between gap-3">
            <div className="text-xs text-muted-foreground">
              Sous-total indicatif : <span className="font-semibold text-foreground">{subtotal.toFixed(2)} €</span>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={onClose} disabled={processing} className="h-10 rounded-lg border border-border bg-card px-4 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50">
                Modifier
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={!sizeConfirmed || processing}
                className="h-10 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {processing ? "Envoi…" : "Confirmer et envoyer"}
              </button>
            </div>
          </div>
        </footer>
      </div>
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
          Blouse
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
                  {group.child && (
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      Pour <span className="font-medium text-foreground">{group.child.prenom} {group.child.nom}</span>
                      {group.child.classe && <> · classe {group.child.classe}</>}
                    </p>
                  )}
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