import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Clock, ArrowRight } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { RequireAuth } from "@/components/RequireAuth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/commandes/retour-paiement")({
  validateSearch: (s: Record<string, unknown>) => ({
    order: typeof s.order === "string" ? s.order : "",
    cancel: s.cancel === "1" || s.cancel === 1 ? 1 : undefined,
  }),
  head: () => ({ meta: [{ title: "Retour paiement — Saint-Jacques" }] }),
  component: () => (
    <RequireAuth>
      <RetourPaiementPage />
    </RequireAuth>
  ),
});

function RetourPaiementPage() {
  const { order: orderId, cancel } = useSearch({ from: "/commandes/retour-paiement" });
  const [order, setOrder] = useState<{ order_number: string; status: string; total_amount: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const tick = async () => {
      if (!orderId) return;
      const { data } = await supabase
        .from("orders")
        .select("order_number, status, total_amount")
        .eq("id", orderId)
        .maybeSingle();
      if (mounted && data) {
        setOrder(data as any);
        setLoading(false);
      }
    };
    tick();
    // Poll quelques secondes pour laisser le webhook arriver
    const intv = setInterval(tick, 2500);
    const stop = setTimeout(() => clearInterval(intv), 20000);
    return () => {
      mounted = false;
      clearInterval(intv);
      clearTimeout(stop);
    };
  }, [orderId]);

  const isPaid = order?.status === "Paiement validé";
  const isFailed = order?.status === "Paiement échoué" || cancel === 1;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader schoolName="Saint-Jacques-de-Compostelle — Dax" />
      <section className="mx-auto max-w-xl px-4 py-16 text-center sm:py-24">
        {loading && !order ? (
          <p className="text-sm text-muted-foreground">Vérification du paiement…</p>
        ) : isPaid ? (
          <>
            <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-500" />
            <h1 className="mt-4 text-2xl font-semibold">Paiement confirmé</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Votre commande <strong>{order?.order_number}</strong> a bien été réglée. Un email de confirmation vient de vous être envoyé.
            </p>
          </>
        ) : isFailed ? (
          <>
            <XCircle className="mx-auto h-14 w-14 text-rose-500" />
            <h1 className="mt-4 text-2xl font-semibold">Paiement non finalisé</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Votre commande <strong>{order?.order_number}</strong> est en attente. Vous pouvez relancer le paiement depuis vos commandes.
            </p>
          </>
        ) : (
          <>
            <Clock className="mx-auto h-14 w-14 text-amber-500" />
            <h1 className="mt-4 text-2xl font-semibold">Paiement en cours de validation…</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              La confirmation peut prendre quelques secondes. Cette page se met à jour automatiquement.
            </p>
          </>
        )}
        <Link
          to="/commandes"
          className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground"
        >
          Voir mes commandes <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
      <SiteFooter />
    </div>
  );
}