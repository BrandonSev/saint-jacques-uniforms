/**
 * Phase 8 — Route catalogue dynamique par niveau.
 *
 * URL canonique : /catalogue/$niveau
 * Niveaux supportés (mono-tenant SJC) : maternelle | college | lycee.
 *
 * Les anciennes routes /maternelle, /college, /lycee redirigent ici en 301
 * (cf. src/routes/maternelle.tsx, college.tsx, lycee.tsx).
 *
 * NOTE multi-tenant : la liste des niveaux valides sera lue dans
 * `tenant.config.catalogLevels` une fois ENABLE_DYNAMIC_CATALOG en place
 * (Phase 9+). Pour l'instant, liste statique pour ne rien casser.
 */

import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { RequireAuth } from "@/components/RequireAuth";
import MaternellePage from "@/components/catalogue/MaternellePage";
import CollegePage from "@/components/catalogue/CollegePage";
import LyceePage from "@/components/catalogue/LyceePage";

const NIVEAU_META = {
  maternelle: {
    title: "Uniformes Maternelle & Élémentaire — Saint-Jacques-de-Compostelle",
    description:
      "Sélection d'uniformes validée par l'établissement pour les élèves de maternelle et d'élémentaire (PS, MS, GS, CP, CE1, CE2, CM1).",
    canonical: "/catalogue/maternelle",
  },
  college: {
    title: "Uniformes collège — Saint-Jacques-de-Compostelle",
    description:
      "Polos, pulls et t-shirts validés par l'établissement pour les collégiens du Groupe Saint-Jacques-de-Compostelle.",
    canonical: "/catalogue/college",
  },
  lycee: {
    title: "Uniformes lycée — Saint-Jacques-de-Compostelle",
    description:
      "Le trousseau du lycée n'est pas géré par France Uniformes. Pour toute information, rapprochez-vous de l'établissement.",
    canonical: "/catalogue/lycee",
  },
} as const;

type Niveau = keyof typeof NIVEAU_META;

function isNiveau(value: string): value is Niveau {
  return value in NIVEAU_META;
}

export const Route = createFileRoute("/catalogue/$niveau")({
  beforeLoad: ({ params }) => {
    if (!isNiveau(params.niveau)) {
      throw notFound();
    }
  },
  head: ({ params }) => {
    const niveau = (params as { niveau: string }).niveau;
    const meta = isNiveau(niveau) ? NIVEAU_META[niveau] : null;
    if (!meta) return {};
    return {
      meta: [
        { title: meta.title },
        { name: "description", content: meta.description },
        { property: "og:title", content: meta.title },
        { property: "og:description", content: meta.description },
      ],
      links: [{ rel: "canonical", href: meta.canonical }],
    };
  },
  component: CatalogueNiveauRoute,
  notFoundComponent: () => (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="text-2xl font-semibold">Niveau inconnu</h1>
      <p className="mt-3 text-muted-foreground">
        Ce niveau n'est pas proposé par l'établissement.
      </p>
      <Link
        to="/boutique"
        className="mt-6 inline-flex rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
      >
        Retour à la boutique
      </Link>
    </div>
  ),
});

function CatalogueNiveauRoute() {
  const { niveau } = Route.useParams();
  return (
    <RequireAuth>
      {niveau === "maternelle" && <MaternellePage />}
      {niveau === "college" && <CollegePage />}
      {niveau === "lycee" && <LyceePage />}
    </RequireAuth>
  );
}