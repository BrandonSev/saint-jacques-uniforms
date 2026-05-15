/**
 * Phase 5 — Résolution serveur du tenant à partir du Host HTTP.
 *
 * Tant que TENANT_FLAGS.ENABLE_TENANT_RESOLUTION = false, ce module n'est
 * appelé par aucun chemin de production. Il est livré prêt à brancher,
 * avec un fallback systématique sur DEFAULT_TENANT_SLUG (saint-jacques)
 * pour garantir qu'aucun visiteur ne tombe sur un écran blanc en cas
 * d'erreur de résolution.
 */

import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { DEFAULT_TENANT_SLUG, TENANT_FLAGS } from "@/config/tenantFlags";

export type ResolvedTenant = {
  id: string;
  slug: string;
  name: string;
  status: string;
};

type CacheEntry = { value: ResolvedTenant; expiresAt: number };

const CACHE_TTL_MS = 60_000;
const cache = new Map<string, CacheEntry>();

function readCache(key: string): ResolvedTenant | null {
  const hit = cache.get(key);
  if (!hit) return null;
  if (hit.expiresAt < Date.now()) {
    cache.delete(key);
    return null;
  }
  return hit.value;
}

function writeCache(key: string, value: ResolvedTenant) {
  cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
}

function normalizeHost(host: string | null | undefined): string {
  if (!host) return "";
  // Strip port + lowercase ; supprime un éventuel "www." en tête
  const noPort = host.split(":")[0]!.toLowerCase().trim();
  return noPort.startsWith("www.") ? noPort.slice(4) : noPort;
}

async function fetchDefaultTenant(): Promise<ResolvedTenant | null> {
  const cached = readCache(`__slug__:${DEFAULT_TENANT_SLUG}`);
  if (cached) return cached;
  const { data, error } = await supabaseAdmin
    .from("tenants")
    .select("id, slug, name, status")
    .eq("slug", DEFAULT_TENANT_SLUG)
    .maybeSingle();
  if (error || !data) return null;
  writeCache(`__slug__:${DEFAULT_TENANT_SLUG}`, data as ResolvedTenant);
  return data as ResolvedTenant;
}

/**
 * Résout un tenant à partir du Host HTTP en consultant `tenant_domains`,
 * puis fallback sur le tenant par défaut. Toujours non-throw : retourne
 * le tenant par défaut en cas d'erreur réseau / DB.
 */
export async function resolveTenantFromHost(
  rawHost: string | null | undefined,
): Promise<ResolvedTenant | null> {
  // Drapeau OFF : tout le monde tombe sur le tenant par défaut, sans
  // requête DB sur la résolution (la DB est consultée 1× pour récupérer
  // l'id, puis cachée 60s).
  if (!TENANT_FLAGS.ENABLE_TENANT_RESOLUTION) {
    return fetchDefaultTenant();
  }

  const host = normalizeHost(rawHost);
  if (!host) return fetchDefaultTenant();

  const cached = readCache(host);
  if (cached) return cached;

  try {
    const { data, error } = await supabaseAdmin
      .from("tenant_domains")
      .select("tenant:tenants!inner(id, slug, name, status)")
      .eq("hostname", host)
      .maybeSingle();
    if (error) {
      console.warn("[resolveTenantFromHost] DB error, falling back:", error.message);
      return fetchDefaultTenant();
    }
    const tenant = (data as any)?.tenant as ResolvedTenant | undefined;
    if (!tenant || tenant.status !== "active") {
      return fetchDefaultTenant();
    }
    writeCache(host, tenant);
    return tenant;
  } catch (e) {
    console.warn("[resolveTenantFromHost] threw, falling back:", e);
    return fetchDefaultTenant();
  }
}

/** Utilitaire de test : vide le cache LRU. */
export function __resetTenantCache() {
  cache.clear();
}