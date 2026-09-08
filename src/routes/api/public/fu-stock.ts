import { createFileRoute } from "@tanstack/react-router";
import { fetchFuStock } from "@/server/franceUniformes.server";

/**
 * Stock live de la blouse officielle, lu en direct depuis France Uniformes
 * à chaque appel (pas de cache local : FU est la seule source de vérité).
 * Réponse : [{ size, remaining }] — même forme que l'ancienne lecture
 * Supabase de blouse_stock, pour ne rien changer côté composants.
 */
export const Route = createFileRoute("/api/public/fu-stock")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const stock = await fetchFuStock();
          return Response.json(stock.map((s) => ({ size: s.size, remaining: s.remaining })));
        } catch (e) {
          console.error("fu-stock:", e);
          // Panne FU : on répond une liste vide plutôt qu'une erreur — le
          // front traite une taille absente comme "stock inconnu" (pas de
          // blocage), c'est le repli le moins mauvais.
          return Response.json([], { status: 200 });
        }
      },
    },
  },
});
