/**
 * Onboarding CLI : crée un nouveau tenant et son domaine principal.
 *
 * Usage :
 *   bun run scripts/seed-new-tenant.ts \
 *     --slug=sjdc-dax \
 *     --name="Saint-Jacques-de-Compostelle Dax" \
 *     --short="SJDC Dax" \
 *     --domain=sjdc-dax.franceuniformes.fr \
 *     [--admin-email=admin@example.com] \
 *     [--levels=maternelle,college,lycee] \
 *     [--code=CODE_INSCRIPTION] \
 *     [--clone-from=saint-jacques]
 *
 * Variables d'environnement requises :
 *   SUPABASE_URL ou VITE_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Idempotent : si le slug existe déjà, on log et on sort en code 0.
 */

import { createClient } from "@supabase/supabase-js";

type Args = Record<string, string>;

function parseArgs(argv: string[]): Args {
  const out: Args = {};
  for (const a of argv.slice(2)) {
    const m = a.match(/^--([^=]+)=(.*)$/);
    if (!m) continue;
    out[m[1]] = m[2];
  }
  return out;
}

function required(args: Args, key: string): string {
  const v = args[key];
  if (!v || !v.trim()) {
    console.error(`Missing required arg --${key}=`);
    process.exit(1);
  }
  return v.trim();
}

async function main() {
  const args = parseArgs(process.argv);
  const slug = required(args, "slug");
  const name = required(args, "name");
  const domain = required(args, "domain");
  const shortName = args.short?.trim() || null;
  const adminEmail = args["admin-email"]?.trim() || null;
  const code = args.code?.trim() || null;
  const levels = (args.levels?.trim() || "maternelle,college,lycee")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const cloneFromSlug = args["clone-from"]?.trim() || null;

  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.error("Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in env");
    process.exit(1);
  }
  const sb = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // 1. Idempotence : on récupère ou crée le tenant
  const { data: existing } = await sb
    .from("tenants")
    .select("id, slug")
    .eq("slug", slug)
    .maybeSingle();

  let tenantId: string;
  if (existing) {
    tenantId = existing.id;
    console.log(`[seed] tenant '${slug}' already exists (${tenantId})`);
  } else {
    const config: Record<string, unknown> = {
      levels,
      apel_enabled: false,
      home_delivery_enabled: false,
    };
    if (adminEmail) config.adminEmail = adminEmail;

    const { data: clone, error: cloneErr } = cloneFromSlug
      ? await sb
          .from("tenants")
          .select("config, theme_tokens")
          .eq("slug", cloneFromSlug)
          .maybeSingle()
      : { data: null, error: null };
    if (cloneFromSlug && cloneErr) {
      console.warn(`[seed] clone-from '${cloneFromSlug}' lookup failed:`, cloneErr.message);
    }
    const mergedConfig = clone?.config
      ? { ...(clone.config as object), ...config }
      : config;
    const themeTokens = clone?.theme_tokens ?? {};

    const { data: created, error: insertErr } = await sb
      .from("tenants")
      .insert({
        slug,
        name,
        short_name: shortName,
        status: "active",
        config: mergedConfig,
        theme_tokens: themeTokens,
        legacy_code_etablissement: code,
      })
      .select("id")
      .single();
    if (insertErr || !created) {
      console.error("[seed] tenant insert failed:", insertErr?.message);
      process.exit(1);
    }
    tenantId = created.id;
    console.log(`[seed] tenant '${slug}' created (${tenantId})`);
  }

  // 2. Domaine principal (idempotent)
  const { data: existingDomain } = await sb
    .from("tenant_domains")
    .select("id, tenant_id, is_primary")
    .eq("hostname", domain)
    .maybeSingle();

  if (existingDomain) {
    if (existingDomain.tenant_id !== tenantId) {
      console.error(
        `[seed] domain '${domain}' is already attached to a different tenant (${existingDomain.tenant_id})`,
      );
      process.exit(1);
    }
    console.log(`[seed] domain '${domain}' already attached`);
  } else {
    const { error: domErr } = await sb.from("tenant_domains").insert({
      tenant_id: tenantId,
      hostname: domain.toLowerCase(),
      is_primary: true,
    });
    if (domErr) {
      console.error("[seed] domain insert failed:", domErr.message);
      process.exit(1);
    }
    console.log(`[seed] domain '${domain}' attached as primary`);
  }

  console.log("[seed] done.");
  console.log(`  tenant_id : ${tenantId}`);
  console.log(`  slug      : ${slug}`);
  console.log(`  domain    : ${domain}`);
  console.log("");
  console.log("Étapes restantes :");
  console.log("  1. DNS : pointer le domaine vers l'app (CNAME / A record)");
  console.log("  2. Coolify / hébergeur : ajouter le domaine custom");
  console.log("  3. Premier admin : supabase invite + INSERT user_roles role='admin'");
  console.log("  4. Catalogue : copier les produits depuis le tenant template (Phase 4 catalogue DB)");
}

main().catch((e) => {
  console.error("[seed] fatal:", e);
  process.exit(1);
});
