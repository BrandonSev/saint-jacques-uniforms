// Transporteurs gérés + génération du lien de suivi public.
// Utilisé côté admin (formulaire d'expédition), côté famille (page commandes)
// et dans l'email de changement de statut.

export const CARRIERS = ["Colissimo", "Chronopost"] as const;
export type Carrier = (typeof CARRIERS)[number];

/**
 * Construit l'URL de suivi public à partir du transporteur et du numéro.
 * Renvoie null si le transporteur n'est pas géré (numéro affiché en texte seul).
 */
export function trackingUrl(carrier?: string | null, number?: string | null): string | null {
  if (!carrier || !number) return null;
  const n = encodeURIComponent(number.trim());
  if (!n) return null;
  switch (carrier.trim().toLowerCase()) {
    case "colissimo":
      return `https://www.laposte.fr/outils/suivre-vos-envois?code=${n}`;
    case "chronopost":
      return `https://www.chronopost.fr/tracking-no-cms/suivi-page?listeNumerosLES=${n}&langue=fr`;
    default:
      return null;
  }
}

/** Empreinte courte et ASCII-safe d'une chaîne, pour la clé d'idempotence email. */
export function shortHash(input: string): string {
  let h = 5381;
  for (let i = 0; i < input.length; i++) {
    h = (h * 33) ^ input.charCodeAt(i);
  }
  return (h >>> 0).toString(36);
}
