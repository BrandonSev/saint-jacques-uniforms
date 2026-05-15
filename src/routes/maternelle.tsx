/**
 * Phase 8 — Ancienne route conservée pour le SEO.
 * Redirige en 301 vers /catalogue/maternelle (URL canonique).
 */
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/maternelle")({
  beforeLoad: () => {
    throw redirect({
      to: "/catalogue/$niveau",
      params: { niveau: "maternelle" },
      statusCode: 301,
    });
  },
});
