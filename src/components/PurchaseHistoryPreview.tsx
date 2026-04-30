import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { History, AlertTriangle, ShoppingBag } from "lucide-react";
import {
  fetchChildPurchaseHistory,
  formatAge,
  monthsSince,
  shouldReplace,
  type PurchasedItem,
} from "@/lib/purchaseHistory";

type Props = {
  childId: string;
  genre?: "" | "Fille" | "Garçon";
  limit?: number;
};

export function PurchaseHistoryPreview({ childId, genre, limit = 3 }: Props) {
  const [items, setItems] = useState<PurchasedItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetchChildPurchaseHistory(childId)
      .then((data) => {
        if (active) setItems(data);
      })
      .catch((e) => {
        if (active) setError(e?.message ?? "Erreur");
      });
    return () => {
      active = false;
    };
  }, [childId]);

  const accent =
    genre === "Fille"
      ? "text-pink-700"
      : genre === "Garçon"
      ? "text-sky-700"
      : "text-primary";

  return (
    <div className="border-t border-border bg-white/40 px-6 py-5 sm:px-8">
      <div className="flex items-center justify-between gap-3">
        <div className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-wider ${accent}`}>
          <History className="h-3.5 w-3.5" /> Historique des commandes
        </div>
        <Link
          to="/enfants/$childId/historique"
          params={{ childId }}
          className="text-xs font-semibold text-primary hover:underline"
        >
          Tout voir
        </Link>
      </div>

      {error && <p className="mt-3 text-xs text-destructive">Erreur : {error}</p>}

      {!error && items === null && (
        <p className="mt-3 text-xs text-muted-foreground">Chargement…</p>
      )}

      {!error && items && items.length === 0 && (
        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <ShoppingBag className="h-3.5 w-3.5" />
          Aucun vêtement commandé pour cet enfant pour l'instant.
        </div>
      )}

      {!error && items && items.length > 0 && (
        <ul className="mt-3 space-y-2">
          {items.slice(0, limit).map((it) => {
            const months = monthsSince(it.orderDate);
            const replace = shouldReplace(it);
            return (
              <li
                key={it.itemId}
                className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-background px-3 py-2"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-foreground">
                    {it.quantity} × {it.productName}
                    <span className="text-muted-foreground"> · taille {it.size}</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Acheté {formatAge(months)}
                  </div>
                </div>
                {replace && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                    <AlertTriangle className="h-3 w-3" /> À remplacer ?
                  </span>
                )}
              </li>
            );
          })}
          {items.length > limit && (
            <li className="text-[11px] text-muted-foreground">
              + {items.length - limit} autre{items.length - limit > 1 ? "s" : ""} article{items.length - limit > 1 ? "s" : ""} commandé{items.length - limit > 1 ? "s" : ""}.
            </li>
          )}
        </ul>
      )}
    </div>
  );
}