import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { RequireAuth } from "@/components/RequireAuth";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { MapPin, Home, Store, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { ShellMotif } from "@/components/SchoolMotif";
import { useStore, type CartItem, type Child, type Profile, type ShippingChoice, type FamilyParent } from "@/lib/store";
import { createOrderPayment } from "@/server/payplug.functions";
import { supabase } from "@/integrations/supabase/client";
import { PageWatermark } from "@/components/PageWatermark";
import { BackToSchoolAlert } from "@/components/BackToSchoolAlert";
import {
  filterDeliveryOptions,
  getInitialDeliveryOptions,
  pickInitialMode,
  type DeliveryOption,
} from "@/lib/deliveryOptions";

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

/** Format EUR : pas de décimales si entier, virgule sinon. */
function formatEUR(amount: number): string {
  const rounded = Math.round(amount * 100) / 100;
  if (Number.isInteger(rounded)) return `${rounded} €`;
  return `${rounded.toFixed(2).replace(".", ",")} €`;
}

/** Résumé des produits du panier d'un enfant : "Blouse" / "Blouses" / "Blouses, Chemises" */
function summarizeItems(items: CartItem[]): string {
  const counts = new Map<string, number>();
  for (const it of items) {
    // Première moitié du nom = type de vêtement (souvent : "Blouse officielle", "Chemise blanche", ...)
    const baseRaw = it.name.split(/[\s,—]/)[0] || it.name;
    const base = baseRaw.charAt(0).toUpperCase() + baseRaw.slice(1);
    counts.set(base, (counts.get(base) ?? 0) + it.qty);
  }
  return Array.from(counts.entries())
    .map(([name, qty]) => (qty > 1 ? (name.endsWith("s") ? name : `${name}s`) : name))
    .join(", ");
}

function PanierPage() {
  const { user, profile, cart, children, cartCount, updateQty, removeFromCart, checkout, parents } = useStore();
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [sizeConfirmed, setSizeConfirmed] = useState(false);
  const [deliveryOptions, setDeliveryOptions] = useState<DeliveryOption[]>(
    () => getInitialDeliveryOptions(),
  );

  useEffect(() => {
    supabase
      .from("delivery_options")
      .select("code, label, description, active, position")
      .eq("active", true)
      .order("position", { ascending: true })
      .then(({ data }) => {
        if (!data || !data.length) return;
        const mapped: DeliveryOption[] = data.map((d: any) => ({
          code: d.code,
          label: d.label,
          description: d.description,
        }));
        const filtered = filterDeliveryOptions(mapped);
        if (filtered) setDeliveryOptions(filtered);
      });
  }, []);

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
  const total = subtotal;

  const openConfirm = () => {
    if (!user) {
      navigate({ to: "/login" });
      return;
    }
    if (!profile) {
      toast.error("Profil non chargé");
      return;
    }
    setSizeConfirmed(false);
    setConfirmOpen(true);
  };

  const onCheckout = async (shipping: ShippingChoice) => {
    setProcessing(true);
    try {
      const { orderId, orderNumber } = await checkout(shipping);
      toast.success(`Commande ${orderNumber} préparée — redirection vers le paiement…`);
      // Création paiement PayPlug — les emails ne partiront qu'après paiement validé (via webhook)
      const res = await createOrderPayment({ data: { orderId } });
      if (!res.ok || !("paymentUrl" in res)) {
        toast.error("Impossible de créer le paiement. Vous pouvez réessayer depuis vos commandes.");
        navigate({ to: "/commandes" });
        return;
      }
      // Redirection vers la page de paiement hébergée PayPlug
      window.location.href = res.paymentUrl;
    } catch (err: any) {
      toast.error(err.message || "Erreur lors du paiement");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col bg-background/80">
      <PageWatermark />
      <SiteHeader schoolName="Saint-Jacques-de-Compostelle — Dax" />

      <section className="relative mx-auto max-w-6xl w-full px-4 py-10 sm:px-6 lg:px-8">
        <BackToSchoolAlert className="mb-6" />
        <div className="pointer-events-none absolute -top-10 left-0 -z-0 h-80 w-80 text-primary">
          <ShellMotif className="h-full w-full" opacity={0.045} />
        </div>
        <div className="relative flex items-baseline justify-between">
          <div>
            <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
              <span className="h-px w-6 bg-gold" /> Famille {profile?.family_name || profile?.nom || ""}
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
            <Link
              to="/boutique"
              className="mt-6 inline-flex h-11 items-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground"
            >
              Découvrir la boutique
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
            <div className="space-y-6">
              {groups.map((group, i) => (
                <ChildGroup
                  key={group.child?.id ?? `none-${i}`}
                  group={group}
                  onQty={updateQty}
                  onRemove={removeFromCart}
                />
              ))}
            </div>

            <aside className="lg:sticky lg:top-24 lg:self-start">
              <div className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
                <h2 className="text-lg font-semibold tracking-tight text-foreground">
                  Récapitulatif de votre commande
                </h2>
                <dl className="mt-5 space-y-3 text-sm">
                  <Row label={`Articles`} value={`${cartCount}`} />
                  <Row label="Enfants concernés" value={`${groups.length}`} />
                  <Row label="Sous-total" value={formatEUR(subtotal)} />
                   <Row 
                     label="Livraison" 
                     value="Gratuite pour la rentrée de sept. 2026" 
                     subValue="À retirer auprès de l'APEL fin août"
                   />
                </dl>
                <div className="my-5 h-px bg-border" />
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-semibold text-foreground">Total à régler</span>
                  <span className="text-2xl font-semibold text-foreground">{formatEUR(total)}</span>
                </div>
                <button
                  onClick={openConfirm}
                  disabled={processing}
                  className="mt-6 inline-flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-card)] hover:bg-primary/90 disabled:opacity-60"
                >
                  {user ? "Confirmer ma commande" : "Se connecter pour commander"}
                </button>
                  <p className="mt-3 text-center text-[11px] leading-relaxed text-muted-foreground">
                    Paiement en ligne sécurisé par carte bancaire.
                    <br />
                    Vos articles seront fabriqués dans nos ateliers en France, dans les semaines qui viennent et expédiés dans l'établissement pour remise en main propre dès la rentrée.
                  </p>

                <div className="mt-6 rounded-xl bg-secondary p-4 text-xs leading-relaxed text-foreground/75">
                  <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground whitespace-pre-line text-justify">
                    Après validation de votre paiement, votre commande est enregistrée, afin d'être intégrée à la confection des blouses pour la rentrée prochaine et vous garantir la disponibilité des tailles dans les quantités souhaitées pour vos enfants dès la rentrée de septembre 2026.
                  </p>
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
          profile={profile}
          parents={parents}
          deliveryOptions={deliveryOptions}
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
  groups,
  subtotal,
  processing,
  sizeConfirmed,
  profile,
  parents,
  deliveryOptions,
  onToggleSize,
  onClose,
  onConfirm,
}: {
  groups: Group[];
  subtotal: number;
  processing: boolean;
  sizeConfirmed: boolean;
  profile: Profile | null;
  parents: FamilyParent[];
  deliveryOptions: { code: string; label: string; description: string | null }[];
  onToggleSize: () => void;
  onClose: () => void;
  onConfirm: (shipping: ShippingChoice) => void;
}) {
  // Construit la liste des adresses disponibles
  type AddressOption = { id: string; label: string; recipient: string; address: string; postal: string; city: string };
  const addresses: AddressOption[] = [];
  if (profile?.adresse && profile?.code_postal && profile?.ville) {
    addresses.push({
      id: "profile",
      label: "Adresse principale",
      recipient: `${profile.civilite ?? ""} ${profile.prenom} ${profile.nom}`.trim(),
      address: profile.adresse,
      postal: profile.code_postal,
      city: profile.ville,
    });
  }
  parents.forEach((p) => {
    // Adresse principale du parent
    if (p.adresse && p.code_postal && p.ville) {
      addresses.push({
        id: `parent-${p.id}`,
        label: p.role || "Parent",
        recipient: `${p.civilite} ${p.prenom} ${p.nom}`.trim(),
        address: p.adresse,
        postal: p.code_postal,
        city: p.ville,
      });
    }
    // Adresse alternative de livraison
    if (p.has_alt_shipping && p.shipping_adresse && p.shipping_code_postal && p.shipping_ville) {
      addresses.push({
        id: `parent-${p.id}-alt`,
        label: p.shipping_label || `${p.role} (autre)`,
        recipient: `${p.civilite} ${p.prenom} ${p.nom}`.trim(),
        address: p.shipping_adresse,
        postal: p.shipping_code_postal,
        city: p.shipping_ville,
      });
    }
  });

  // Dédoublonnage simple par adresse complète
  const seen = new Set<string>();
  const uniqueAddresses = addresses.filter((a) => {
    const k = `${a.address}|${a.postal}|${a.city}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  const homeOption = deliveryOptions.find((d) => d.code === "home");
  const pickupOption = deliveryOptions.find((d) => d.code === "pickup");
  const initialMode: "home" | "pickup" = homeOption ? "home" : pickupOption ? "pickup" : "home";

  const [mode, setMode] = useState<"home" | "pickup">(initialMode);
  const [selectedAddrId, setSelectedAddrId] = useState<string>(uniqueAddresses[0]?.id ?? "");
  const selected = uniqueAddresses.find((a) => a.id === selectedAddrId);

  const handleConfirm = () => {
    if (mode === "home") {
      if (!selected) {
        toast.error("Veuillez sélectionner une adresse de livraison.");
        return;
      }
      onConfirm({
        mode: "home",
        label: homeOption?.label ?? "Livraison à domicile",
        recipient: selected.recipient,
        address: selected.address,
        postal: selected.postal,
        city: selected.city,
      });
    } else {
      onConfirm({ mode: "pickup", label: pickupOption?.label ?? "Retrait à l'établissement" });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl overflow-hidden rounded-2xl bg-card shadow-2xl"
      >
        <header className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-foreground">Confirmer ma commande</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">Vérifiez les tailles avant de valider</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={processing}
            className="rounded-lg p-1.5 hover:bg-muted disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="max-h-[55vh] overflow-y-auto px-6 py-5">
          {/* Mode de livraison */}
          <div className="mb-4">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Mode de livraison</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {homeOption && (
                <button
                  type="button"
                  onClick={() => setMode("home")}
                  className={`flex items-start gap-3 rounded-xl border-2 p-3 text-left transition ${mode === "home" ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/40"}`}
                >
                  <Home className={`mt-0.5 h-4 w-4 shrink-0 ${mode === "home" ? "text-primary" : "text-muted-foreground"}`} />
                  <div>
                    <div className="text-sm font-semibold text-foreground">{homeOption.label}</div>
                    {homeOption.description && <div className="mt-0.5 text-[11px] text-muted-foreground">{homeOption.description}</div>}
                  </div>
                </button>
              )}
              {pickupOption && (
                <button
                  type="button"
                  onClick={() => setMode("pickup")}
                  className={`flex items-start gap-3 rounded-xl border-2 p-3 text-left transition ${mode === "pickup" ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/40"}`}
                >
                  <Store className={`mt-0.5 h-4 w-4 shrink-0 ${mode === "pickup" ? "text-primary" : "text-muted-foreground"}`} />
                  <div>
                    <div className="text-sm font-semibold text-foreground">{pickupOption.label}</div>
                    {pickupOption.description && <div className="mt-0.5 text-[11px] text-muted-foreground">{pickupOption.description}</div>}
                  </div>
                </button>
              )}
            </div>
          </div>

          {/* Sélecteur d'adresse si livraison à domicile */}
          {mode === "home" && (
            <div className="mb-4 rounded-xl border border-border bg-secondary/40 px-4 py-3">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Adresse de livraison</p>
              </div>
              {uniqueAddresses.length === 0 ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  Aucune adresse enregistrée.{" "}
                  <Link to="/famille" className="font-semibold text-primary hover:underline">Ajouter une adresse</Link>
                </p>
              ) : (
                <div className="mt-2 space-y-1.5">
                  {uniqueAddresses.map((a) => (
                    <label key={a.id} className={`flex cursor-pointer items-start gap-2.5 rounded-lg border p-2.5 text-xs transition ${selectedAddrId === a.id ? "border-primary bg-card" : "border-border bg-card/50 hover:border-primary/40"}`}>
                      <input
                        type="radio"
                        name="ship_addr"
                        value={a.id}
                        checked={selectedAddrId === a.id}
                        onChange={() => setSelectedAddrId(a.id)}
                        className="mt-0.5 accent-primary"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-[10px] font-semibold uppercase tracking-wider text-primary">{a.label}</div>
                        <div className="mt-0.5 font-semibold text-foreground">{a.recipient}</div>
                        <div className="text-muted-foreground">{a.address} · {a.postal} {a.city}</div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          {mode === "pickup" && pickupOption && (
            <div className="mb-4 rounded-xl border border-border bg-secondary/40 px-4 py-3 text-xs">
              <p className="font-semibold text-foreground">Retrait à l'établissement</p>
              <p className="mt-1 text-muted-foreground">Vous serez prévenu(e) par email dès que la commande sera disponible au secrétariat.</p>
            </div>
          )}

          <div className="mb-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-semibold">Avez-vous bien vérifié la taille de chaque article ?</p>
              <p className="mt-1 opacity-90">
                En cas de doute, consultez le guide des tailles. Les uniformes sont préparés sur mesure pour chaque
                famille.
              </p>
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
                        <p className="mt-0.5 text-muted-foreground">
                          Réf. {item.ref} · Qté {item.qty} · {formatEUR(item.price)}/u
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
                          Taille {item.size}
                        </span>
                        <span className="text-[11px] font-semibold text-foreground">
                          {formatEUR(item.price * item.qty)}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="flex items-center justify-between border-t border-border px-4 py-2 text-[11px]">
                  <span className="text-muted-foreground">Sous-total {group.child?.prenom ?? ""}</span>
                  <span className="font-semibold text-foreground">
                    {formatEUR(group.items.reduce((s, it) => s + it.price * it.qty, 0))}
                  </span>
                </div>
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
              Je confirme avoir vérifié les <span className="font-semibold">tailles</span> et le{" "}
              <span className="font-semibold">destinataire</span> de chaque article.
            </span>
          </label>

          <div className="mt-4 flex items-center justify-between rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Total de la commande
              </div>
              <div className="text-xs text-muted-foreground">
                {groups.reduce((s, g) => s + g.items.reduce((ss, it) => ss + it.qty, 0), 0)} article(s) ·{" "}
                {groups.length} enfant(s)
              </div>
            </div>
            <div className="text-xl font-semibold text-primary">{formatEUR(subtotal)}</div>
          </div>

          <div className="mt-3 flex items-center justify-end gap-2">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={processing}
                className="h-10 rounded-lg border border-border bg-card px-4 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50"
              >
                Modifier
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={!sizeConfirmed || processing || (mode === "home" && uniqueAddresses.length === 0)}
                className="h-10 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {processing ? (
                  <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Préparation du paiement…</span>
                ) : "Payer ma commande"}
              </button>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

function ChildGroup({
  group,
  onQty,
  onRemove,
}: {
  group: Group;
  onQty: (id: string, qty: number) => void;
  onRemove: (id: string) => void;
}) {
  const genre = group.child?.genre;
  const tone =
    genre === "Fille"
      ? {
          card: "border-pink-200",
          header: "border-pink-200 bg-pink-50",
          badge: "bg-pink-500 text-white",
          chip: "bg-white text-pink-700 border border-pink-200",
          name: "text-sky-800 text-lg",
        }
      : genre === "Garçon"
        ? {
            card: "border-sky-200",
            header: "border-sky-200 bg-sky-50",
            badge: "bg-sky-500 text-white",
            chip: "bg-white text-sky-700 border border-sky-200",
            name: "text-sky-800",
          }
        : {
            card: "border-border",
            header: "border-border bg-secondary/60",
            badge: "bg-primary/10 text-primary",
            chip: "bg-card text-muted-foreground",
            name: "text-foreground",
          };
  const summary = summarizeItems(group.items) || "Articles";
  return (
    <section className={`overflow-hidden rounded-3xl border ${tone.card} bg-card`}>
      <header
        className={`flex flex-wrap items-center justify-between gap-2 border-b ${tone.header} px-4 py-3 lg:px-6 lg:py-4`}
      >
        <div className="flex min-w-0 items-center gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${tone.badge}`}
          >
            {group.child?.initials ?? "—"}
          </div>
          <div className="min-w-0">
            <h3 className={`truncate tracking-tight ${tone.name} font-sans font-bold text-sm`}>
              {group.child ? `pour ${group.child.prenom} ${group.child.nom}` : "—"}
            </h3>
            <p className="truncate text-xs text-muted-foreground">
              {group.child
                ? [group.child.classe, group.child.section].filter(Boolean).join(" · ") || "—"
                : "Enfant non défini"}
            </p>
          </div>
        </div>
        <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${tone.chip}`}>{summary}</span>
      </header>

      <ul className="divide-y divide-border">
        {group.items.map((item) => (
          <li key={item.id} className="flex items-center gap-3 px-4 py-4 lg:gap-4 lg:px-6 lg:py-5">
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-border bg-secondary lg:h-20 lg:w-20">
              <img src={item.image} alt={item.name} className="h-full w-full object-cover" loading="lazy" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2 lg:gap-3">
                <div className="min-w-0">
                  <h4 className="text-sm font-semibold leading-tight text-foreground lg:truncate">{item.name}</h4>
                  <p className="mt-0.5 text-xs text-muted-foreground">Réf. {item.ref}</p>
                  <p className="mt-2 text-xs text-foreground/80">
                    Taille <span className="font-semibold">{item.size}</span>
                  </p>
                  {group.child && (
                    <p className="mt-1 hidden text-[11px] text-muted-foreground lg:block">
                      Pour{" "}
                      <span className="font-medium text-foreground">
                        {group.child.prenom} {group.child.nom}
                      </span>
                      {group.child.classe && <> · classe {group.child.classe}</>}
                    </p>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-sm font-semibold text-foreground lg:text-base">
                    {formatEUR(item.qty * item.price)}
                  </div>
                  <div className="text-[11px] text-muted-foreground lg:text-xs">{formatEUR(item.price)} l'unité</div>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div className="inline-flex h-9 items-center rounded-lg border border-border bg-background">
                  <button
                    onClick={() => onQty(item.id, item.qty - 1)}
                    className="px-3 text-muted-foreground hover:text-foreground"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="w-7 text-center text-sm font-semibold">{item.qty}</span>
                  <button
                    onClick={() => onQty(item.id, item.qty + 1)}
                    className="px-3 text-muted-foreground hover:text-foreground"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
                <button
                  onClick={() => onRemove(item.id)}
                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive"
                >
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

function Row({
   label,
   value,
   subValue,
   valueClass = "",
   muted = false,
 }: {
   label: string;
   value: string;
   subValue?: string;
   valueClass?: string;
   muted?: boolean;
 }) {
   return (
     <div className="flex items-start justify-between gap-4">
       <dt className={muted ? "text-muted-foreground" : "text-foreground/80"}>{label}</dt>
       <div className="text-right">
         <dd className={`font-medium ${valueClass || (muted ? "text-muted-foreground" : "text-foreground")}`}>
           {value}
         </dd>
         {subValue && (
           <p className="mt-0.5 text-[11px] leading-tight text-muted-foreground italic">
             {subValue}
           </p>
         )}
       </div>
     </div>
   );
}
