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
import { loadTenantContext } from "@/server/tenantContext.functions";
import { FALLBACK_TENANT } from "@/lib/tenant/types";
import { buildTenantSeo, tenantSeoTags } from "@/lib/tenant/seo";

type Niveau = "maternelle" | "college" | "lycee";
const NIVEAUX: ReadonlyArray<Niveau> = ["maternelle", "college", "lycee"];

function isNiveau(value: string): value is Niveau {
  return (NIVEAUX as ReadonlyArray<string>).includes(value);
}

export const Route = createFileRoute("/catalogue/$niveau")({
  beforeLoad: ({ params }) => {
    if (!isNiveau(params.niveau)) {
      throw notFound();
    }
  },
  loader: async () => {
    try {
      const ctx = await loadTenantContext();
      return { tenant: ctx.tenant };
    } catch {
      return { tenant: FALLBACK_TENANT };
    }
  },
  head: ({ params, loaderData }) => {
    const niveau = (params as { niveau: string }).niveau;
    if (!isNiveau(niveau)) return {};
    const tenant = loaderData?.tenant ?? FALLBACK_TENANT;
    return tenantSeoTags(buildTenantSeo(tenant, { kind: "catalogue", niveau }));
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