import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { ChildPicker } from "@/components/ChildPicker";
import { useStore, type Child } from "@/lib/store";

export type ProductCardData = {
  id: string;
  name: string;
  ref: string;
  price: number;
  image: string;
  tag?: string;
  desc?: string;
  href?: string;
};

type Props = {
  product: ProductCardData;
  sizes: string[];
  defaultSize?: string;
  childFilter?: (c: Child) => boolean;
};

export function ProductCard({ product, sizes, defaultSize, childFilter }: Props) {
  const { addToCart, children } = useStore();
  const [size, setSize] = useState(defaultSize ?? sizes[0]);
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

  const Title = product.href ? (
    <Link to={product.href} className="text-lg font-semibold tracking-tight text-foreground hover:text-primary">
      {product.name}
    </Link>
  ) : (
    <h3 className="text-lg font-semibold tracking-tight text-foreground">{product.name}</h3>
  );

  const Image = (
    <div className="relative aspect-square overflow-hidden" style={{ backgroundColor: "#f3edE0" }}>
      <img
        src={product.image}
        alt={product.name}
        className="h-full w-full object-contain p-4 transition-transform duration-500 group-hover:scale-[1.03]"
        loading="lazy"
      />
    </div>
  );

  return (
    <article className="group flex flex-col overflow-hidden rounded-3xl border border-border bg-card transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-card)]">
      {product.href ? <Link to={product.href} className="block">{Image}</Link> : Image}

      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-baseline justify-between gap-3">
          {Title}
          <span className="text-lg font-semibold text-foreground">{product.price} €</span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">Réf. {product.ref}</p>
        {product.desc && <p className="mt-3 text-sm leading-relaxed text-foreground/75">{product.desc}</p>}

        <div className="mt-5">
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Pour quel enfant ?</div>
          <div className="mt-2"><ChildPicker value={childId} onChange={setChildId} filter={childFilter} /></div>
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

        <div className="mt-auto pt-5 flex items-stretch gap-2">
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