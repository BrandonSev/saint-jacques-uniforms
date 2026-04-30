import { supabase } from "@/integrations/supabase/client";

export type PurchasedItem = {
  itemId: string;
  orderId: string;
  orderNumber: string;
  orderDate: string; // ISO
  status: string;
  productId: string;
  productName: string;
  productRef: string;
  size: string;
  variant: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

/** Statuts considérés comme "livrés" (commande honorée). */
const DELIVERED_STATUSES = ["Livrée", "Livré", "Envoyée", "Envoyé"];

/** Récupère l'historique d'achats livrés pour un enfant donné, le plus récent d'abord. */
export async function fetchChildPurchaseHistory(childId: string): Promise<PurchasedItem[]> {
  const { data, error } = await supabase
    .from("order_items")
    .select(
      "id, product_id, product_name, product_ref, size, variant, quantity, unit_price, line_total, order_id, orders!inner(id, order_number, status, created_at)",
    )
    .eq("child_id", childId)
    .in("orders.status", DELIVERED_STATUSES)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row: any) => ({
    itemId: row.id,
    orderId: row.order_id,
    orderNumber: row.orders?.order_number ?? "—",
    orderDate: row.orders?.created_at ?? "",
    status: row.orders?.status ?? "",
    productId: row.product_id,
    productName: row.product_name,
    productRef: row.product_ref,
    size: row.size,
    variant: row.variant ?? null,
    quantity: row.quantity,
    unitPrice: Number(row.unit_price),
    lineTotal: Number(row.line_total),
  }));
}

/** Mois écoulés depuis une date ISO. */
export function monthsSince(iso: string): number {
  if (!iso) return 0;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return 0;
  const now = new Date();
  return (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
}

/** Catégorie d'usure, déduite du nom du produit. */
function inferCategory(productName: string): "blouse" | "pull" | "chemise" | "polo" | "pantalon" | "autre" {
  const n = productName.toLowerCase();
  if (n.includes("blouse")) return "blouse";
  if (n.includes("pull") || n.includes("gilet") || n.includes("sweat")) return "pull";
  if (n.includes("chemise")) return "chemise";
  if (n.includes("polo") || n.includes("t-shirt") || n.includes("tshirt")) return "polo";
  if (n.includes("pantalon") || n.includes("short") || n.includes("bermuda") || n.includes("jupe")) return "pantalon";
  return "autre";
}

/** Seuil de remplacement recommandé (en mois). */
export function replacementThresholdMonths(productName: string): number {
  switch (inferCategory(productName)) {
    case "blouse":
      return 18;
    case "pull":
      return 18;
    case "chemise":
      return 12;
    case "polo":
      return 12;
    case "pantalon":
      return 12;
    default:
      return 18;
  }
}

export function shouldReplace(item: PurchasedItem): boolean {
  return monthsSince(item.orderDate) >= replacementThresholdMonths(item.productName);
}

export function formatAge(months: number): string {
  if (months <= 0) return "ce mois-ci";
  if (months < 12) return `il y a ${months} mois`;
  const years = Math.floor(months / 12);
  const rem = months % 12;
  if (rem === 0) return `il y a ${years} an${years > 1 ? "s" : ""}`;
  return `il y a ${years} an${years > 1 ? "s" : ""} et ${rem} mois`;
}

export function formatDateFR(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}