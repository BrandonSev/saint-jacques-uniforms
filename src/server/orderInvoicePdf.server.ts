import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatCivilite } from "@/lib/utils";
import { SAINT_JACQUES_LOGO_BASE64 } from "@/assets/saintJacquesLogoBase64";

const FU_NAVY: [number, number, number] = [10, 37, 64];
const FU_BAND: [number, number, number] = [228, 243, 249]; // #e4f3f9

const ISSUER = {
  name: "France Uniformes",
  legal1: "SAS au capital de 2 500 € — RCS Chartres — SIRET 983 587 932 00010",
  legal2: "TVA FR43 983 587 932 — Code NAF/APE 4791B",
  address: "2 rue Percheronne, 28000 Chartres, France",
};

export type InvoiceItem = {
  child: string;
  productName: string;
  productRef: string;
  size: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type InvoiceData = {
  invoiceNumber: string;
  orderNumber: string;
  paidAt: string | null;
  totalAmount: number;
  family: {
    civilite?: string | null;
    prenom: string;
    nom: string;
    email: string;
  };
  billing: {
    name?: string | null;
    address?: string | null;
    postal?: string | null;
    city?: string | null;
  };
  items: InvoiceItem[];
};

function fr(d: string | null) {
  if (!d) return "—";
  const date = new Date(d);
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}

function eur(n: number) {
  return `${n.toFixed(2).replace(".", ",")} €`;
}

export function buildOrderInvoicePdf(data: InvoiceData): Buffer {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const M = 40;

  doc.setFillColor(...FU_NAVY);
  doc.rect(0, 0, W, 90, "F");
  doc.setFillColor(...FU_BAND);
  doc.rect(0, 90, W, 3, "F");

  doc.addImage(SAINT_JACQUES_LOGO_BASE64, "PNG", M, 18, 54, 54);
  const textX = M + 66;
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.text("Saint-Jacques-de-Compostelle", textX, 42);
  doc.setFontSize(9);
  doc.setTextColor(200, 220, 235);
  doc.text("Groupe scolaire catholique · Dax", textX, 58);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.text("FACTURE", W - M, 40, { align: "right" });
  doc.setFontSize(11);
  doc.text(data.invoiceNumber, W - M, 60, { align: "right" });

  doc.setTextColor(20, 20, 20);
  doc.setFontSize(10);
  let y = 120;
  doc.text(`N° de commande : ${data.orderNumber}`, M, y);
  doc.text(`Date de facturation : ${fr(data.paidAt)}`, W - M, y, { align: "right" });
  y += 16;
  doc.setTextColor(80, 80, 80);
  doc.text(`Commande réglée le ${fr(data.paidAt)}`, W - M, y, { align: "right" });
  doc.setTextColor(20, 20, 20);
  y += 24;

  doc.setFontSize(10);
  doc.setTextColor(...FU_NAVY);
  doc.text("ÉMETTEUR", M, y);
  doc.text("DESTINATAIRE", W / 2, y);
  doc.setTextColor(20);
  y += 14;
  const colWidth = (W - M * 2) / 2 - 10;
  const issuer = `${ISSUER.name}\n${ISSUER.address}\n${ISSUER.legal1}\n${ISSUER.legal2}`;
  const issuerLines = doc.splitTextToSize(issuer, colWidth);
  doc.text(issuerLines, M, y);
  const recipient = `${formatCivilite(data.family.civilite)} ${data.family.prenom} ${data.family.nom}\n${data.family.email}${
    data.billing.name || data.billing.address
      ? `\n${[data.billing.name, data.billing.address, [data.billing.postal, data.billing.city].filter(Boolean).join(" ")].filter(Boolean).join("\n")}`
      : ""
  }`;
  const recipientLines = doc.splitTextToSize(recipient, colWidth);
  doc.text(recipientLines, W / 2, y);
  y += Math.max(issuerLines.length, recipientLines.length) * 12 + 16;

  autoTable(doc, {
    startY: y,
    head: [["Enfant", "Produit", "Taille", "Qté", "PU", "Total"]],
    body: data.items.map((it) => [
      it.child,
      `${it.productName}\nRéf. ${it.productRef}`,
      it.size,
      String(it.quantity),
      eur(it.unitPrice),
      eur(it.lineTotal),
    ]),
    theme: "striped",
    styles: { fontSize: 9, cellPadding: 6 },
    headStyles: { fillColor: FU_NAVY, textColor: 255 },
    columnStyles: { 3: { halign: "right" }, 4: { halign: "right" }, 5: { halign: "right" } },
    margin: { left: M, right: M },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const finalY = (doc as any).lastAutoTable.finalY + 16;
  doc.setFontSize(11);
  doc.text("Total TTC", W - M - 120, finalY);
  doc.setFontSize(14);
  doc.text(eur(data.totalAmount), W - M, finalY, { align: "right" });

  return Buffer.from(doc.output("arraybuffer"));
}
