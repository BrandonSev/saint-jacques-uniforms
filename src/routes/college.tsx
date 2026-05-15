/**
 * Phase 8 — Ancienne route conservée pour le SEO.
 * Redirige en 301 vers /catalogue/college (URL canonique).
 */
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/college")({
  beforeLoad: () => {
    throw redirect({
      to: "/catalogue/$niveau",
      params: { niveau: "college" },
      statusCode: 301,
    });
  },
});
