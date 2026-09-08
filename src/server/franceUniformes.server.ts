/**
 * Client serveur pour l'API boutique de l'application de production
 * France Uniformes (franceuniformes_app). Un seul produit est vendu ici
 * ("blouse officielle"), décliné par taille — chaque taille correspond à
 * un sku_externe côté FU (boutique_sku_mapping), obtenu dynamiquement via
 * le catalogue (pas de mapping en dur : si la config FU change, ça suit).
 *
 * Variables d'environnement requises (secrets serveur, jamais VITE_*) :
 *   FU_API_URL        ex. https://app.franceuniformes.fr
 *   FU_BOUTIQUE_TOKEN  token Bearer de la boutique (page /boutiques/{id} côté FU)
 */

export type FuTailleStock = {
  size: string;
  remaining: number;
  skuExterne: string;
};

function fuConfig() {
  const baseUrl = process.env.FU_API_URL;
  const token = process.env.FU_BOUTIQUE_TOKEN;
  if (!baseUrl) throw new Error("FU_API_URL missing");
  if (!token) throw new Error("FU_BOUTIQUE_TOKEN missing");
  return { baseUrl: baseUrl.replace(/\/+$/, ""), token };
}

/**
 * Récupère le stock live (toutes tailles, tous produits configurés pour
 * cette boutique) depuis France Uniformes. qty déjà scopé côté FU sur le
 * client rattaché à la boutique (jamais le stock d'un autre établissement).
 */
export async function fetchFuStock(): Promise<FuTailleStock[]> {
  const { baseUrl, token } = fuConfig();

  const res = await fetch(`${baseUrl}/api/boutique/catalogue`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error(`FU catalogue ${res.status}`);
  }
  const json = (await res.json()) as {
    produits?: Array<{ tailles?: Array<{ taille: string | null; qty: number; sku_externe: string }> }>;
  };

  const out: FuTailleStock[] = [];
  for (const produit of json.produits ?? []) {
    for (const t of produit.tailles ?? []) {
      if (!t.taille) continue;
      out.push({ size: t.taille, remaining: t.qty, skuExterne: t.sku_externe });
    }
  }
  return out;
}

/**
 * Décrémente le stock FU pour une taille donnée (vente confirmée).
 * Idempotent côté FU via l'en-tête Idempotency-Key : un même rejeu du
 * webhook Payplug pour la même commande ne décrémente pas deux fois.
 */
export async function decrementFuStock(params: {
  skuExterne: string;
  qty: number;
  idempotencyKey: string;
  idOrder?: string;
}): Promise<void> {
  const { baseUrl, token } = fuConfig();

  const res = await fetch(`${baseUrl}/api/boutique/decrement`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "Idempotency-Key": params.idempotencyKey,
    },
    body: JSON.stringify({
      sku: params.skuExterne,
      qty: params.qty,
      id_order: params.idOrder,
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`FU decrement ${res.status}: ${body}`);
  }
}
