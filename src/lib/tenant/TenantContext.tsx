/**
 * Phase 8 — Provider React exposant le tenant courant à l'arbre de
 * composants via `useTenant()`.
 *
 * Hydraté côté SSR par `loadTenantContext` (loader racine). Tant qu'aucun
 * composant ne consomme `useTenant()`, ce provider est inerte côté
 * production : il existe juste pour préparer le terrain de la migration
 * progressive du `SiteHeader`/`SiteFooter`/`PageWatermark` vers le tenant
 * dynamique.
 */

import { createContext, useContext, type ReactNode } from "react";
import { FALLBACK_TENANT, type TenantContext as TenantContextValue } from "./types";

const TenantReactContext = createContext<TenantContextValue>(FALLBACK_TENANT);

export function TenantProvider({
  tenant,
  children,
}: {
  tenant: TenantContextValue | null | undefined;
  children: ReactNode;
}) {
  return (
    <TenantReactContext.Provider value={tenant ?? FALLBACK_TENANT}>
      {children}
    </TenantReactContext.Provider>
  );
}

/**
 * Renvoie le tenant courant (jamais `null` — fallback statique sinon).
 * Sûr à appeler dans tout composant React, server ou client.
 */
export function useTenant(): TenantContextValue {
  return useContext(TenantReactContext);
}