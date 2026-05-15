/**
 * Phase 8 — Server function : retourne le contexte tenant complet
 * (identité + config + theme CSS) pour la requête HTTP courante.
 *
 * Cette fonction est appelée par le loader racine (`src/routes/__root.tsx`)
 * afin d'hydrater le `TenantProvider`. Comportement :
 *
 *   - tente `getTenantFromRequest()` (résolution Host -> tenant_domains) ;
 *     en mono-tenant ce path renvoie déjà saint-jacques.
 *   - lit `tenants` (config, logo, name, short_name, theme_tokens) via
 *     `supabaseAdmin` (lecture publique, pas de PII).
 *   - sérialise les `theme_tokens` en CSS uniquement si
 *     `ENABLE_DYNAMIC_THEME = true` (sinon `themeCss = null`).
 *   - en cas d'erreur, retourne le FALLBACK_TENANT pour ne jamais bloquer
 *     le rendu.
 */

import { createServerFn } from "@tanstack/react-start";
import { TENANT_FLAGS } from "@/config/tenantFlags";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { getTenantFromRequest } from "@/lib/tenant/getTenantFromRequest.server";
import { buildThemeCss } from "@/lib/tenant/themeTokens";
import {
  FALLBACK_TENANT,
  type TenantConfig,
  type TenantContext,
} from "@/lib/tenant/types";

type TenantContextResult = {
  tenant: TenantContext;
  themeCss: string | null;
};

const CACHE_TTL_MS = 60_000;
const cache = new Map<string, { value: TenantContextResult; expiresAt: number }>();

function readCache(key: string): TenantContextResult | null {
  const hit = cache.get(key);
  if (!hit) return null;
  if (hit.expiresAt < Date.now()) {
    cache.delete(key);
    return null;
  }
  return hit.value;
}

function writeCache(key: string, value: TenantContextResult) {
  cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
}

function fallbackResult(): TenantContextResult {
  return { tenant: FALLBACK_TENANT, themeCss: null };
}

export const loadTenantContext = createServerFn({ method: "GET" }).handler(
  async (): Promise<TenantContextResult> => {
    const resolved = await getTenantFromRequest();
    if (!resolved) return fallbackResult();

    const cacheKey = `ctx:${resolved.id}`;
    const cached = readCache(cacheKey);
    if (cached) return cached;

    try {
      const { data, error } = await supabaseAdmin
        .from("tenants")
        .select("id, slug, name, short_name, status, logo_url, config, theme_tokens")
        .eq("id", resolved.id)
        .maybeSingle();

      if (error || !data) {
        const result = fallbackResult();
        writeCache(cacheKey, result);
        return result;
      }

      const tenant: TenantContext = {
        id: data.id,
        slug: data.slug,
        name: data.name,
        shortName: data.short_name ?? null,
        logoUrl: data.logo_url ?? null,
        status: data.status,
        config: (data.config ?? {}) as TenantConfig,
      };

      const themeCss = TENANT_FLAGS.ENABLE_DYNAMIC_THEME
        ? buildThemeCss(
            (data.theme_tokens ?? null) as Record<string, unknown> | null,
          )
        : null;

      const result: TenantContextResult = { tenant, themeCss };
      writeCache(cacheKey, result);
      return result;
    } catch (e) {
      console.warn("[loadTenantContext] failed, fallback:", e);
      return fallbackResult();
    }
  },
);

/** Utilitaire de test : vide le cache. */
export function __resetTenantContextCache() {
  cache.clear();
}