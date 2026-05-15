/**
 * Phase 7 — Modèle de catalogue produits (source de vérité applicative).
 *
 * Ce shape est partagé entre :
 *   - le catalogue statique (src/data/catalog.ts), utilisé tant que
 *     ENABLE_DYNAMIC_CATALOG = false ;
 *   - le loader DB (tables `products` + `product_sizes`), utilisé quand
 *     le flag est ON.
 */

export type CatalogSize = {
  label: string;
  sortOrder: number;
};

export type CatalogProduct = {
  /** Identifiant stable (slug) — utilisé en clé d'URL et de panier. */
  slug: string;
  name: string;
  ref: string | null;
  basePrice: number;
  level: string | null;
  imageUrl: string | null;
  description: string | null;
  sizes: CatalogSize[];
  /** Métadonnées libres (ex. variantes, étiquettes). */
  metadata: Record<string, unknown>;
};

export type Catalog = {
  source: "static" | "database";
  tenantSlug: string | null;
  products: CatalogProduct[];
};

export function findProductBySlug(catalog: Catalog, slug: string): CatalogProduct | null {
  return catalog.products.find((p) => p.slug === slug) ?? null;
}