import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { SAINT_JACQUES_LOGO_BASE64 } from "@/assets/saintJacquesLogoBase64";

const FU_NAVY: [number, number, number] = [10, 37, 64];
const FU_BAND: [number, number, number] = [228, 243, 249];

export type ShippingSlipItem = {
  child: string;
  productName: string;
  productRef: string;
  size: string;
  quantity: number;
};

export type ShippingSlipData = {
  slipNumber: string;
  orderNumber: string;
  recipient: string;
  address: string;
  postal: string;
  city: string;
  items: ShippingSlipItem[];
};

export function buildOrderShippingSlipPdf(data: ShippingSlipData): Buffer {
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
  doc.setFontSize(16);
  doc.text("BORDEREAU", W - M, 32, { align: "right" });
  doc.text("DE LIVRAISON", W - M, 50, { align: "right" });
  doc.setFontSize(11);
  doc.text(data.slipNumber, W - M, 68, { align: "right" });

  doc.setTextColor(20, 20, 20);
  doc.setFontSize(10);
  let y = 120;
  doc.text(`N° de commande : ${data.orderNumber}`, M, y);
  y += 24;

  doc.setFontSize(10);
  doc.setTextColor(...FU_NAVY);
  doc.text("DESTINATAIRE", M, y);
  doc.setTextColor(20);
  y += 14;
  const recipientLines = doc.splitTextToSize(
    `${data.recipient}\n${data.address}\n${data.postal} ${data.city}`,
    W - M * 2,
  );
  doc.text(recipientLines, M, y);
  y += recipientLines.length * 12 + 16;

  autoTable(doc, {
    startY: y,
    head: [["Enfant", "Produit", "Taille", "Qté"]],
    body: data.items.map((it) => [it.child, `${it.productName}\nRéf. ${it.productRef}`, it.size, String(it.quantity)]),
    theme: "striped",
    styles: { fontSize: 9, cellPadding: 6 },
    headStyles: { fillColor: FU_NAVY, textColor: 255 },
    columnStyles: { 3: { halign: "right" } },
    margin: { left: M, right: M },
  });

  const pageH = doc.internal.pageSize.getHeight();
  doc.setFontSize(7);
  doc.setTextColor(140);
  doc.text("Document à joindre au colis lors de l'expédition.", W / 2, pageH - 24, { align: "center" });

  return Buffer.from(doc.output("arraybuffer"));
}
