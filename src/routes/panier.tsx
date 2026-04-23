import { createFileRoute, Link } from "@tanstack/react-router";
import { Lock, Minus, Plus, Trash2 } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { ShellMotif } from "@/components/SchoolMotif";
import blouse from "@/assets/blouse-bleue-officielle.jpeg";
import polo from "@/assets/polo-college.jpg";
import pull from "@/assets/pull-college.jpg";
import tshirt from "@/assets/tshirt-college.jpg";

export const Route = createFileRoute("/panier")({
  head: () => ({
    meta: [{ title: "Mon panier — Espace familles" }],
  }),
  component: PanierPage,
});

const cart = [
  {
    enfant: "Léa Martin",
    classe: "CE2 · Élémentaire",
    initials: "LM",
    color: "bg-pink-100 text-pink-700",
    items: [
      { name: "Blouse scolaire officielle", ref: "SJC-BLS-2025", size: "8 ans", qty: 2, price: 32.9, image: blouse },
    ],
  },
  {
    enfant: "Thomas Martin",
    classe: "6e B · Collège",
    initials: "TM",
    color: "bg-sky-100 text-sky-700",
    items: [
      { name: "Polo manches courtes", ref: "SJC-POL-MC", size: "M", qty: 3, price: 24.9, image: polo },
      { name: "Pull col V marine", ref: "SJC-PUL-V", size: "M", qty: 1, price: 39.9, image: pull },
      { name: "T-shirt EPS", ref: "SJC-TSH-EPS", size: "M", qty: 2, price: 14.9, image: tshirt },
    ],
  },
];

function PanierPage() {
  const totalArticles = cart.reduce((s, e) => s + e.items.reduce((a, i) => a + i.qty, 0), 0);
  const subtotal = cart.reduce(
    (s, e) => s + e.items.reduce((a, i) => a + i.qty * i.price, 0),
    0,
  );
  const delivery = 0;
  const total = subtotal + delivery;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader schoolName="Saint-Jacques de Compostelle — Dax" cartCount={totalArticles} />

      <section className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute -top-10 left-0 -z-0 h-80 w-80 text-primary">
          <ShellMotif className="h-full w-full" opacity={0.045} />
        </div>
        <div className="relative flex items-baseline justify-between">
          <div>
            <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
              <span className="h-px w-6 bg-gold" /> Famille Martin
            </span>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Mon panier</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {totalArticles} articles · répartis pour {cart.length} enfants
            </p>
          </div>
          <Link to="/niveau" className="hidden text-sm text-primary hover:underline sm:inline">
            ← Continuer mes achats
          </Link>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
          {/* Cart by child */}
          <div className="space-y-6">
            {cart.map((group) => (
              <ChildGroup key={group.enfant} group={group} />
            ))}
          </div>

          {/* Summary */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
              <h2 className="text-lg font-semibold tracking-tight text-foreground">Récapitulatif</h2>
              <dl className="mt-5 space-y-3 text-sm">
                <Row label={`Sous-total (${totalArticles} articles)`} value={`${subtotal.toFixed(2)} €`} />
                <Row label="Livraison à l'école" value="Offerte" valueClass="text-primary" />
                <Row label="TVA incluse" value={`${(subtotal * 0.2).toFixed(2)} €`} muted />
              </dl>
              <div className="my-5 h-px bg-border" />
              <div className="flex items-baseline justify-between">
                <span className="text-base font-semibold text-foreground">Total</span>
                <span className="text-2xl font-semibold text-foreground">{total.toFixed(2)} €</span>
              </div>
              <button className="mt-6 inline-flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-card)] hover:bg-primary/90">
                <Lock className="h-4 w-4" />
                Passer au paiement
              </button>
              <p className="mt-3 text-center text-[11px] text-muted-foreground">
                Paiement sécurisé · CB · Prélèvement · 3× sans frais
              </p>

              <div className="mt-6 rounded-xl bg-secondary p-4 text-xs leading-relaxed text-foreground/75">
                <p className="font-semibold text-foreground">Livraison à l'établissement</p>
                <p className="mt-1">Vos commandes seront remises directement à votre enfant au secrétariat de Saint-Jacques de Compostelle, sous 5 à 7 jours ouvrés.</p>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

function ChildGroup({ group }: { group: (typeof cart)[number] }) {
  return (
    <section className="overflow-hidden rounded-3xl border border-border bg-card">
      <header className="flex items-center justify-between border-b border-border bg-secondary/60 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold ${group.color}`}>
            {group.initials}
          </div>
          <div>
            <h3 className="text-base font-semibold tracking-tight text-foreground">Pour {group.enfant}</h3>
            <p className="text-xs text-muted-foreground">{group.classe}</p>
          </div>
        </div>
        <span className="rounded-full bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
          {group.items.reduce((a, i) => a + i.qty, 0)} articles
        </span>
      </header>

      <ul className="divide-y divide-border">
        {group.items.map((item) => (
          <li key={item.ref} className="flex items-center gap-4 px-6 py-5">
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
                  <button className="px-3 text-muted-foreground hover:text-foreground"><Minus className="h-3.5 w-3.5" /></button>
                  <span className="w-7 text-center text-sm font-semibold">{item.qty}</span>
                  <button className="px-3 text-muted-foreground hover:text-foreground"><Plus className="h-3.5 w-3.5" /></button>
                </div>
                <button className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive">
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