import { createFileRoute } from "@tanstack/react-router";
import { Info, Plus, Ruler } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { ShellMotif } from "@/components/SchoolMotif";

export const Route = createFileRoute("/enfants")({
  head: () => ({
    meta: [{ title: "Mes enfants — Espace familles" }],
  }),
  component: EnfantsPage,
});

const enfants = [
  {
    initials: "LM",
    prenom: "Léa",
    naissance: "12/04/2017",
    classe: "CE2",
    section: "Élémentaire",
    taille: "8 ans",
    hauteur: "128 cm",
    tour: "62 cm",
    color: "from-pink-100 to-pink-50",
  },
  {
    initials: "TM",
    prenom: "Thomas",
    naissance: "03/09/2014",
    classe: "6e B",
    section: "Collège",
    taille: "M",
    hauteur: "152 cm",
    tour: "72 cm",
    color: "from-sky-100 to-sky-50",
  },
  {
    initials: "CM",
    prenom: "Camille",
    naissance: "27/06/2020",
    classe: "Moyenne section",
    section: "Maternelle",
    taille: "5 ans",
    hauteur: "108 cm",
    tour: "55 cm",
    color: "from-amber-100 to-amber-50",
  },
];

function EnfantsPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader schoolName="Saint-Jacques de Compostelle — Dax" />

      <section className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute -top-10 right-0 -z-0 h-72 w-72 text-primary">
          <ShellMotif className="h-full w-full" opacity={0.05} />
        </div>
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
              <span className="h-px w-6 bg-gold" /> Espace famille Martin
            </span>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Mes enfants
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
              Retrouvez ici les profils de vos enfants scolarisés à Saint-Jacques de
              Compostelle. Mettez à jour leurs mensurations pour des tailles toujours
              adaptées.
            </p>
          </div>
          <button className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4" /> Ajouter un enfant
          </button>
        </div>

        <div className="mt-5 flex items-start gap-2 rounded-xl border border-border bg-secondary px-4 py-3 text-xs text-muted-foreground">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p>Ces informations permettent d'adapter les tailles proposées dans la boutique. Elles ne sont jamais partagées.</p>
        </div>

        <div className="mt-8 space-y-5">
          {enfants.map((e) => (
            <EnfantCard key={e.prenom} enfant={e} />
          ))}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

function EnfantCard({ enfant }: { enfant: (typeof enfants)[number] }) {
  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
      <div className="grid gap-0 lg:grid-cols-[280px_1fr]">
        {/* Avatar block */}
        <div className={`relative flex flex-col justify-between bg-gradient-to-br ${enfant.color} p-6`}>
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-xl font-semibold text-primary shadow-sm">
            {enfant.initials}
          </div>
          <div>
            <h3 className="text-2xl font-semibold tracking-tight text-foreground">{enfant.prenom}</h3>
            <p className="mt-1 text-xs text-foreground/70">Né(e) le {enfant.naissance}</p>
            <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-[11px] font-medium text-primary backdrop-blur">
              {enfant.section} · {enfant.classe}
            </div>
          </div>
        </div>

        {/* Info & sizes */}
        <div className="p-6 sm:p-8">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Ruler className="h-3.5 w-3.5" /> Mensurations
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Field label="Taille recommandée" value={enfant.taille} />
            <Field label="Hauteur" value={enfant.hauteur} />
            <Field label="Tour de poitrine" value={enfant.tour} />
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-border pt-5">
            <p className="text-xs text-muted-foreground">Dernière mise à jour : 02/09/2025</p>
            <div className="flex gap-2">
              <button className="inline-flex h-9 items-center rounded-lg border border-border bg-card px-3 text-xs font-medium text-foreground hover:bg-muted">
                Modifier
              </button>
              <button className="inline-flex h-9 items-center rounded-lg bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90">
                Voir la boutique
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-background px-4 py-3">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 text-base font-semibold text-foreground">{value}</div>
    </div>
  );
}