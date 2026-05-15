/**
 * Phase 5 — Helper serveur pour obtenir le tenant courant à partir de la
 * requête HTTP TanStack en cours.
 *
 * À utiliser à l'intérieur d'un createServerFn ou d'un server route.
 * Hors d'un contexte requête, retourne directement le tenant par défaut.
 */

import { getRequestHost } from "@tanstack/react-start/server";
import {
  resolveTenantFromHost,
  type ResolvedTenant,
} from "./resolveTenant.server";

export async function getTenantFromRequest(): Promise<ResolvedTenant | null> {
  let host: string | null = null;
  try {
    host = getRequestHost();
  } catch {
    // Hors contexte requête (CLI, tests) — on laisse host=null pour fallback.
    host = null;
  }
  return resolveTenantFromHost(host);
}