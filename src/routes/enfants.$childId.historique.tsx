import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, History, AlertTriangle, ShoppingBag } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { RequireAuth } from "@/components/RequireAuth";
import { useStore } from "@/lib/store";
import {
  fetchChildPurchaseHistory,
  formatAge,
  formatDateFR,
  monthsSince,
  replacementThresholdMonths,
  shouldReplace,
  type PurchasedItem,
} from "@/lib/purchaseHistory";
import { PageWatermark } from "@/components/PageWatermark";

export const Route = createFileRoute("/enfants/$childId/historique")({
  head: () => ({
    meta: [{ title: "Historique des commandes — Espace familles" }],
  }),
  component: () => (
    <RequireAuth>
      <HistoriquePage />
    </RequireAuth>
  ),
});

function HistoriquePage() {
  const { childId } = Route.useParams();
  const { children } = useStore();
  const enfant = children.find((c) => c.id === childId);

  const [items, setItems] = useState<PurchasedItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetchChildPurchaseHistory(childId)
      .then((d) => {
        if (active) setItems(d);
      })
      .catch((e) => {
        if (active) setError(e?.message ?? "Erreur");
      });
    return () => {
      active = false;
    };
  }, [childId]);

  const accent =
    enfant?.genre === "Fille"
      ? "text-pink-700"
      : enfant?.genre === "Garçon"
      ? "text-sky-700"
      : "text-primary";

  return (
    <div className="relative flex min-h-screen flex-col bg-background/80">
      <PageWatermark />
      <SiteHeader />
      <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <Link
          to="/enfants"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Retour à mes enfants
        </Link>

        <div className="mt-4 flex items-center gap-3">
          <span
            className={`flex h-12 w-12 items-center justify-center rounded-2xl text-sm font-bold text-white ${
              enfant?.genre === "Fille"
                ? "bg-pink-500"
                : enfant?.genre === "Garçon"
                ? "bg-sky-500"
                : "bg-primary"
            }`}
          >
            {enfant?.initials ?? "?"}
          </span>
          <div>
            <span className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${accent}`}>
              <History className="mr-1 inline h-3 w-3" /> Historique des commandes
            </span>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {enfant ? `${enfant.prenom} ${enfant.nom}` : "Enfant"}
            </h1>
          </div>
        </div>

        <div className="mt-8">
          {error && <p className="text-sm text-destructive">Erreur : {error}</p>}
          {!error && items === null && (
            <p className="text-sm text-muted-foreground">Chargement de l'historique…</p>
          )}
          {!error && items && items.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
              <ShoppingBag className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-3 text-sm text-muted-foreground">
                Aucun vêtement commandé pour {enfant?.prenom ?? "cet enfant"} pour l'instant.
              </p>
              <Link
                to="/boutique"
                className="mt-4 inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                Aller à la boutique
              </Link>
            </div>
          )}
          {!error && items && items.length > 0 && (
            <ul className="space-y-3">
              {items.map((it) => {
                const months = monthsSince(it.orderDate);
                const replace = shouldReplace(it);
                const threshold = replacementThresholdMonths(it.productName);
                return (
                  <li
                    key={it.itemId}
                    className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)] sm:p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-base font-semibold text-foreground">
                          {it.quantity} × {it.productName}
                        </div>
                        <div className="mt-0.5 text-xs text-muted-foreground">
                          Réf. {it.productRef} · Taille {it.size}
                          {it.variant ? ` · ${it.variant}` : ""}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-foreground">
                          {it.lineTotal.toFixed(2)} €
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          Commande {it.orderNumber}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
                      <div className="text-xs text-muted-foreground">
                        Acheté le <span className="font-medium text-foreground">{formatDateFR(it.orderDate)}</span>
                        <span className="ml-1">({formatAge(months)})</span>
                      </div>
                      {replace ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                          <AlertTriangle className="h-3 w-3" /> À remplacer ? (au-delà de {threshold} mois)
                        </span>
                      ) : (
                        <span className="text-[11px] text-muted-foreground">
                          Renouvellement conseillé après {threshold} mois
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}