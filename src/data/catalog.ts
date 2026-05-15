/**
 * Phase 7 — Catalogue statique Saint-Jacques (source de vérité tant que
 * TENANT_FLAGS.ENABLE_DYNAMIC_CATALOG = false).
 *
 * Les valeurs miroir ce qui est rendu dans `src/routes/blouse-officielle.tsx`
 * et ce qui a été inséré en base par la migration de Phase 4.
 */

import type { Catalog } from "@/lib/catalog/types";

const SIZE_LABELS = ["3 ans", "4 ans", "5 ans", "6 ans", "8 ans", "10 ans", "12 ans", "14 ans", "16 ans"];

export const STATIC_CATALOG: Catalog = {
  source: "static",
  tenantSlug: "saint-jacques",
  products: [
    {
      slug: "blouse-officielle",
      name: "Blouse scolaire officielle SJDC",
      ref: "Riviera Dax",
      basePrice: 30,
      level: "maternelle-elementaire",
      imageUrl: null, // l'image est importée localement par la route
      description:
        "Riviera, fermeture centrale par 5 boutons pressions jaunes, élastiquage léger autour des poignets, col biais semi contrasté bleu Riviera foncé, écusson du blason de l'école brodé sur le coeur et 1 poche poitrine.",
      sizes: SIZE_LABELS.map((label, i) => ({ label, sortOrder: i })),
      metadata: {},
    },
  ],
};