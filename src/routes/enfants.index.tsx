import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Cake, Info, Plus, Ruler, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { ShellMotif } from "@/components/SchoolMotif";
import { useStore, type Child } from "@/lib/store";
import { PurchaseHistoryPreview } from "@/components/PurchaseHistoryPreview";
import { AddChildDialog } from "@/components/AddChildDialog";
import { PageWatermark } from "@/components/PageWatermark";
import { recommendSize } from "@/lib/sizeRecommendation";
import { SizeBadge } from "@/components/SizeBadge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { loadTenantContext } from "@/server/tenantContext.functions";
import { FALLBACK_TENANT } from "@/lib/tenant/types";
import { buildTenantSeo, tenantSeoTags } from "@/lib/tenant/seo";

export const Route = createFileRoute("/enfants/")({
  loader: async () => {
    try {
      const ctx = await loadTenantContext();
      return { tenant: ctx.tenant };
    } catch {
      return { tenant: FALLBACK_TENANT };
    }
  },
  head: ({ loaderData }) => {
    const tenant = loaderData?.tenant ?? FALLBACK_TENANT;
    return tenantSeoTags(buildTenantSeo(tenant, { kind: "enfants" }));
  },
  validateSearch: (search: Record<string, unknown>): { add?: 1 } => ({
    add: search.add === 1 || search.add === "1" ? 1 : undefined,
  }),
  component: EnfantsPage,
});

function computeAgeInfoFromISO(iso: string): { label: string; tooltip: string } | null {
  if (!iso) return null;
  const birth = new Date(iso);
  if (isNaN(birth.getTime())) return null;
  const today = new Date();
  let years = today.getFullYear() - birth.getFullYear();
  let months = today.getMonth() - birth.getMonth();
  const days = today.getDate() - birth.getDate();
  if (days < 0) months--;
  if (months < 0) {
    years--;
    months += 12;
  }
  const totalMonths = years * 12 + months;
  if (totalMonths < 0 || years > 120) return null;
  if (totalMonths < 1) return { label: "Nouveau-né", tooltip: "Moins d'un mois" };
  if (years === 0) return { label: `${totalMonths} mois`, tooltip: `${totalMonths} mois` };
  if (years === 1 && months === 0) return { label: "1 an", tooltip: "1 an pile" };
  const half = months >= 6 ? " et demi" : "";
  return {
    label: `${years} an${years > 1 ? "s" : ""}${half}`,
    tooltip: `${years} an${years > 1 ? "s" : ""} et ${months} mois`,
  };
}

function currentSchoolYear(): string {
  const now = new Date();
  const y = now.getFullYear();
  // School year in France starts in September.
  const start = now.getMonth() >= 7 ? y : y - 1;
  return `${start}/${start + 1}`;
}

function EnfantsPage() {
  const { user, profile, children, addChild, updateChild, removeChild, authLoading } = useStore();
  const { isAdmin } = useStore();
  const [editing, setEditing] = useState<Child | null>(null);
  const [creating, setCreating] = useState(false);
  const search = Route.useSearch();
  const navigate = useNavigate();

  useEffect(() => {
    if (search.add === 1 && user && !isAdmin) {
      setCreating(true);
      navigate({ to: "/enfants", search: {} as any, replace: true });
    }
  }, [search.add, user, isAdmin, navigate]);

  if (authLoading) return null;

  if (isAdmin) {
    return (
      <div className="relative flex min-h-screen flex-col bg-background/80">
      <PageWatermark />
        <SiteHeader schoolName="Saint-Jacques-de-Compostelle — Dax" />
        <section className="mx-auto max-w-xl px-4 py-20 text-center">
          <h1 className="text-2xl font-semibold">Espace administrateur</h1>
          <p className="mt-3 text-sm text-muted-foreground">Cette section est réservée aux familles.</p>
          <Link to="/admin" className="mt-6 inline-flex h-11 items-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground">Aller à l'administration</Link>
        </section>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <SiteHeader schoolName="Saint-Jacques-de-Compostelle — Dax" />
        <section className="mx-auto max-w-xl px-4 py-20 text-center">
          <h1 className="text-2xl font-semibold">Espace réservé aux familles</h1>
          <p className="mt-3 text-sm text-muted-foreground">Connectez-vous pour gérer vos enfants.</p>
          <Link to="/login" className="mt-6 inline-flex h-11 items-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground">Se connecter</Link>
        </section>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader schoolName="Saint-Jacques-de-Compostelle — Dax" />

      <section className="relative mx-auto max-w-6xl px-4 pt-6 pb-12 sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute -top-10 right-0 -z-0 h-72 w-72 text-primary">
          <ShellMotif className="h-full w-full" opacity={0.05} />
        </div>
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
              <span className="h-px w-6 bg-gold" /> Espace famille {profile?.family_name || profile?.nom || ""}
            </span>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Mes enfants
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
              Retrouvez ici les profils de vos enfants scolarisés à
              Saint-Jacques-de-Compostelle. Mettez à jour leurs mensurations pour des tailles toujours
              adaptées.
            </p>
          </div>
          <button onClick={() => setCreating(true)} className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4" /> Ajouter un enfant
          </button>
        </div>

        <div className="mt-5 flex items-start gap-2 rounded-xl border border-border bg-secondary px-4 py-3 text-xs text-muted-foreground">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p>Ces informations permettent d'adapter les tailles proposées dans la boutique. Elles ne sont jamais partagées.</p>
        </div>

        <div className="mt-8 space-y-5">
          {children.length === 0 && !creating && (
            <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
              <p className="text-sm text-muted-foreground">Aucun enfant enregistré. Ajoutez votre premier enfant pour commencer.</p>
            </div>
          )}
          {children.map((e) => (
            <EnfantCard
              key={e.id}
              enfant={e}
              onEdit={() => setEditing(e)}
              onAdd={() => setCreating(true)}
              onDelete={async () => {
                if (confirm(`Supprimer ${e.prenom} ?`)) {
                  try { await removeChild(e.id); toast.success("Enfant supprimé"); }
                  catch (err: any) { toast.error(err.message); }
                }
              }}
            />
          ))}
          {children.length > 0 && (
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-card px-6 py-6 text-sm font-medium text-muted-foreground transition-colors hover:border-primary hover:bg-muted hover:text-primary"
            >
              <Plus className="h-5 w-5" /> Ajouter un autre enfant
            </button>
          )}
        </div>
      </section>

      <AddChildDialog
        key={editing?.id ?? (creating ? "create" : "closed")}
        open={creating || !!editing}
        initial={editing ?? undefined}
        onClose={() => { setCreating(false); setEditing(null); }}
      />

      <SiteFooter />
    </div>
  );
}

function EnfantCard({ enfant, onEdit, onDelete, onAdd }: { enfant: Child; onEdit: () => void; onDelete: () => void; onAdd: () => void }) {
  return (
    <article
      className={`overflow-hidden rounded-2xl border border-border shadow-[var(--shadow-card)] ${
        enfant.genre === "Fille"
          ? "bg-pink-50"
          : enfant.genre === "Garçon"
          ? "bg-sky-50"
          : "bg-card"
      }`}
    >
      <div className="grid gap-0 lg:grid-cols-[280px_1fr]">
        <div
          className={`relative flex flex-col justify-between bg-gradient-to-br p-6 ${
            enfant.genre === "Fille"
              ? "from-pink-200 to-pink-50"
              : enfant.genre === "Garçon"
              ? "from-sky-200 to-sky-50"
              : enfant.color
          }`}
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white font-semibold text-primary shadow-sm text-4xl">
            {enfant.initials}
          </div>
          <div>
            <h3 className="flex flex-wrap items-baseline gap-x-2 text-2xl font-semibold tracking-tight text-foreground leading-tight">
              <span className="break-words">{enfant.prenom}</span>
              <span className="break-words [overflow-wrap:anywhere]">{enfant.nom}</span>
            </h3>
            {enfant.naissance && (() => {
              const ageInfo = computeAgeInfoFromISO(enfant.naissance);
              return (
                <div className="mt-1 flex items-baseline gap-2 flex-wrap">
                  <p className="text-xs text-foreground/70">
                    {enfant.genre === "Fille" ? "Née" : enfant.genre === "Garçon" ? "Né" : "Né(e)"} le {new Date(enfant.naissance).toLocaleDateString("fr-FR")}
                  </p>
                  {ageInfo && (
                    <span
                      title={ageInfo.tooltip}
                      aria-label={`Âge : ${ageInfo.tooltip}`}
                className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-gradient-to-r from-primary to-primary/80 px-2 py-0.5 normal-case tracking-normal text-primary-foreground shadow-sm transition-transform hover:scale-105 font-medium text-xs"
                    >
                      <Cake className="h-3 w-3" aria-hidden="true" />
                      {ageInfo.label}
                    </span>
                  )}
                </div>
              );
            })()}
            {(enfant.section || enfant.classe) && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-[11px] font-medium text-primary backdrop-blur">
                  {[enfant.section, enfant.classe].filter(Boolean).join(" · ")}
                </div>
                <span className="text-[10px] font-medium text-foreground/50">
                  {currentSchoolYear()}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 sm:p-8">
          <div className="gap-3 items-start justify-start flex flex-col">
            <div className="flex shrink-0 items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Ruler className="h-3.5 w-3.5" /> Mensurations
            </div>
            <div className="min-w-0 flex-1">
              {(!enfant.tour || !enfant.tour_taille || !enfant.tour_bassin) && (
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  💡{" "}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="cursor-help underline decoration-dotted underline-offset-2">
                          N'hésitez pas à mettre à jour
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs text-xs">
                        Les enfants grandissent vite : des mensurations à jour permettent de proposer
                        une taille fiable pour chaque vêtement (notamment la blouse, où nous
                        recommandons une taille au-dessus). Vérifiez-les avant chaque commande.
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>{" "}
                  les tours manquants pour fiabiliser le choix de la taille (voir{" "}
                  <Link to="/aide/guide-tailles" className="font-semibold text-primary hover:underline">
                    guide des tailles
                  </Link>
                  ).
                </p>
              )}
              {enfant.updated_at && (
                <p className="mt-1 text-[10px] text-muted-foreground">
                  Mis à jour le{" "}
                  <span className="font-medium text-foreground">
                    {new Date(enfant.updated_at).toLocaleDateString("fr-FR", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </p>
              )}
            </div>
          </div>
          <div className="mt-4 rounded-xl border border-border/60 bg-muted/30 p-3 text-xs">
            <div className="grid gap-1.5 sm:grid-cols-3">
              <DeclLine
                label="Taille portée habituellement"
                value={enfant.taille ? `${enfant.taille} ans` : "—"}
              />
              <DeclLine
                label="Blouse FU depuis 09/2025"
                value={
                  enfant.blouse_portee_2025 === "oui"
                    ? "Oui"
                    : enfant.blouse_portee_2025 === "non"
                      ? "Non"
                      : "—"
                }
              />
              <DeclLine
                label="Taille blouse FU portée"
                value={
                  enfant.blouse_portee_2025 === "oui" && enfant.taille_blouse_2025
                    ? `${enfant.taille_blouse_2025} ans`
                    : "—"
                }
              />
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Hauteur" value={enfant.hauteur ? `${enfant.hauteur} cm` : "—"} badge={1} />
            <Field label="Tour de poitrine" value={enfant.tour ? `${enfant.tour} cm` : "—"} badge={2} />
            <Field label="Tour de taille" value={enfant.tour_taille ? `${enfant.tour_taille} cm` : "—"} badge={3} />
            <Field label="Tour de bassin" value={enfant.tour_bassin ? `${enfant.tour_bassin} cm` : "—"} badge={4} />
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-end gap-3 border-t border-border pt-5">
            {(() => {
              const reco = recommendSize({
                hauteur: enfant.hauteur,
                tour: enfant.tour,
                tour_taille: enfant.tour_taille,
                tour_bassin: enfant.tour_bassin,
              });
              if (!reco) return null;
              return (
                <div className="mr-auto flex flex-wrap items-center gap-2">
                  <SizeBadge size={reco.row.age} />
                  <span className="text-[10px] italic text-muted-foreground">
                    1ʳᵉ couche (t-shirt, polo, chemise)
                  </span>
                </div>
              );
            })()}
            <button
              onClick={onDelete}
              title="Supprimer la fiche de l'enfant"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-xs font-medium text-muted-foreground hover:border-destructive/40 hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" /> Supprimer la fiche de l'enfant
            </button>
              <button
                onClick={onEdit}
                className={`inline-flex h-9 items-center rounded-lg border px-3 text-xs font-medium ${
                  enfant.genre === "Fille"
                    ? "border-pink-300 bg-pink-100 text-pink-700 hover:bg-pink-200"
                    : enfant.genre === "Garçon"
                    ? "border-sky-300 bg-sky-100 text-sky-700 hover:bg-sky-200"
                    : "border-border bg-card text-foreground hover:bg-muted"
                }`}
              >
                Modifier
              </button>
              <Link
                to={shopHrefForSection(enfant.section)}
                className={`inline-flex h-9 items-center rounded-lg px-3 text-xs font-medium text-white ${
                  enfant.genre === "Fille"
                    ? "bg-pink-500 hover:bg-pink-600"
                    : enfant.genre === "Garçon"
                    ? "bg-sky-500 hover:bg-sky-600"
                    : "bg-primary hover:bg-primary/90"
                }`}
              >
                Voir la boutique
              </Link>
          </div>
        </div>
      </div>
      <PurchaseHistoryPreview childId={enfant.id} genre={enfant.genre} />
    </article>
  );
}

function Field({ label, value, tooltip, badge }: { label: string; value: string; tooltip?: string; badge?: number }) {
  return (
    <div className="rounded-xl border border-border bg-background px-4 py-3">
      <div className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {badge !== undefined && (
          <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
            {badge}
          </span>
        )}
        <span>{label}</span>
        {tooltip && (
          <span title={tooltip} aria-label={tooltip} className="cursor-help text-primary">
            <Info className="h-3 w-3" />
          </span>
        )}
      </div>
      <div className="mt-1 text-base font-semibold text-foreground">{value}</div>
    </div>
  );
}

function DeclLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2 sm:flex-col sm:items-start sm:gap-0.5">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span className="text-sm font-semibold text-foreground">{value}</span>
    </div>
  );
}

function shopHrefForSection(section?: string): "/maternelle" | "/college" | "/lycee" | "/boutique" {
  const s = (section || "").toLowerCase();
  if (s.includes("maternelle") || s.includes("élémentaire") || s.includes("elementaire")) return "/maternelle";
  if (s.includes("collège") || s.includes("college")) return "/college";
  if (s.includes("lycée") || s.includes("lycee")) return "/lycee";
  return "/boutique";
}