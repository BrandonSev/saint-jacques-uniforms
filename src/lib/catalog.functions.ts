/**
 * Phase 10 — Server function : charge le catalogue produits du tenant courant
 * depuis la table `products` (+ `product_sizes`).
 *
 * Ce module est volontairement minimal : il contient UNIQUEMENT la déclaration
 * `createServerFn` + ses imports, comme l'exige la règle d'isolation client/
 * server (le fichier importe `client.server` qui ne doit jamais leak côté
 * client). Le hook `useCatalog` (client-safe) consomme ce DTO.
 *
 * Comportement :
 *   - Tant que `ENABLE_DYNAMIC_CATALOG = false`, ce serverFn n'est appelé
 *     par aucun chemin de production (le hook court-circuite l'appel).
 *   - En cas d'erreur DB, retourne `{ products: [] }` afin que le hook
 *     retombe sur le catalogue hardcodé fourni en fallback (zéro écran blanc).
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { getTenantFromRequest } from "@/lib/tenant/getTenantFromRequest.server";

export type CatalogProductDTO = {
  /** Slug stable utilisé comme `id` côté UI (rétro-compat avec la const hardcodée). */
  id: string;
  slug: string;
  name: string;
  ref: string;
  /** Prix en euros (pas en centimes — aligné sur le shape historique `ProductCardData.price`). */
  price: number;
  /** URL d'image (storage, externe…). `null` si non définie en DB → le hook
   *  retombe sur l'image du produit fallback de même slug. */
  image: string | null;
  description: string | null;
  /** Niveau scolaire (maternelle | college | lycee | …) — null = tout niveau. */
  level: string | null;
  /** Lien vers une page produit dédiée (lu depuis `metadata.href`). */
  href: string | null;
  /** Tailles ACTIVES, triées par `sort_order`. */
  sizes: string[];
};

export const loadCatalog = createServerFn({ method: "GET" })
  .inputValidator((input: { level?: string | null } | undefined) =>
    z
      .object({ level: z.string().min(1).max(50).nullable().optional() })
      .parse(input ?? {}),
  )
  .handler(async ({ data }): Promise<{ products: CatalogProductDTO[] }> => {
    const tenant = await getTenantFromRequest();
    if (!tenant) return { products: [] };

    try {
      let query = supabaseAdmin
        .from("products")
        .select(
          "id, slug, name, ref, base_price, image_url, description, level, metadata, sort_order, product_sizes(label, sort_order, active)",
        )
        .eq("tenant_id", tenant.id)
        .eq("active", true)
        .order("sort_order", { ascending: true });

      if (data.level) query = query.eq("level", data.level);

      const { data: rows, error } = await query;
      if (error || !rows) {
        console.warn("[loadCatalog] DB error, returning empty:", error?.message);
        return { products: [] };
      }

      const products: CatalogProductDTO[] = rows.map((row: any) => {
        const meta = (row.metadata ?? {}) as Record<string, unknown>;
        const sizesRaw = (row.product_sizes ?? []) as Array<{
          label: string;
          sort_order: number;
          active: boolean;
        }>;
        const sizes = sizesRaw
          .filter((s) => s.active)
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((s) => s.label);
        return {
          id: row.slug,
          slug: row.slug,
          name: row.name,
          ref: row.ref ?? "",
          price: Number(row.base_price),
          image: row.image_url ?? null,
          description: row.description ?? null,
          level: row.level ?? null,
          href: typeof meta.href === "string" ? (meta.href as string) : null,
          sizes,
        };
      });

      return { products };
    } catch (e) {
      console.warn("[loadCatalog] threw, returning empty:", e);
      return { products: [] };
    }
  });