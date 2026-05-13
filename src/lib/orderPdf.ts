import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logoUrl from "@/assets/france-uniformes-logo-white.png";

// Couleurs de la charte France Uniformes.
const FU_NAVY: [number, number, number] = [10, 37, 64];
const FU_RED: [number, number, number] = [200, 16, 46];

const ESTABLISHMENT_PICKUP = {
  name: "Ensemble scolaire Saint-Jacques-de-Compostelle",
  address: "32 rue Paul Lahargou",
  postalCity: "40100 Dax",
  hint: "Distribution assurée par l'APE — dates communiquées par e-mail.",
};

let cachedLogo: string | null = null;
async function getLogoDataUrl(): Promise<string | null> {
  if (cachedLogo) return cachedLogo;
  try {
    const res = await fetch(logoUrl);
    const blob = await res.blob();
    cachedLogo = await new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onloadend = () => resolve(r.result as string);
      r.onerror = reject;
      r.readAsDataURL(blob);
    });
    return cachedLogo;
  } catch {
    return null;
  }
}

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

export async function buildOrderPdf(order: PdfOrder): Promise<jsPDF> {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const M = 40;

  // En-tête — bandeau navy + logo France Uniformes + filet rouge.
  doc.setFillColor(...FU_NAVY);
  doc.rect(0, 0, W, 110, "F");
  doc.setFillColor(...FU_RED);
  doc.rect(0, 110, W, 3, "F");

  const logo = await getLogoDataUrl();
  if (logo) {
    doc.addImage(logo, "PNG", M, 24, 130, 30);
  }
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.text("SAINT-JACQUES-DE-COMPOSTELLE — DAX", W - M, 38, { align: "right" });
  doc.setFontSize(18);
  doc.text("Récapitulatif de commande", W - M, 64, { align: "right" });

  doc.setTextColor(20, 20, 20);
  doc.setFontSize(11);
  let y = 140;
  doc.text(`N° de commande : ${order.orderNumber}`, M, y);
  doc.text(`Date : ${fr(order.createdAt)}`, W - M, y, { align: "right" });
  y += 16;
  doc.setFontSize(10);
  doc.text(`Statut : ${order.status}`, M, y);
  if (order.paidAt) doc.text(`Payée le ${fr(order.paidAt)}`, W - M, y, { align: "right" });
  y += 24;

  // Famille / livraison
  doc.setFontSize(10);
  doc.setTextColor(...FU_RED);
  doc.text("FAMILLE", M, y);
  doc.text("LIVRAISON", W / 2, y);
  doc.setTextColor(20);
  y += 14;
  const family = `${order.family.civilite ?? ""} ${order.family.prenom} ${order.family.nom}\n${order.family.email}${order.family.telephone ? "\n" + order.family.telephone : ""}`;
  doc.text(family, M, y);
  const shipping =
    order.shipping.mode === "pickup"
      ? [
          "Retrait à l'établissement",
          ESTABLISHMENT_PICKUP.name,
          ESTABLISHMENT_PICKUP.address,
          ESTABLISHMENT_PICKUP.postalCity,
          "",
          ESTABLISHMENT_PICKUP.hint,
        ].join("\n")
      : [
          order.shipping.recipient,
          order.shipping.address,
          [order.shipping.postal, order.shipping.city].filter(Boolean).join(" "),
        ]
          .filter(Boolean)
          .join("\n") || "Adresse non renseignée";
  doc.text(shipping, W / 2, y);
  y += order.shipping.mode === "pickup" ? 90 : 60;

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
    headStyles: { fillColor: FU_NAVY, textColor: 255 },
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

  // Pied de page — mentions légales France Uniformes
  const pageH = doc.internal.pageSize.getHeight();
  doc.setFontSize(8);
  doc.setTextColor(120);
  doc.text(
    "Document généré automatiquement — ne constitue pas une facture officielle.",
    W / 2,
    pageH - 48,
    { align: "center" },
  );
  doc.setFontSize(7);
  doc.setTextColor(140);
  const legal1 = "France Uniformes — SAS au capital de 2 500 € — RCS Chartres — SIRET 983 587 932 00010";
  const legal2 = "TVA FR43 983 587 932 — Code NAF/APE 4791B — Siège social : 2 rue Percheronne, 28000 Chartres, France";
  doc.text(legal1, W / 2, pageH - 32, { align: "center" });
  doc.text(legal2, W / 2, pageH - 22, { align: "center" });

  return doc;
}

export async function downloadOrderPdf(order: PdfOrder) {
  const doc = await buildOrderPdf(order);
  doc.save(`commande-${order.orderNumber}.pdf`);
}