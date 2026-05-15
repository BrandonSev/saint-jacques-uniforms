import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { TENANT_FLAGS } from "@/config/tenantFlags";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { getTenantFromRequest } from "@/lib/tenant/getTenantFromRequest.server";

/**
 * Vérifie le code établissement transmis par les familles à l'inscription.
 *
 * Étape 6 — Multi-tenant :
 *   - Quand `ENABLE_TENANT_RESOLUTION` est ON, on lit le code attendu
 *     dans `tenants.legacy_code_etablissement` du tenant résolu via Host.
 *   - Sinon (mode mono-tenant historique), on retombe sur le secret
 *     `ESTABLISHMENT_CODE` — comportement identique à la production
 *     actuelle de Saint-Jacques-de-Compostelle.
 */
export const verifyEstablishmentCode = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        code: z.string().trim().min(1, "Code requis").max(64),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const submitted = data.code.trim().toLowerCase();
    let expected: string | null | undefined;

    if (TENANT_FLAGS.ENABLE_TENANT_RESOLUTION) {
      try {
        const resolved = await getTenantFromRequest();
        if (resolved) {
          const { data: row } = await supabaseAdmin
            .from("tenants")
            .select("legacy_code_etablissement")
            .eq("id", resolved.id)
            .maybeSingle();
          expected = row?.legacy_code_etablissement ?? null;
        }
      } catch (err) {
        console.warn("[verifyEstablishmentCode] tenant lookup failed:", err);
      }
    }

    // Fallback systématique sur le secret env (mono-tenant historique
    // ou tenant sans code en base).
    if (!expected) expected = process.env.ESTABLISHMENT_CODE;

    if (!expected) {
      return { valid: false, reason: "not_configured" as const };
    }
    const valid = submitted === expected.trim().toLowerCase();
    return { valid, reason: valid ? null : ("invalid" as const) };
  });