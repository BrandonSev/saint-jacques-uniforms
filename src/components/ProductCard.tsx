import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import { ChildPicker } from "@/components/ChildPicker";
import { useStore, type Child } from "@/lib/store";
import { recommendSize } from "@/lib/sizeRecommendation";

export type ProductGenre = "Fille" | "Garçon" | "Unisexe";

export type ProductCardData = {
  id: string;
  name: string;
  ref: string;
  price: number;
  image: string;
  tag?: string;
  desc?: string;
  href?: string;
  /** Genre(s) auquel le vêtement est destiné. Par défaut : Unisexe. */
  genre?: ProductGenre;
};

type Props = {
  product: ProductCardData;
  sizes: string[];
  defaultSize?: string;
  childFilter?: (c: Child) => boolean;
  /** Désactive l'ajout au panier (ex: sélection en cours d'étude par l'établissement). */
  disabled?: boolean;
  /** Message affiché lorsque le produit est désactivé. */
  disabledLabel?: string;
};

export function ProductCard({ product, sizes, defaultSize, childFilter, disabled, disabledLabel }: Props) {
  const { addToCart, children } = useStore();
  const [size, setSize] = useState(defaultSize ?? sizes[0]);
  const [qty, setQty] = useState(1);
  const [childId, setChildId] = useState<string>("");

  const productGenre: ProductGenre = product.genre ?? "Unisexe";
  const genreFilter = (c: Child) => {
    if (productGenre === "Unisexe") return true;
    return c.genre === productGenre;
  };
  const combinedFilter = (c: Child) =>
    (childFilter ? childFilter(c) : true) && genreFilter(c);

  const selectedChild = children.find((c) => c.id === childId);
  const genreMismatch =
    !!selectedChild && productGenre !== "Unisexe" && selectedChild.genre !== productGenre;

  const recommendation = useMemo(() => {
    if (!selectedChild) return null;
    const reco = recommendSize({
      hauteur: selectedChild.hauteur,
      tour: selectedChild.tour,
      tour_taille: (selectedChild as any).tour_taille,
      tour_bassin: (selectedChild as any).tour_bassin,
    });
    if (!reco) return null;
    // Match recommendation row.age (e.g. "4 ans") with available sizes.
    const match = sizes.find((s) => s.trim().toLowerCase() === reco.row.age.trim().toLowerCase());
    return match ? { size: match, consistent: reco.consistent } : null;
  }, [selectedChild, sizes]);

  // Auto-select the recommended size when the child changes.
  useEffect(() => {
    if (recommendation) setSize(recommendation.size);
  }, [recommendation]);

  const handleAdd = () => {
    if (disabled) {
      toast.error(disabledLabel ?? "Ce produit n'est pas encore disponible à la commande.");
      return;
    }
    if (children.length === 0) { toast.error("Ajoutez d'abord un enfant"); return; }
    if (!childId) { toast.error("Choisissez un enfant"); return; }
    if (genreMismatch) {
      toast.error(`Ce modèle est réservé aux ${productGenre === "Fille" ? "filles" : "garçons"}.`);
      return;
    }
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
          <span className="whitespace-nowrap text-lg font-semibold text-foreground">{product.price} €</span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">Réf. {product.ref}</p>
        <div className="mt-2">
          <GenreBadge genre={productGenre} />
        </div>
        {product.desc && <p className="mt-3 text-sm leading-relaxed text-foreground/75">{product.desc}</p>}

        <div className="mt-5">
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Pour quel enfant ?</div>
          <div className="mt-2"><ChildPicker value={childId} onChange={setChildId} filter={combinedFilter} /></div>
          {genreMismatch && (
            <p className="mt-2 text-[11px] font-medium text-destructive">
              Cet enfant ne correspond pas au genre de ce modèle.
            </p>
          )}
        </div>

        <div className="mt-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Taille</div>
            {recommendation && (
              <span
                title={
                  recommendation.consistent
                    ? "Toutes les mesures concordent"
                    : "Prise sur la mesure la plus enveloppante"
                }
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold shadow-sm ring-1 ring-inset ${
                  recommendation.consistent
                    ? "bg-lime-200/70 text-lime-800 ring-lime-500 dark:bg-lime-500/20 dark:text-lime-200"
                    : "bg-emerald-100 text-emerald-800 ring-amber-400"
                }`}
              >
                <Sparkles
                  className={`h-3 w-3 ${
                    recommendation.consistent ? "text-lime-700 dark:text-lime-300" : "text-amber-600"
                  }`}
                />
                Reco&nbsp;: <span className="font-bold">{recommendation.size}</span>
              </span>
            )}
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {sizes.map((s) => (
              <button
                key={s}
                onClick={() => setSize(s)}
                className={`relative h-9 px-2 min-w-[3.5rem] rounded-md border text-xs font-medium transition-all ${
                  size === s
                    ? "border-primary bg-primary text-primary-foreground"
                    : recommendation?.size === s
                    ? "border-lime-500 bg-lime-50 text-lime-800 ring-1 ring-inset ring-lime-500 hover:bg-lime-100 dark:bg-lime-500/10 dark:text-lime-200"
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
          <button onClick={handleAdd} disabled={disabled || children.length === 0 || !childId || genreMismatch}
            className="inline-flex h-11 flex-1 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50">
            {disabled
              ? (disabledLabel ?? "Bientôt disponible")
              : children.length === 0
              ? "Ajoutez un enfant"
              : !childId
              ? "Choisir un enfant"
              : genreMismatch
              ? "Genre non compatible"
              : "Ajouter au panier"}
          </button>
        </div>
      </div>
    </article>
  );
}

function GenreBadge({ genre }: { genre: ProductGenre }) {
  const styles =
    genre === "Fille"
      ? "border-pink-300 bg-pink-50 text-pink-700"
      : genre === "Garçon"
      ? "border-sky-300 bg-sky-50 text-sky-700"
      : "border-border bg-secondary text-muted-foreground";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${styles}`}
    >
      {genre}
    </span>
  );
}