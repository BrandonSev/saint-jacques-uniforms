import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { StoreProvider } from "@/lib/store";
import { Toaster } from "@/components/ui/sonner";
import { loadTenantContext } from "@/server/tenantContext.functions";
import { TenantProvider } from "@/lib/tenant/TenantContext";
import { FALLBACK_TENANT } from "@/lib/tenant/types";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page introuvable</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          La page que vous cherchez n'existe pas ou a été déplacée.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  // Phases 6 + 8 — Charge l'identité tenant + (si flag ON) les theme_tokens.
  // En mode mono-tenant, retombe sur FALLBACK_TENANT sans bloquer le rendu.
  loader: async () => {
    try {
      return await loadTenantContext();
    } catch (e) {
      console.warn("[__root loader] tenant context load failed:", e);
      return { tenant: FALLBACK_TENANT, themeCss: null };
    }
  },
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: "France Uniformes — Boutique des uniformes scolaires" },
      { name: "description", content: "Boutique officielle des uniformes scolaires des établissements partenaires France Uniformes." },
      { name: "author", content: "France Uniformes" },
      { property: "og:title", content: "France Uniformes — Boutique des uniformes" },
      { property: "og:description", content: "Espace familles · Commandez les uniformes officiels de l'établissement." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  const themeCss = Route.useLoaderData()?.themeCss ?? null;
  return (
    <html lang="fr">
      <head>
        <HeadContent />
        {themeCss ? (
          <style
            data-tenant-theme=""
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: themeCss }}
          />
        ) : null}
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const tenant = Route.useLoaderData()?.tenant ?? FALLBACK_TENANT;
  return (
    <TenantProvider tenant={tenant}>
      <StoreProvider>
        <Outlet />
        <Toaster />
      </StoreProvider>
    </TenantProvider>
  );
}
