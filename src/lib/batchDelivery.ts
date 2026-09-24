import { VAT_RATE, ht } from "@/lib/vat";

// Statuts modifiables en lot (« Expédiée » exige un n° de suivi : ligne par ligne).
export const BATCH_TARGET_STATUSES = ["En attente", "Paiement validé", "En préparation", "Livrée", "Annulée", "Remboursée"] as const;

// Commandes jamais modifiées par un lot.
export const BATCH_PROTECTED_STATUSES = ["Annulée", "Remboursée"] as const;

/** « 2026-09-01 » → instant à midi UTC (évite tout décalage de jour selon le fuseau). */
export function dateInputToIso(value: string): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!m) return null;
  const [, y, mo, d] = m;
  const iso = `${y}-${mo}-${d}T12:00:00.000Z`;
  const t = new Date(iso);
  if (isNaN(t.getTime()) || t.toISOString().slice(0, 10) !== `${y}-${mo}-${d}`) return null;
  return iso;
}

/** Instant ISO → « AAAA-MM-JJ » (fuseau de Paris), pour un <input type="date">. */
export function isoToDateInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const t = new Date(iso);
  if (isNaN(t.getTime())) return "";
  return t.toLocaleDateString("sv-SE", { timeZone: "Europe/Paris" });
}

function parseCsvDate(raw: string): string | null {
  const v = raw.trim();
  const fr = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/.exec(v);
  if (fr) return dateInputToIso(`${fr[3]}-${fr[2].padStart(2, "0")}-${fr[1].padStart(2, "0")}`);
  return dateInputToIso(v.slice(0, 10));
}

/**
 * CSV « n° de commande ; date de livraison » (séparateur ; , ou tabulation ; dates AAAA-MM-JJ ou JJ/MM/AAAA ;
 * ligne d'en-tête tolérée). Renvoie la date par n° de commande et les lignes rejetées.
 */
export function parseDeliveryDatesCsv(text: string): { dates: Record<string, string>; errors: string[] } {
  const dates: Record<string, string> = {};
  const errors: string[] = [];
  const lines = text.replace(/^﻿/, "").split(/\r?\n/);
  lines.forEach((line, index) => {
    if (!line.trim()) return;
    const cells = line.split(/[;,\t]/).map((c) => c.trim().replace(/^"|"$/g, ""));
    const [orderNumber, rawDate] = cells;
    if (!orderNumber || rawDate === undefined) {
      errors.push(`Ligne ${index + 1} : 2 colonnes attendues`);
      return;
    }
    const iso = parseCsvDate(rawDate);
    if (!iso) {
      // Première ligne non parsable = en-tête, on l'ignore silencieusement.
      if (index === 0) return;
      errors.push(`Ligne ${index + 1} : date invalide « ${rawDate} »`);
      return;
    }
    dates[orderNumber] = iso;
  });
  return { dates, errors };
}

/** Date de livraison retenue pour une commande d'un lot passé en « Livrée » (undefined = maintenant). */
export function resolveDeliveredAt(input: {
  itemDate?: string | null;
  jobDate?: string | null;
  existing?: string | null;
}): string | undefined {
  return input.itemDate ?? input.jobDate ?? input.existing ?? undefined;
}

export function invoicePrefix(deliveryType: string | null | undefined): "FU-B" | "FU-BE" {
  return deliveryType === "individual" ? "FU-B" : "FU-BE";
}

export type InvoiceRange = { prefix: string; count: number; first: string; last: string };

/** Plage de numéros de facture qui seront attribués, par préfixe, aux commandes pas encore facturées. */
export function planInvoiceRanges(
  orders: { delivery_type: string | null; hasInvoice: boolean }[],
  lastSequences: Record<string, number>,
  year: number,
): InvoiceRange[] {
  const counts: Record<string, number> = {};
  for (const o of orders) {
    if (o.hasInvoice) continue;
    const prefix = invoicePrefix(o.delivery_type);
    counts[prefix] = (counts[prefix] ?? 0) + 1;
  }
  const num = (prefix: string, seq: number) => `${prefix}-${year}-${String(seq).padStart(5, "0")}`;
  return Object.entries(counts).map(([prefix, count]) => {
    const start = (lastSequences[prefix] ?? 0) + 1;
    return { prefix, count, first: num(prefix, start), last: num(prefix, start + count - 1) };
  });
}

export type InvoiceExportRow = {
  invoiceNumber: string;
  invoiceDate: string | null;
  orderNumber: string;
  deliveredAt: string | null;
  client: string;
  email: string;
  deliveryType: string | null;
  totalTtc: number;
  pdfMissing: boolean;
};

function csvCell(v: string): string {
  return /[";\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}
const eur = (n: number) => n.toFixed(2).replace(".", ",");
const frDate = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("fr-FR", { timeZone: "Europe/Paris" }) : "");

/** CSV récapitulatif pour le comptable (séparateur « ; », BOM UTF-8 pour Excel). */
export function buildInvoicesCsv(rows: InvoiceExportRow[]): string {
  const header = [
    "Numéro de facture",
    "Date de facturation",
    "Numéro de commande",
    "Date de livraison",
    "Client",
    "Email",
    "Type de commande",
    "Total HT",
    `TVA ${Math.round(VAT_RATE * 100)} %`,
    "Total TTC",
    "PDF manquant",
  ];
  const lines = rows.map((r) => {
    const totalHt = ht(r.totalTtc);
    return [
      r.invoiceNumber,
      frDate(r.invoiceDate),
      r.orderNumber,
      frDate(r.deliveredAt),
      r.client,
      r.email,
      r.deliveryType === "individual" ? "Individuelle" : "Groupée",
      eur(totalHt),
      eur(r.totalTtc - totalHt),
      eur(r.totalTtc),
      r.pdfMissing ? "oui" : "",
    ]
      .map(csvCell)
      .join(";");
  });
  return "﻿" + [header.map(csvCell).join(";"), ...lines].join("\r\n") + "\r\n";
}
