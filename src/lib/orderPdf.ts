import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export type PdfOrderItem = {
  child: string;
  productName: string;
  productRef: string;
  size: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type PdfOrder = {
  orderNumber: string;
  createdAt: string;
  status: string;
  totalAmount: number;
  family: {
    civilite?: string | null;
    prenom: string;
    nom: string;
    email: string;
    telephone?: string | null;
  };
  shipping: {
    mode: string; // 'home' | 'pickup'
    label?: string | null;
    recipient?: string | null;
    address?: string | null;
    postal?: string | null;
    city?: string | null;
  };
  items: PdfOrderItem[];
  trackingNumber?: string | null;
  trackingCarrier?: string | null;
  paidAt?: string | null;
};

function fr(d: string | null | undefined) {
  if (!d) return "—";
  const date = new Date(d);
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}

function eur(n: number) {
  return `${n.toFixed(2).replace(".", ",")} €`;
}

export function buildOrderPdf(order: PdfOrder): jsPDF {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const M = 40;

  // En-tête
  doc.setFillColor(15, 58, 95);
  doc.rect(0, 0, W, 90, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.text("SAINT-JACQUES-DE-COMPOSTELLE — DAX", M, 35);
  doc.setFontSize(20);
  doc.text("Récapitulatif de commande", M, 65);

  doc.setTextColor(20, 20, 20);
  doc.setFontSize(11);
  let y = 120;
  doc.text(`N° de commande : ${order.orderNumber}`, M, y);
  doc.text(`Date : ${fr(order.createdAt)}`, W - M, y, { align: "right" });
  y += 16;
  doc.setFontSize(10);
  doc.text(`Statut : ${order.status}`, M, y);
  if (order.paidAt) doc.text(`Payée le ${fr(order.paidAt)}`, W - M, y, { align: "right" });
  y += 24;

  // Famille / livraison
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text("FAMILLE", M, y);
  doc.text("LIVRAISON", W / 2, y);
  doc.setTextColor(20);
  y += 14;
  const family = `${order.family.civilite ?? ""} ${order.family.prenom} ${order.family.nom}\n${order.family.email}${order.family.telephone ? "\n" + order.family.telephone : ""}`;
  doc.text(family, M, y);
  const shipping =
    order.shipping.mode === "pickup"
      ? "Retrait auprès de l'APEL\n(Dates communiquées par mail)"
      : [
          order.shipping.recipient,
          order.shipping.address,
          [order.shipping.postal, order.shipping.city].filter(Boolean).join(" "),
        ]
          .filter(Boolean)
          .join("\n") || "Adresse non renseignée";
  doc.text(shipping, W / 2, y);
  y += 60;

  // Tableau articles
  autoTable(doc, {
    startY: y,
    head: [["Enfant", "Produit", "Taille", "Qté", "PU", "Total"]],
    body: order.items.map((it) => [
      it.child,
      `${it.productName}\nRéf. ${it.productRef}`,
      it.size,
      String(it.quantity),
      eur(it.unitPrice),
      eur(it.lineTotal),
    ]),
    theme: "striped",
    styles: { fontSize: 9, cellPadding: 6 },
    headStyles: { fillColor: [15, 58, 95], textColor: 255 },
    columnStyles: {
      3: { halign: "right" },
      4: { halign: "right" },
      5: { halign: "right" },
    },
    margin: { left: M, right: M },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 16;
  doc.setFontSize(11);
  doc.text("Total TTC", W - M - 120, finalY);
  doc.setFontSize(14);
  doc.text(eur(order.totalAmount), W - M, finalY, { align: "right" });

  if (order.trackingNumber) {
    const ty = finalY + 30;
    doc.setFontSize(10);
    doc.text(`Suivi : ${order.trackingCarrier ?? ""} ${order.trackingNumber}`, M, ty);
  }

  // Pied de page
  doc.setFontSize(8);
  doc.setTextColor(120);
  doc.text(
    "Établissement Saint-Jacques · Document généré automatiquement.",
    W / 2,
    doc.internal.pageSize.getHeight() - 24,
    { align: "center" },
  );

  return doc;
}

export function downloadOrderPdf(order: PdfOrder) {
  const doc = buildOrderPdf(order);
  doc.save(`commande-${order.orderNumber}.pdf`);
}