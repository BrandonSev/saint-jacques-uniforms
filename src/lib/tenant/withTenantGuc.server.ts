/**
 * Phase 5 — Injection du tenant courant dans la session Postgres via le
 * GUC `app.tenant_id`. Lue ensuite par `public.current_tenant_id()` (cf.
 * migration Phase 3) qui alimente automatiquement `tenant_id` sur les
 * INSERT métier via le trigger `set_tenant_id`.
 *
 * Tant que TENANT_FLAGS.ENABLE_TENANT_RESOLUTION = false, les server fns
 * existantes ne passent pas par ce helper : la valeur écrite reste celle
 * du fallback `saint-jacques` côté SQL, ce qui équivaut au comportement
 * actuel de production.
 *
 * NB : Supabase / PostgREST n'expose pas `SET LOCAL` au-travers de
 * `supabase-js` ; on encapsule donc l'appel via une RPC SECURITY DEFINER
 * dédiée (voir migration `set_request_tenant`). Ce module est isomorphe
 * (server only) et ne doit pas être importé côté client.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Positionne `app.tenant_id` sur la session Postgres en cours pour un
 * client Supabase donné. À appeler en début de handler avant toute
 * lecture/écriture qui doit être attribuée au tenant courant.
 */
export async function setRequestTenant(
  client: SupabaseClient,
  tenantId: string | null,
): Promise<void> {
  if (!tenantId) return;
  const { error } = await client.rpc("set_request_tenant", {
    _tenant_id: tenantId,
  });
  if (error) {
    console.warn("[setRequestTenant] failed:", error.message);
  }
}