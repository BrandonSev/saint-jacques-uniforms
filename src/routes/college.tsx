import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronRight, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { ShellMotif } from "@/components/SchoolMotif";
import { ChildPicker } from "@/components/ChildPicker";
import { useStore } from "@/lib/store";
import polo from "@/assets/polo-alban.jpg";
import pull from "@/assets/pull-oscar.jpg";
import tshirt from "@/assets/tshirt-valery.jpg";
import chemise from "@/assets/chemise-candice.jpg";
import chemiseFille from "@/assets/chemise-candice-fille.png";
import poloPorte from "@/assets/college-polo-porte.jpg";

export const Route = createFileRoute("/college")({
  head: () => ({
    meta: [
      { title: "Uniformes collège — Saint-Jacques de Compostelle" },
      {
        name: "description",
        content:
          "Polos, pulls et t-shirts validés par l'établissement pour les collégiens du Groupe Saint-Jacques de Compostelle.",
      },
    ],
  }),
  component: CollegePage,
});

const sizes = ["10 ans", "12 ans", "14 ans", "16 ans", "18 ans"];

const products = [
  {
    id: "polo",
    name: "Polo Alban",
    ref: "PO-FU-013",
    price: 33.6,
    image: polo,
    tag: "Best-seller",
    desc: "Polo blanc en piqué de coton, écusson brodé du groupe scolaire et liseré tricolore.",
  },
  {
    id: "pull",
    name: "Pull Oscar",
    ref: "PU-FU-009",
    price: 45.6,
    image: pull,
    tag: "Hiver",
    desc: "Pull col V bleu marine, maille jacquard, écusson brodé poitrine.",
  },
  {
    id: "chemise",
    name: "Chemise Candice — Garçon",
    ref: "CHE-FU-002G",
    price: 26.4,
    image: chemise,
    tag: "Cérémonie",
    desc: "Chemise blanche manches longues, coton tissé, écusson brodé poitrine.",
  },
  {
    id: "chemise-fille",
    name: "Chemise Candice — Fille",
    ref: "CHE-FU-002F",
    price: 29.4,
    image: chemiseFille,
    tag: "Fille",
    desc: "Chemise blanche manches longues, coupe cintrée (pinces poitrine & dos), 50% polyester / 50% coton.",
  },
  {
    id: "tshirt",
    name: "Tee-shirt Valery",
    ref: "TS-FU-019",
    price: 19.2,
    image: tshirt,
    tag: "Sport",
    desc: "Tee-shirt blanc col rond, coton souple, écusson brodé et finition tricolore.",
  },
];

function CollegePage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader schoolName="Saint-Jacques de Compostelle — Dax" />

      <div className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl items-center gap-1.5 px-4 py-3 text-xs text-muted-foreground sm:px-6 lg:px-8">
          <Link to="/niveau" className="hover:text-primary">Boutique</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">Collège (CM2 → 4ᵉ)</span>
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
              Uniformes collège — CM2 à 4ᵉ
            </h1>
            <p className="mt-3 max-w-xl leading-relaxed text-muted-foreground">
              Sélection d'uniformes validée par l'établissement pour les classes
              de CM2, 6ᵉ, 5ᵉ et 4ᵉ. Commande simple pour les familles : tous les
              produits ci-dessous sont autorisés au collège Saint-Jacques de
              Compostelle.
            </p>
            <div className="mt-6 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full border border-border bg-card px-3 py-1.5 text-muted-foreground">5 produits</span>
              <span className="rounded-full border border-border bg-card px-3 py-1.5 text-muted-foreground">Tailles 10 → 18 ans</span>
              <span className="rounded-full border border-border bg-card px-3 py-1.5 text-muted-foreground">Livraison à domicile</span>
            </div>
          </div>
          <div className="relative h-64 overflow-hidden rounded-3xl border border-border lg:h-80">
            <img src={poloPorte} alt="Collégien en uniforme" className="h-full w-full object-cover" loading="lazy" />
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
  const [size, setSize] = useState("14 ans");
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

      <div className="p-6">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="text-lg font-semibold tracking-tight text-foreground">{product.name}</h3>
          <span className="text-lg font-semibold text-foreground">{product.price.toFixed(2)} €</span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">Réf. {product.ref}</p>
        <p className="mt-3 text-sm leading-relaxed text-foreground/75">{product.desc}</p>

        <div className="mt-5">
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

        <div className="mt-4">
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Pour quel enfant ?</div>
          <div className="mt-2"><ChildPicker value={childId} onChange={setChildId} /></div>
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