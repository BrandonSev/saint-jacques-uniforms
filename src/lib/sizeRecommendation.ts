/**
 * Shared size recommendation logic based on the official size guide.
 * Used by the size guide page and the child creation/edit dialog.
 */

export type SizeRow = {
  age: string;
  stature: string;
  poitrine: string;
  taille: string;
  bassin: string;
};

export const sizeRows: SizeRow[] = [
  { age: "3 ans", stature: "90/97", poitrine: "53", taille: "50", bassin: "56" },
  { age: "4 ans", stature: "98/107", poitrine: "55", taille: "52", bassin: "58" },
  { age: "5 ans", stature: "108/113", poitrine: "57", taille: "54", bassin: "60" },
  { age: "6 ans", stature: "114/119", poitrine: "59", taille: "55", bassin: "64" },
  { age: "7 ans", stature: "120/125", poitrine: "61", taille: "56", bassin: "66" },
  { age: "8 ans", stature: "126/137", poitrine: "63", taille: "57", bassin: "68" },
  { age: "10 ans", stature: "138/143", poitrine: "71", taille: "62", bassin: "76" },
  { age: "12 ans", stature: "144/155", poitrine: "77", taille: "66", bassin: "81" },
  { age: "14 ans", stature: "156/164", poitrine: "84", taille: "71", bassin: "86" },
  { age: "16 ans", stature: "164/176", poitrine: "88", taille: "75", bassin: "91" },
  { age: "18 ans", stature: "176/182", poitrine: "92", taille: "79", bassin: "96" },
];

function parseRange(v: string): [number, number] {
  const parts = v.split("/").map((p) => parseFloat(p.trim()));
  if (parts.length === 2 && parts.every((n) => !isNaN(n))) return [parts[0], parts[1]];
  if (parts.length === 1 && !isNaN(parts[0])) return [parts[0], parts[0]];
  return [NaN, NaN];
}

function findRowIndexFor(value: number, key: keyof Pick<SizeRow, "stature" | "poitrine" | "taille" | "bassin">): number {
  for (let i = 0; i < sizeRows.length; i++) {
    const [min, max] = parseRange(sizeRows[i][key]);
    if (isNaN(min)) continue;
    if (value <= max) return i;
  }
  return sizeRows.length - 1;
}

function num(v: string | number | undefined | null): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = parseFloat(String(v).replace(",", "."));
  return isNaN(n) ? null : n;
}

export type SizeRecommendation = {
  idx: number;
  row: SizeRow;
  drivers: { key: string; idx: number; value: number }[];
  consistent: boolean;
};

export type Measurements = {
  hauteur?: string | number | null;
  tour?: string | number | null;
  tour_taille?: string | number | null;
  tour_bassin?: string | number | null;
};

export type RecommendOptions = {
  /**
   * Si "blouse", on applique un décalage de +1 taille (capé sur la dernière ligne).
   * Cas d'usage : blouse livrée à la rentrée de Septembre 2025, pour laquelle
   * il est recommandé de prendre une taille au-dessus.
   */
  product?: "blouse";
};

export function recommendSize(m: Measurements, opts: RecommendOptions = {}): SizeRecommendation | null {
  const stature = num(m.hauteur);
  const poitrine = num(m.tour);
  const tailleM = num(m.tour_taille);
  const bassin = num(m.tour_bassin);
  const candidates: { key: string; idx: number; value: number }[] = [];
  if (stature !== null) candidates.push({ key: "Stature", idx: findRowIndexFor(stature, "stature"), value: stature });
  if (poitrine !== null) candidates.push({ key: "Tour de poitrine", idx: findRowIndexFor(poitrine, "poitrine"), value: poitrine });
  if (tailleM !== null) candidates.push({ key: "Tour de taille", idx: findRowIndexFor(tailleM, "taille"), value: tailleM });
  if (bassin !== null) candidates.push({ key: "Tour de bassin", idx: findRowIndexFor(bassin, "bassin"), value: bassin });
  if (candidates.length === 0) return null;
  const best = candidates.reduce((a, b) => (b.idx > a.idx ? b : a));
  const allSame = candidates.every((c) => c.idx === candidates[0].idx);
  let idx = best.idx;
  if (opts.product === "blouse") {
    idx = Math.min(sizeRows.length - 1, idx + 1);
  }
  return { idx, row: sizeRows[idx], drivers: candidates, consistent: allSame };
}