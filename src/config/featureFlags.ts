/**
 * Feature flags de l'application.
 *
 * - Avant le 1er septembre 2025 : seule la livraison à l'établissement est proposée.
 *   L'APE distribue les commandes sur place à la rentrée.
 * - À partir du 1er septembre 2025 : la livraison à domicile devient disponible
 *   en option supplémentaire (les `delivery_options` actives en base sont alors
 *   toutes affichées).
 *
 * Pour forcer manuellement l'activation/désactivation, modifier `HOME_DELIVERY_OVERRIDE`.
 */
export const HOME_DELIVERY_AVAILABLE_FROM = new Date("2025-09-01T00:00:00+02:00");

/** `null` = comportement automatique selon la date. `true`/`false` = override manuel. */
export const HOME_DELIVERY_OVERRIDE: boolean | null = null;

export function isHomeDeliveryEnabled(now: Date = new Date()): boolean {
  if (HOME_DELIVERY_OVERRIDE !== null) return HOME_DELIVERY_OVERRIDE;
  return now.getTime() >= HOME_DELIVERY_AVAILABLE_FROM.getTime();
}

export const ENABLE_HOME_DELIVERY = isHomeDeliveryEnabled();