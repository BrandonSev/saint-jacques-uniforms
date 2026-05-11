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

/**
 * `null` = comportement automatique selon la date.
 * `true`/`false` = override manuel (prioritaire sur la date).
 *
 * Phase actuelle : livraison **uniquement** à l'établissement, distribuée par
 * l'APE à la rentrée. On force donc `false` en attendant la décision officielle
 * d'ouvrir la livraison à domicile (passer la valeur à `null` pour revenir au
 * basculement automatique au 01/09/2025).
 */
export const HOME_DELIVERY_OVERRIDE: boolean | null = false;

export function isHomeDeliveryEnabled(
  now: Date = new Date(),
  override: boolean | null = HOME_DELIVERY_OVERRIDE,
): boolean {
  if (override !== null) return override;
  return now.getTime() >= HOME_DELIVERY_AVAILABLE_FROM.getTime();
}

export const ENABLE_HOME_DELIVERY = isHomeDeliveryEnabled();