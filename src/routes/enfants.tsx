import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Info, Plus, Ruler, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { ShellMotif } from "@/components/SchoolMotif";
import { useStore, type Child } from "@/lib/store";
import { PurchaseHistoryPreview } from "@/components/PurchaseHistoryPreview";
import { AddChildDialog } from "@/components/AddChildDialog";
import { PageWatermark } from "@/components/PageWatermark";

export const Route = createFileRoute("/enfants")({
  head: () => ({
    meta: [{ title: "Mes enfants — Espace familles" }],
  }),
  validateSearch: (search: Record<string, unknown>): { add?: 1 } => ({
    add: search.add === 1 || search.add === "1" ? 1 : undefined,
  }),
  component: EnfantsPage,
});

function computeAgeFromISO(iso: string): number | null {
  if (!iso) return null;
  const birth = new Date(iso);
  if (isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const mDiff = today.getMonth() - birth.getMonth();
  if (mDiff < 0 || (mDiff === 0 && today.getDate() < birth.getDate())) age--;
  if (age < 0 || age > 120) return null;
  return age;
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

      <section className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
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
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-xl font-semibold text-primary shadow-sm">
            {enfant.initials}
          </div>
          <div>
            <h3 className="text-2xl font-semibold tracking-tight text-foreground">{enfant.prenom} {enfant.nom}</h3>
            {enfant.naissance && (() => {
              const age = computeAgeFromISO(enfant.naissance);
              return (
                <div className="mt-1 flex items-baseline gap-2 flex-wrap">
                  <p className="text-xs text-foreground/70">
                    {enfant.genre === "Fille" ? "Née" : enfant.genre === "Garçon" ? "Né" : "Né(e)"} le {new Date(enfant.naissance).toLocaleDateString("fr-FR")}
                  </p>
                  {age !== null && (
                    <span className="text-xs font-bold text-foreground/70">
                      · {age} ans
                    </span>
                  )}
                </div>
              );
            })()}
            {(enfant.section || enfant.classe) && (
              <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-[11px] font-medium text-primary backdrop-blur">
                {[enfant.section, enfant.classe].filter(Boolean).join(" · ")}
              </div>
            )}
          </div>
        </div>

        <div className="p-6 sm:p-8">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Ruler className="h-3.5 w-3.5" /> Mensurations
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <Field
              label="Taille portée"
              value={enfant.taille ? `${enfant.taille} ans` : "—"}
              tooltip="A titre d'information, taille que vous avez l'habitude d'acheter pour votre enfant actuellement"
            />
            <Field label="Hauteur" value={enfant.hauteur ? `${enfant.hauteur} cm` : "—"} badge={1} />
            <Field label="Tour de poitrine" value={enfant.tour ? `${enfant.tour} cm` : "—"} badge={2} />
            <Field label="Tour de taille" value={enfant.tour_taille ? `${enfant.tour_taille} cm` : "—"} badge={3} />
            <Field label="Tour de bassin" value={enfant.tour_bassin ? `${enfant.tour_bassin} cm` : "—"} badge={4} />
          </div>
          {(!enfant.tour || !enfant.tour_taille || !enfant.tour_bassin) && (
            <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
              💡 Renseignez les tours manquants pour fiabiliser le choix de la taille (voir{" "}
              <Link to="/aide/guide-tailles" className="font-semibold text-primary hover:underline">
                guide des tailles
              </Link>
              ).
            </p>
          )}

          <div className="mt-6 flex items-center justify-end gap-2 border-t border-border pt-5">
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

function shopHrefForSection(section?: string): "/maternelle" | "/college" | "/lycee" | "/boutique" {
  const s = (section || "").toLowerCase();
  if (s.includes("maternelle") || s.includes("élémentaire") || s.includes("elementaire")) return "/maternelle";
  if (s.includes("collège") || s.includes("college")) return "/college";
  if (s.includes("lycée") || s.includes("lycee")) return "/lycee";
  return "/boutique";
}