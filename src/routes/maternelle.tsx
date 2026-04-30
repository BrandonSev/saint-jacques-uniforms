import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronRight, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { ShellMotif } from "@/components/SchoolMotif";
import { ChildPicker } from "@/components/ChildPicker";
import { useStore } from "@/lib/store";
import blouseProduct from "@/assets/blouse-bleue-officielle.jpeg";
import classeBlouses from "@/assets/elementaire-hero.jpg";

export const Route = createFileRoute("/maternelle")({
  head: () => ({
    meta: [
      { title: "Uniformes Maternelle & Élémentaire — Saint-Jacques de Compostelle" },
      {
        name: "description",
        content:
          "Sélection d'uniformes validée par l'établissement pour les élèves de maternelle et d'élémentaire (PS, MS, GS, CP, CE1, CE2, CM1).",
      },
    ],
  }),
  component: MaternelleListPage,
});

const sizes = ["3 ans", "4 ans", "5 ans", "6 ans", "7 ans", "8 ans", "10 ans", "12 ans"];

const products = [
  {
    id: "blouse-officielle",
    name: "Blouse scolaire officielle",
    ref: "BLSE-FU-001",
    price: 25,
    image: blouseProduct,
    tag: "Officielle",
    desc: "Blouse bleu Riviera, col contrasté, écusson brodé. Tenue quotidienne portée par tous les élèves.",
    href: "/blouse-officielle" as const,
  },
];

function MaternelleListPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader schoolName="Saint-Jacques de Compostelle — Dax" />

      <div className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl items-center gap-1.5 px-4 py-3 text-xs text-muted-foreground sm:px-6 lg:px-8">
          <Link to="/niveau" className="hover:text-primary">Boutique</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">Maternelle & Élémentaire (PS · MS · GS · CP · CE1 · CE2 · CM1)</span>
        </div>
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border" style={{ background: "var(--gradient-soft)" }}>
        <div className="pointer-events-none absolute inset-0 text-primary">
          <ShellMotif className="absolute -left-32 -bottom-32 h-[480px] w-[480px]" opacity={0.05} />
        </div>
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:px-8">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary">
              <ShieldCheck className="h-3 w-3" /> Sélection validée par l'établissement
            </span>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Maternelle & Élémentaire
            </h1>
            <p className="mt-3 max-w-xl leading-relaxed text-muted-foreground">
              Tenue officielle pour les classes de PS, MS, GS, CP, CE1, CE2 et CM1.
              Portée au quotidien par tous les élèves.
            </p>
            <div className="mt-6 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full border border-border bg-card px-3 py-1.5 text-muted-foreground">1 produit</span>
              <span className="rounded-full border border-border bg-card px-3 py-1.5 text-muted-foreground">Tailles 3 → 12 ans</span>
              <span className="rounded-full border border-border bg-card px-3 py-1.5 text-muted-foreground">Livraison à l'école</span>
            </div>
          </div>
          <div className="relative h-64 overflow-hidden rounded-3xl border border-border lg:h-80">
            <img src={classeBlouses} alt="Élèves en blouse" className="h-full w-full object-cover" loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/40 to-transparent" />
          </div>
        </div>
      </section>

      {/* Products */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

function ProductCard({ product }: { product: (typeof products)[number] }) {
  const { addToCart, children } = useStore();
  const [size, setSize] = useState("4 ans");
  const [qty, setQty] = useState(1);
  const [childId, setChildId] = useState<string>("");

  const handleAdd = () => {
    if (children.length === 0) { toast.error("Ajoutez d'abord un enfant"); return; }
    if (!childId) { toast.error("Choisissez un enfant"); return; }
    addToCart({
      productId: product.id, name: product.name, ref: product.ref,
      price: product.price, size, qty, image: product.image,
      childId,
    });
    toast.success(`${product.name} ajouté au panier`);
  };

  return (
    <article className="group overflow-hidden rounded-3xl border border-border bg-card transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-card)]">
      <Link to={product.href} className="block">
        <div className="relative aspect-square overflow-hidden" style={{ backgroundColor: "#f3edE0" }}>
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full object-contain p-4 transition-transform duration-500 group-hover:scale-[1.03]"
            loading="lazy"
          />
          <span className="absolute left-4 top-4 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary backdrop-blur">
            {product.tag}
          </span>
        </div>
      </Link>

      <div className="p-6">
        <div className="flex items-baseline justify-between gap-3">
          <Link to={product.href} className="text-lg font-semibold tracking-tight text-foreground hover:text-primary">
            {product.name}
          </Link>
          <span className="text-lg font-semibold text-foreground">{product.price.toFixed(2)} €</span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">Réf. {product.ref}</p>
        <p className="mt-3 text-sm leading-relaxed text-foreground/75">{product.desc}</p>

          <div className="mt-5">
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Pour quel enfant ?</div>
            <div className="mt-2"><ChildPicker value={childId} onChange={setChildId} filter={(c) => c.section === "Maternelle" || c.section === "Élémentaire"} /></div>
        </div>

        <div className="mt-4">
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Taille</div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {sizes.map((s) => (
              <button
                key={s}
                onClick={() => setSize(s)}
                className={`h-9 px-2 min-w-[3.5rem] rounded-md border text-xs font-medium transition-all ${
                  size === s
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-foreground hover:border-primary/40"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 flex items-stretch gap-2">
          <div className="inline-flex h-11 items-center rounded-lg border border-border bg-background">
            <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-3 text-muted-foreground hover:text-foreground">−</button>
            <span className="w-7 text-center text-sm font-semibold">{qty}</span>
            <button onClick={() => setQty(qty + 1)} className="px-3 text-muted-foreground hover:text-foreground">+</button>
          </div>
          <button onClick={handleAdd} disabled={children.length === 0 || !childId}
            className="inline-flex h-11 flex-1 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50">
            {children.length === 0 ? "Ajoutez un enfant" : !childId ? "Choisir un enfant" : "Ajouter au panier"}
          </button>
        </div>
      </div>
    </article>
  );
}
