import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { HeartHandshake, Ruler } from "lucide-react";
import { ChildPicker } from "@/components/ChildPicker";
import { useStore, type Child } from "@/lib/store";
import { recommendSize, sizeRows } from "@/lib/sizeRecommendation";
import guideMesuresImg from "@/assets/guide-tailles-mesures.png";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FrenchFlag } from "@/components/FrenchFlag";
import { SizeBadge } from "@/components/SizeBadge";

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
  /** Type de produit pour ajuster la recommandation de taille (ex: "blouse" → +1). */
  productKind?: "blouse";
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
    const reco = recommendSize(
      {
        hauteur: selectedChild.hauteur,
        tour: selectedChild.tour,
        tour_taille: (selectedChild as any).tour_taille,
        tour_bassin: (selectedChild as any).tour_bassin,
      },
      product.productKind === "blouse" ? { product: "blouse" } : {},
    );
    if (!reco) return null;
    // Match recommendation row.age (e.g. "4 ans") with available sizes.
    const match = sizes.find((s) => s.trim().toLowerCase() === reco.row.age.trim().toLowerCase());
    return match ? { size: match, consistent: reco.consistent } : null;
  }, [selectedChild, sizes, product.productKind]);

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
      <div className="absolute left-3 top-3 flex flex-col items-start gap-1">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-foreground shadow-md ring-1 ring-black/5 backdrop-blur">
          <FrenchFlag className="h-2.5 w-4" />
          Fabrication française
        </span>
        {product.productKind === "blouse" && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50/95 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-emerald-800 shadow-sm ring-1 ring-emerald-700/30 backdrop-blur">
            <HeartHandshake className="h-2.5 w-2.5" /> Économie sociale &amp; solidaire
          </span>
        )}
      </div>
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
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Taille</span>
              <SizeGuideModalTrigger />
            </div>
            {recommendation && (
              <SizeBadge
                size={recommendation.size}
                variant={product.productKind === "blouse" ? "blouse" : "default"}
              />
            )}
          </div>
          {recommendation && (
            <p className="mt-1 text-[10px] italic text-muted-foreground">
              {product.productKind === "blouse"
                ? "Pour la blouse livrée à la rentrée de Septembre 2025, nous recommandons explicitement une taille au-dessus."
                : "Recommandation pour une 1ʳᵉ couche (t-shirt, polo, chemise)."}
            </p>
          )}
          <div className="mt-2 flex flex-wrap gap-1.5">
            {sizes.map((s) => (
              <button
                key={s}
                onClick={() => setSize(s)}
                className={`relative h-9 px-2 min-w-[3.5rem] rounded-md border text-xs font-medium transition-all ${
                  size === s
                    ? "border-primary bg-primary text-primary-foreground"
                    : recommendation?.size === s
                    ? "border-emerald-700 bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-700 hover:bg-emerald-100"
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

function SizeGuideModalTrigger() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-primary hover:underline"
        >
          <Ruler className="h-3 w-3" />
          Guide des tailles
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Ruler className="h-4 w-4 text-primary" /> Guide des tailles
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-[10rem_1fr]">
          <div className="rounded-lg bg-muted/40 p-2">
            <img
              src={guideMesuresImg}
              alt="Schéma des mesures"
              className="h-auto w-full rounded-md object-contain"
              loading="lazy"
            />
          </div>
          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full border-collapse text-xs">
              <thead className="bg-muted/60 text-foreground">
                <tr>
                  <th className="w-24 whitespace-nowrap px-3 py-1.5 text-left font-semibold">Taille</th>
                  <th className="px-2 py-1.5 text-right font-semibold">1 H</th>
                  <th className="px-2 py-1.5 text-right font-semibold">2 P</th>
                  <th className="px-2 py-1.5 text-right font-semibold">3 T</th>
                  <th className="px-2 py-1.5 text-right font-semibold">4 B</th>
                </tr>
              </thead>
              <tbody>
                {sizeRows.map((r) => (
                  <tr key={r.age} className="border-t border-border odd:bg-background even:bg-muted/20">
                    <td className="whitespace-nowrap px-3 py-1 font-semibold text-foreground">{r.age}</td>
                    <td className="px-2 py-1 text-right tabular-nums text-foreground/80">{r.stature}</td>
                    <td className="px-2 py-1 text-right tabular-nums text-foreground/80">{r.poitrine}</td>
                    <td className="px-2 py-1 text-right tabular-nums text-foreground/80">{r.taille}</td>
                    <td className="px-2 py-1 text-right tabular-nums text-foreground/80">{r.bassin}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <p className="mt-3 text-[10px] leading-relaxed text-muted-foreground">
          <span className="font-semibold text-foreground">1 H</span> : hauteur ·{" "}
          <span className="font-semibold text-foreground">2 P</span> : tour de poitrine ·{" "}
          <span className="font-semibold text-foreground">3 T</span> : tour de taille ·{" "}
          <span className="font-semibold text-foreground">4 B</span> : tour de bassin (cm)
        </p>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          Pour la <strong className="text-foreground">blouse livrée à la rentrée de Septembre 2025</strong>,
          nous recommandons explicitement de prendre une <strong className="text-foreground">taille au-dessus</strong>.
        </p>
        <div className="pt-2">
          <Link to="/aide/guide-tailles" className="text-xs font-semibold text-primary hover:underline">
            Voir le guide complet →
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
}