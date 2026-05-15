/**
 * Phase 11 — Génération des méta SEO (title + description + og:*) à partir
 * du tenant courant. Pure : aucune dépendance React, peut être appelée
 * depuis un `head()` de route (SSR) comme depuis le client.
 *
 * Stratégie :
 *  - On lit `tenant.config.seo.short_label` et `tenant.config.seo.tagline`
 *    quand ils sont présents en DB.
 *  - À défaut, on retombe sur `tenant.shortName` / `tenant.name` et sur
 *    une baseline générique. SJDC reste pixel-identique à ses anciennes
 *    meta tant que le seed `seo.short_label` correspond à l'historique.
 */
import type { TenantContext } from "./types";

const SITE_URL = "https://ecole-dash-dax.lovable.app";

export type TenantSeoPage =
  | { kind: "home" }
  | { kind: "boutique" }
  | { kind: "catalogue"; niveau: "maternelle" | "college" | "lycee" }
  | { kind: "famille" }
  | { kind: "enfants" }
  | { kind: "commandes" }
  | { kind: "panier" }
  | { kind: "login" };

const NIVEAU_LABEL: Record<"maternelle" | "college" | "lycee", string> = {
  maternelle: "Maternelle & Élémentaire",
  college: "Collège",
  lycee: "Lycée",
};

function shortLabel(tenant: TenantContext): string {
  return (
    tenant.config?.seo?.short_label ||
    tenant.shortName ||
    tenant.name
  );
}

function tagline(tenant: TenantContext): string {
  return (
    tenant.config?.seo?.tagline ||
    `Espace familles ${tenant.name}. Commandez les uniformes officiels de l'établissement.`
  );
}

export type TenantSeoMeta = {
  title: string;
  description: string;
  url: string;
};

export function buildTenantSeo(
  tenant: TenantContext,
  page: TenantSeoPage,
): TenantSeoMeta {
  const label = shortLabel(tenant);
  const base = tagline(tenant);

  switch (page.kind) {
    case "home":
      return {
        title: `Boutique groupe scolaire ${label}`,
        description: base,
        url: `${SITE_URL}/`,
      };
    case "boutique":
      return {
        title: `Choisir le niveau — Boutique ${label}`,
        description:
          "Sélectionnez le niveau scolaire de votre enfant pour découvrir la sélection d'uniformes adaptée.",
        url: `${SITE_URL}/boutique`,
      };
    case "catalogue": {
      const niveau = NIVEAU_LABEL[page.niveau];
      return {
        title: `${niveau} — Uniformes ${label}`,
        description: `Découvrez les uniformes ${niveau.toLowerCase()} de ${label}.`,
        url: `${SITE_URL}/catalogue/${page.niveau}`,
      };
    }
    case "famille":
      return {
        title: `Ma famille — Espace familles ${label}`,
        description: `Gérez les coordonnées de votre famille et vos adresses de livraison sur l'espace familles ${label}.`,
        url: `${SITE_URL}/famille`,
      };
    case "enfants":
      return {
        title: `Mes enfants — Espace familles ${label}`,
        description: `Ajoutez et mettez à jour les profils de vos enfants scolarisés à ${label} (classe, tailles, mensurations).`,
        url: `${SITE_URL}/enfants`,
      };
    case "commandes":
      return {
        title: `Mes commandes — Espace familles ${label}`,
        description: `Suivez l'état de vos commandes d'uniformes ${label} : préparation, expédition, retraits et paiements.`,
        url: `${SITE_URL}/commandes`,
      };
    case "panier":
      return {
        title: `Mon panier — Espace familles ${label}`,
        description: `Vérifiez vos articles, choisissez le mode de livraison et finalisez votre commande d'uniformes ${label}.`,
        url: `${SITE_URL}/panier`,
      };
    case "login":
      return {
        title: `Espace familles — ${label}`,
        description: `Connectez-vous ou créez votre espace famille pour commander les uniformes officiels de ${label}.`,
        url: `${SITE_URL}/login`,
      };
  }
}

/**
 * Helper : construit la liste de tags `meta`/`links` prête à être renvoyée
 * par `head()` à partir d'un `TenantSeoMeta`.
 */
export function tenantSeoTags(seo: TenantSeoMeta) {
  return {
    meta: [
      { title: seo.title },
      { name: "description", content: seo.description },
      { property: "og:title", content: seo.title },
      { property: "og:description", content: seo.description },
      { property: "og:url", content: seo.url },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: seo.url }],
  };
}
