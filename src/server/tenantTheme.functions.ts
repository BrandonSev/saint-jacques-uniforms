/**
 * Phase 6 — Server function : charge les theme_tokens du tenant courant
 * et retourne un bloc CSS prêt à injecter dans `<head>`.
 *
 * Tant que `TENANT_FLAGS.ENABLE_DYNAMIC_THEME = false`, la fonction
 * court-circuite en retournant `{ css: null }` sans aucune requête DB.
 */

import { createServerFn } from "@tanstack/react-start";
import { TENANT_FLAGS } from "@/config/tenantFlags";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { getTenantFromRequest } from "@/lib/tenant/getTenantFromRequest.server";
import { buildThemeCss } from "@/lib/tenant/themeTokens";

type TenantThemeResult = {
  css: string | null;
  tenantId: string | null;
  tenantSlug: string | null;
};

// Cache mémoire (60s) — partagé entre requêtes au sein du même worker.
const CACHE_TTL_MS = 60_000;
const cache = new Map<string, { value: TenantThemeResult; expiresAt: number }>();

function readCache(key: string): TenantThemeResult | null {
  const hit = cache.get(key);
  if (!hit) return null;
  if (hit.expiresAt < Date.now()) {
    cache.delete(key);
    return null;
  }
  return hit.value;
}

function writeCache(key: string, value: TenantThemeResult) {
  cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
}

export const loadTenantTheme = createServerFn({ method: "GET" }).handler(
  async (): Promise<TenantThemeResult> => {
    if (!TENANT_FLAGS.ENABLE_DYNAMIC_THEME) {
      return { css: null, tenantId: null, tenantSlug: null };
    }

    const tenant = await getTenantFromRequest();
    if (!tenant) {
      return { css: null, tenantId: null, tenantSlug: null };
    }

    const cacheKey = `theme:${tenant.id}`;
    const cached = readCache(cacheKey);
    if (cached) return cached;

    try {
      const { data, error } = await supabaseAdmin
        .from("tenants")
        .select("theme_tokens")
        .eq("id", tenant.id)
        .maybeSingle();

      if (error || !data) {
        const empty: TenantThemeResult = {
          css: null,
          tenantId: tenant.id,
          tenantSlug: tenant.slug,
        };
        writeCache(cacheKey, empty);
        return empty;
      }

      const css = buildThemeCss(
        (data.theme_tokens ?? null) as Record<string, unknown> | null,
      );
      const result: TenantThemeResult = {
        css,
        tenantId: tenant.id,
        tenantSlug: tenant.slug,
      };
      writeCache(cacheKey, result);
      return result;
    } catch (e) {
      console.warn("[loadTenantTheme] failed, falling back to static theme:", e);
      return { css: null, tenantId: tenant.id, tenantSlug: tenant.slug };
    }
  },
);

/** Utilitaire de test : vide le cache. */
export function __resetTenantThemeCache() {
  cache.clear();
}