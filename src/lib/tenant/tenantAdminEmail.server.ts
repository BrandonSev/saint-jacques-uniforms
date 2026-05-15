/**
 * Résolution de l'email de notification admin pour un tenant donné.
 *
 * Lecture (par ordre) :
 *   1. tenants.config.adminEmail (par tenant)
 *   2. env ADMIN_NOTIFICATION_EMAIL (fallback global historique)
 *   3. env SMTP_USER (dernier fallback historique)
 *
 * Server-only : importe supabaseAdmin.
 */

import { supabaseAdmin } from "@/integrations/supabase/client.server";

const CACHE_TTL_MS = 60_000;
const cache = new Map<string, { value: string | null; expiresAt: number }>();

function readCache(key: string): { value: string | null } | null {
  const hit = cache.get(key);
  if (!hit) return null;
  if (hit.expiresAt < Date.now()) {
    cache.delete(key);
    return null;
  }
  return { value: hit.value };
}

function writeCache(key: string, value: string | null) {
  cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
}

export async function getTenantAdminEmail(
  tenantId: string | null | undefined,
): Promise<string | undefined> {
  const envFallback = process.env.ADMIN_NOTIFICATION_EMAIL || process.env.SMTP_USER;
  if (!tenantId) return envFallback || undefined;

  const cached = readCache(tenantId);
  let tenantAdmin: string | null = cached?.value ?? null;
  if (!cached) {
    try {
      const { data } = await supabaseAdmin
        .from("tenants")
        .select("config")
        .eq("id", tenantId)
        .maybeSingle();
      const raw = (data?.config as any)?.adminEmail;
      tenantAdmin = typeof raw === "string" && raw.trim() ? raw.trim() : null;
      writeCache(tenantId, tenantAdmin);
    } catch (e) {
      console.warn("[getTenantAdminEmail] lookup failed:", e);
      writeCache(tenantId, null);
    }
  }

  return tenantAdmin || envFallback || undefined;
}

export function __resetTenantAdminEmailCache() {
  cache.clear();
}
