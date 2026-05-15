/**
 * Phase 7 — Server function : retourne le catalogue produits du tenant courant.
 *
 * - Tant que TENANT_FLAGS.ENABLE_DYNAMIC_CATALOG = false, renvoie le catalogue
 *   statique (`src/data/catalog.ts`) sans aucune requête DB.
 * - Une fois le flag ON, lit `products` + `product_sizes` filtrés sur le tenant
 *   courant et reconstruit la structure `Catalog`.
 */

import { createServerFn } from "@tanstack/react-start";
import { TENANT_FLAGS } from "@/config/tenantFlags";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { getTenantFromRequest } from "@/lib/tenant/getTenantFromRequest.server";
import { STATIC_CATALOG } from "@/data/catalog";
import type { Catalog, CatalogProduct } from "@/lib/catalog/types";

const CACHE_TTL_MS = 60_000;
const cache = new Map<string, { value: Catalog; expiresAt: number }>();

function readCache(key: string): Catalog | null {
  const hit = cache.get(key);
  if (!hit) return null;
  if (hit.expiresAt < Date.now()) {
    cache.delete(key);
    return null;
  }
  return hit.value;
}

function writeCache(key: string, value: Catalog) {
  cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
}

export const getCatalog = createServerFn({ method: "GET" }).handler(
  async (): Promise<Catalog> => {
    if (!TENANT_FLAGS.ENABLE_DYNAMIC_CATALOG) {
      return STATIC_CATALOG;
    }

    const tenant = await getTenantFromRequest();
    if (!tenant) return STATIC_CATALOG;

    const cacheKey = `catalog:${tenant.id}`;
    const cached = readCache(cacheKey);
    if (cached) return cached;

    try {
      const { data: products, error } = await supabaseAdmin
        .from("products")
        .select(
          "id, slug, name, ref, base_price, level, image_url, description, metadata, sort_order, product_sizes(label, sort_order, active)",
        )
        .eq("tenant_id", tenant.id)
        .eq("active", true)
        .order("sort_order", { ascending: true });

      if (error || !products) {
        console.warn("[getCatalog] DB error, fallback static:", error?.message);
        return STATIC_CATALOG;
      }

      const mapped: CatalogProduct[] = products.map((p: any) => ({
        slug: p.slug,
        name: p.name,
        ref: p.ref ?? null,
        basePrice: Number(p.base_price ?? 0),
        level: p.level ?? null,
        imageUrl: p.image_url ?? null,
        description: p.description ?? null,
        metadata: (p.metadata ?? {}) as Record<string, unknown>,
        sizes: ((p.product_sizes ?? []) as Array<{ label: string; sort_order: number; active: boolean }>)
          .filter((s) => s.active)
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((s) => ({ label: s.label, sortOrder: s.sort_order })),
      }));

      const result: Catalog = {
        source: "database",
        tenantSlug: tenant.slug,
        products: mapped,
      };
      writeCache(cacheKey, result);
      return result;
    } catch (e) {
      console.warn("[getCatalog] threw, fallback static:", e);
      return STATIC_CATALOG;
    }
  },
);

/** Utilitaire de test : vide le cache. */
export function __resetCatalogCache() {
  cache.clear();
}