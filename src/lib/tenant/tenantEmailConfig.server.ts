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
import { DEFAULT_EMAIL_BRAND, type EmailBrand } from "@/lib/email-templates/brand";

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
 * Phase 12 — Cache séparé pour le branding visuel des emails.
 * Lit `tenants.{name, logo_url, config.email.{header_color, accent_color, app_url, logo_alt, logo_width, footer_tagline, signature_suffix}}`.
 * Chaque champ manquant retombe sur `DEFAULT_EMAIL_BRAND` (SJC actuel).
 */
const brandCache = new Map<string, { value: EmailBrand; expiresAt: number }>();

function readBrandCache(key: string): EmailBrand | null {
  const hit = brandCache.get(key);
  if (!hit) return null;
  if (hit.expiresAt < Date.now()) {
    brandCache.delete(key);
    return null;
  }
  return hit.value;
}

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
  brandCache.clear();
}

/**
 * Résout le branding visuel email du tenant courant.
 * Toujours fail-safe : si la DB est inaccessible, retourne `DEFAULT_EMAIL_BRAND`.
 */
export async function getTenantEmailBrand(
  tenantId?: string | null,
): Promise<{ tenantId: string | null; brand: EmailBrand }> {
  let resolvedId: string | null = tenantId ?? null;

  if (!resolvedId) {
    const t = await getTenantFromRequest();
    resolvedId = t?.id ?? null;
  }

  if (!resolvedId) {
    return { tenantId: null, brand: DEFAULT_EMAIL_BRAND };
  }

  const cached = readBrandCache(resolvedId);
  if (cached) return { tenantId: resolvedId, brand: cached };

  try {
    const { data, error } = await supabaseAdmin
      .from("tenants")
      .select("name, short_name, logo_url, config")
      .eq("id", resolvedId)
      .maybeSingle();

    if (error || !data) {
      brandCache.set(resolvedId, {
        value: DEFAULT_EMAIL_BRAND,
        expiresAt: Date.now() + CACHE_TTL_MS,
      });
      return { tenantId: resolvedId, brand: DEFAULT_EMAIL_BRAND };
    }

    const emailCfg = ((data.config ?? {}) as Record<string, any>).email as
      | Record<string, any>
      | undefined;

    const siteName = pickString(
      emailCfg?.site_name ?? emailCfg?.siteName ?? data.short_name ?? data.name,
      DEFAULT_EMAIL_BRAND.siteName,
    );

    const merged: EmailBrand = {
      siteName,
      logoUrl: pickString(
        emailCfg?.logo_url ?? emailCfg?.logoUrl ?? data.logo_url,
        DEFAULT_EMAIL_BRAND.logoUrl,
      ),
      logoWidth:
        typeof emailCfg?.logo_width === "number"
          ? emailCfg.logo_width
          : DEFAULT_EMAIL_BRAND.logoWidth,
      logoAlt: pickString(emailCfg?.logo_alt ?? siteName, DEFAULT_EMAIL_BRAND.logoAlt),
      appUrl: pickString(emailCfg?.app_url ?? emailCfg?.appUrl, DEFAULT_EMAIL_BRAND.appUrl),
      headerColor: pickString(
        emailCfg?.header_color ?? emailCfg?.headerColor,
        DEFAULT_EMAIL_BRAND.headerColor,
      ),
      accentColor: pickString(
        emailCfg?.accent_color ?? emailCfg?.accentColor,
        DEFAULT_EMAIL_BRAND.accentColor,
      ),
      signatureSuffix: pickString(
        emailCfg?.signature_suffix ?? emailCfg?.signatureSuffix ?? `de ${siteName}`,
        DEFAULT_EMAIL_BRAND.signatureSuffix,
      ),
      footerTagline: pickString(
        emailCfg?.footer_tagline ?? emailCfg?.footerTagline,
        DEFAULT_EMAIL_BRAND.footerTagline,
      ),
    };

    brandCache.set(resolvedId, { value: merged, expiresAt: Date.now() + CACHE_TTL_MS });
    return { tenantId: resolvedId, brand: merged };
  } catch (e) {
    console.warn("[getTenantEmailBrand] threw, fallback default:", e);
    return { tenantId: resolvedId, brand: DEFAULT_EMAIL_BRAND };
  }
}