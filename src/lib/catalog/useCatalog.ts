/**
 * Phase 10 — Hook React (client-safe) qui retourne le catalogue à afficher.
 *
 * Comportement entièrement gouverné par `TENANT_FLAGS.ENABLE_DYNAMIC_CATALOG` :
 *   - OFF (état actuel en prod) → retourne immédiatement les `fallbackProducts`
 *     hardcodés passés en prop. Aucune requête réseau, aucun risque de
 *     régression sur Saint-Jacques.
 *   - ON → `useQuery` charge le catalogue via le serverFn `loadCatalog`
 *     scopé au tenant courant. En cas d'échec ou de réponse vide, retombe
 *     sur `fallbackProducts` (jamais d'écran vide).
 *
 * Mapping DTO → `ProductCardData` :
 *   - `image` : si la DB ne fournit pas d'`image_url`, on réutilise l'image
 *     du produit fallback de même slug (assets bundlés). Garantit que SJC
 *     continue d'afficher la bonne photo même quand le catalogue passe en DB.
 *   - `tag`, `genre`, `productKind` : conservés depuis le fallback du même
 *     slug si non exprimés en DB (ces champs UI vivent encore dans le code
 *     pour l'instant ; ils migreront vers `products.metadata` plus tard).
 */

import { useQuery } from "@tanstack/react-query";
import { TENANT_FLAGS } from "@/config/tenantFlags";
import { loadCatalog } from "@/lib/catalog.functions";
import type { ProductCardData, ProductGenre } from "@/components/ProductCard";

export type UseCatalogOptions = {
  /** Filtre par niveau scolaire (maternelle | college | lycee). Null = tous. */
  level?: string | null;
  /** Catalogue hardcodé utilisé tant que le flag est OFF ou en cas d'échec. */
  fallbackProducts: ProductCardData[];
  /** Tailles hardcodées utilisées si la DB n'en renvoie aucune. */
  fallbackSizes: string[];
};

export type UseCatalogResult = {
  products: ProductCardData[];
  sizes: string[];
  /** True si la donnée provient effectivement de la DB. Utile pour debug. */
  isDynamic: boolean;
};

export function useCatalog(opts: UseCatalogOptions): UseCatalogResult {
  const enabled = TENANT_FLAGS.ENABLE_DYNAMIC_CATALOG;

  const { data } = useQuery({
    queryKey: ["catalog", opts.level ?? "all"],
    queryFn: () => loadCatalog({ data: { level: opts.level ?? null } }),
    enabled,
    staleTime: 60_000,
  });

  if (!enabled || !data || data.products.length === 0) {
    return {
      products: opts.fallbackProducts,
      sizes: opts.fallbackSizes,
      isDynamic: false,
    };
  }

  // Index fallback par slug pour récupérer image / tag / genre / productKind
  // quand la DB ne porte pas encore ces champs UI.
  const fallbackBySlug = new Map(opts.fallbackProducts.map((p) => [p.id, p]));

  const products: ProductCardData[] = data.products.map((p) => {
    const fb = fallbackBySlug.get(p.slug);
    // DB en priorité ; fallback hardcodé si la metadata n'est pas encore renseignée.
    const genre = (p.genre ?? fb?.genre) as ProductGenre | undefined;
    const productKind =
      (p.productKind ?? fb?.productKind) === "blouse" ? "blouse" : undefined;
    return {
      id: p.slug,
      name: p.name,
      ref: p.ref,
      price: p.price,
      image: p.image ?? fb?.image ?? "",
      desc: p.description ?? fb?.desc,
      href: (p.href ?? fb?.href) as ProductCardData["href"],
      tag: p.tag ?? fb?.tag,
      genre,
      productKind,
    };
  });

  // Union triée des tailles ; fallback si vide.
  const seen = new Set<string>();
  const sizes: string[] = [];
  for (const p of data.products) {
    for (const s of p.sizes) {
      if (!seen.has(s)) {
        seen.add(s);
        sizes.push(s);
      }
    }
  }

  return {
    products,
    sizes: sizes.length > 0 ? sizes : opts.fallbackSizes,
    isDynamic: true,
  };
}