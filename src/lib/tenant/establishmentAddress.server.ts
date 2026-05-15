/**
 * Adresse de l'établissement (utilisée pour le retrait sur place, la
 * facturation PayPlug et le pied d'emails). Lue depuis
 * `tenants.config.establishment_address` ; retombe sur l'adresse Saint-Jacques
 * historique si rien n'est configuré (compat mono-tenant).
 *
 * Server-only : importe `supabaseAdmin`.
 */

import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type EstablishmentAddress = {
  name: string;
  address1: string;
  city: string;
  postcode: string;
  country: string;
};

const FALLBACK_ADDRESS: EstablishmentAddress = {
  name: "Ensemble scolaire Saint-Jacques-de-Compostelle",
  address1: "Ensemble scolaire Saint-Jacques-de-Compostelle, 32 rue Paul Lahargou",
  city: "Dax",
  postcode: "40100",
  country: "FR",
};

const CACHE_TTL_MS = 60_000;
const cache = new Map<string, { value: EstablishmentAddress; expiresAt: number }>();

function readCache(key: string): EstablishmentAddress | null {
  const hit = cache.get(key);
  if (!hit) return null;
  if (hit.expiresAt < Date.now()) {
    cache.delete(key);
    return null;
  }
  return hit.value;
}

function writeCache(key: string, value: EstablishmentAddress) {
  cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
}

function parseAddress(raw: unknown): EstablishmentAddress | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const address1 = typeof r.address1 === "string" ? r.address1.trim() : "";
  const city = typeof r.city === "string" ? r.city.trim() : "";
  const postcode = typeof r.postcode === "string" ? r.postcode.trim() : "";
  const country = typeof r.country === "string" ? r.country.trim() : "FR";
  const name = typeof r.name === "string" ? r.name.trim() : "";
  if (!address1 || !city || !postcode) return null;
  return { name: name || address1, address1, city, postcode, country: country || "FR" };
}

export async function getTenantEstablishmentAddress(
  tenantId: string | null | undefined,
): Promise<EstablishmentAddress> {
  if (!tenantId) return FALLBACK_ADDRESS;
  const cached = readCache(tenantId);
  if (cached) return cached;
  try {
    const { data } = await supabaseAdmin
      .from("tenants")
      .select("config")
      .eq("id", tenantId)
      .maybeSingle();
    const parsed = parseAddress((data?.config as any)?.establishment_address);
    const value = parsed ?? FALLBACK_ADDRESS;
    writeCache(tenantId, value);
    return value;
  } catch (e) {
    console.warn("[getTenantEstablishmentAddress] failed, fallback:", e);
    return FALLBACK_ADDRESS;
  }
}

/** Utilitaire de test : vide le cache. */
export function __resetEstablishmentAddressCache() {
  cache.clear();
}
