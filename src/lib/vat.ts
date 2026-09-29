// Taux de TVA applicable (France, taux normal). Les montants stockés en base (unit_price,
// line_total, total_amount) sont des montants TTC : la base ne conserve aucune colonne HT/TVA,
// le HT est donc dérivé par déduction (HT = TTC / (1 + taux)) à l'édition de la facture ou de l'export.
export const VAT_RATE = 0.2;

export function ht(ttc: number): number {
  return ttc / (1 + VAT_RATE);
}
