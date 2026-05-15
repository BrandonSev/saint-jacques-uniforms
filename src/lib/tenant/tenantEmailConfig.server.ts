/**
 * Phase 9 — Résolution serveur de la configuration email du tenant courant.
 *
 * Lit `tenants.config.email` (jsonb) et complète chaque champ manquant avec
 * les valeurs par défaut SJC (DEFAULT_EMAIL_CONFIG). Le résultat est donc
 * TOUJOURS valide : on ne peut pas envoyer un email avec un from vide.
 *
 * Tant que TENANT_FLAGS.ENABLE_TENANT_EMAIL_CONFIG = false, le code appelant
 * doit court-circuiter ce helper et utiliser DEFAULT_EMAIL_CONFIG directement,
 * pour garantir 0 régression de deliverability.
 *
 * Cache : 60s par tenant.id, identique aux autres helpers Phase 5/6/7.
 */

import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { getTenantFromRequest } from "./getTenantFromRequest.server";

export type TenantEmailConfig = {
  /** Nom affiché dans le From: ex. "France Uniformes". */
  siteName: string;
  /** Domaine du From: ex. "franceuniformes.fr". */
  fromDomain: string;
  /** Local-part du From: ex. "info". */
  fromLocalpart: string;
  /** Adresse Reply-To. */
  replyTo: string;
  /** Sous-domaine vérifié pour l'envoi (DKIM/SPF). */
  senderDomain: string;
  /** Optionnel : signature texte ajoutée par les templates. */
  signature?: string;
};

/**
 * Defaults SJC — strictement identiques aux constantes historiques de
 * src/routes/lovable/email/transactional/send.ts. Ne pas modifier sans
 * coordonner avec la production SJC.
 */
export const DEFAULT_EMAIL_CONFIG: TenantEmailConfig = {
  siteName: "France Uniformes",
  fromDomain: "franceuniformes.fr",
  fromLocalpart: "info",
  replyTo: "boutique@franceuniformes.fr",
  senderDomain: "notify.franceuniformes.fr",
};

const CACHE_TTL_MS = 60_000;
const cache = new Map<string, { value: TenantEmailConfig; expiresAt: number }>();

function readCache(key: string): TenantEmailConfig | null {
  const hit = cache.get(key);
  if (!hit) return null;
  if (hit.expiresAt < Date.now()) {
    cache.delete(key);
    return null;
  }
  return hit.value;
}

function pickString(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim().length > 0 ? value : fallback;
}

function pickOptionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
}

/**
 * Résout la config email pour le tenant courant.
 *
 * @param tenantId optionnel — si fourni, court-circuite getTenantFromRequest
 *                (utile pour le worker de queue qui lit tenant_id dans le payload).
 */
export async function getTenantEmailConfig(
  tenantId?: string | null,
): Promise<{ tenantId: string | null; config: TenantEmailConfig }> {
  let resolvedId: string | null = tenantId ?? null;

  if (!resolvedId) {
    const t = await getTenantFromRequest();
    resolvedId = t?.id ?? null;
  }

  if (!resolvedId) {
    return { tenantId: null, config: DEFAULT_EMAIL_CONFIG };
  }

  const cached = readCache(resolvedId);
  if (cached) return { tenantId: resolvedId, config: cached };

  try {
    const { data, error } = await supabaseAdmin
      .from("tenants")
      .select("config")
      .eq("id", resolvedId)
      .maybeSingle();

    if (error || !data) {
      console.warn("[getTenantEmailConfig] DB miss, fallback default:", error?.message);
      cache.set(resolvedId, { value: DEFAULT_EMAIL_CONFIG, expiresAt: Date.now() + CACHE_TTL_MS });
      return { tenantId: resolvedId, config: DEFAULT_EMAIL_CONFIG };
    }

    const raw = ((data.config ?? {}) as Record<string, unknown>).email as
      | Record<string, unknown>
      | undefined;

    const merged: TenantEmailConfig = {
      siteName: pickString(raw?.site_name ?? raw?.siteName, DEFAULT_EMAIL_CONFIG.siteName),
      fromDomain: pickString(raw?.from_domain ?? raw?.fromDomain, DEFAULT_EMAIL_CONFIG.fromDomain),
      fromLocalpart: pickString(
        raw?.from_localpart ?? raw?.fromLocalpart,
        DEFAULT_EMAIL_CONFIG.fromLocalpart,
      ),
      replyTo: pickString(raw?.reply_to ?? raw?.replyTo, DEFAULT_EMAIL_CONFIG.replyTo),
      senderDomain: pickString(
        raw?.sender_domain ?? raw?.senderDomain,
        DEFAULT_EMAIL_CONFIG.senderDomain,
      ),
      signature: pickOptionalString(raw?.signature),
    };

    cache.set(resolvedId, { value: merged, expiresAt: Date.now() + CACHE_TTL_MS });
    return { tenantId: resolvedId, config: merged };
  } catch (e) {
    console.warn("[getTenantEmailConfig] threw, fallback default:", e);
    return { tenantId: resolvedId, config: DEFAULT_EMAIL_CONFIG };
  }
}

/** Utilitaire de test : vide le cache. */
export function __resetTenantEmailConfigCache() {
  cache.clear();
}