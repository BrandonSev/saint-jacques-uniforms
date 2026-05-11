import { ENABLE_HOME_DELIVERY } from "@/config/featureFlags";

export type DeliveryOption = {
  code: string;
  label: string;
  description: string | null;
};

export const PICKUP_FALLBACK: DeliveryOption = {
  code: "pickup",
  label: "Livraison à l'établissement",
  description: "Distribution assurée par l'APE à la rentrée de septembre.",
};

export const HOME_FALLBACK: DeliveryOption = {
  code: "home",
  label: "Livraison à domicile",
  description: null,
};

/**
 * Renvoie l'option par défaut affichée dans le panier en l'absence (ou avant
 * le chargement) des options en base.
 */
export function getInitialDeliveryOptions(
  homeEnabled: boolean = ENABLE_HOME_DELIVERY,
): DeliveryOption[] {
  return [homeEnabled ? HOME_FALLBACK : PICKUP_FALLBACK];
}

/**
 * Filtre les options venant de la base selon le feature flag livraison.
 * - Si la livraison à domicile n'est pas encore ouverte, on retire l'option `home`.
 * - Renvoie `null` si la liste filtrée est vide (le caller doit alors conserver
 *   son état actuel ou utiliser `getInitialDeliveryOptions`).
 */
export function filterDeliveryOptions(
  options: DeliveryOption[],
  homeEnabled: boolean = ENABLE_HOME_DELIVERY,
): DeliveryOption[] | null {
  const filtered = homeEnabled ? options : options.filter((o) => o.code !== "home");
  return filtered.length ? filtered : null;
}

/**
 * Détermine le mode initial sélectionné dans la modal de confirmation.
 * Priorité : `home` si présent, sinon `pickup` si présent, sinon `home`
 * (fallback historique conservé pour rétro-compatibilité).
 */
export function pickInitialMode(options: DeliveryOption[]): "home" | "pickup" {
  const hasHome = options.some((o) => o.code === "home");
  const hasPickup = options.some((o) => o.code === "pickup");
  if (hasHome) return "home";
  if (hasPickup) return "pickup";
  return "home";
}