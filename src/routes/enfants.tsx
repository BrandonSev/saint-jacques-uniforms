import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Info, Plus, Ruler, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { ShellMotif } from "@/components/SchoolMotif";
import { useStore, type Child } from "@/lib/store";

export const Route = createFileRoute("/enfants")({
  head: () => ({
    meta: [{ title: "Mes enfants — Espace familles" }],
  }),
  component: EnfantsPage,
});

type ChildForm = {
  prenom: string;
  nom: string;
  naissance: string;
  classe: string;
  section: string;
  taille: string;
  hauteur: string;
  tour: string;
};

const empty: ChildForm = { prenom: "", nom: "", naissance: "", classe: "", section: "Maternelle", taille: "", hauteur: "", tour: "" };

const classesBySection: Record<string, string[]> = {
  Maternelle: ["PS", "MS", "GS"],
  Élémentaire: ["CP", "CE1", "CE2", "CM1"],
  Collège: ["CM2", "6e", "5e", "4e"],
  Lycée: ["3e", "2nde", "1re", "Terminale"],
};

function EnfantsPage() {
  const { user, profile, children, addChild, updateChild, removeChild, authLoading } = useStore();
  const { isAdmin } = useStore();
  const [editing, setEditing] = useState<Child | null>(null);
  const [creating, setCreating] = useState(false);

  if (authLoading) return null;

  if (isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader schoolName="Saint-Jacques de Compostelle — Dax" />
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
      <div className="min-h-screen bg-background">
        <SiteHeader schoolName="Saint-Jacques de Compostelle — Dax" />
        <section className="mx-auto max-w-xl px-4 py-20 text-center">
          <h1 className="text-2xl font-semibold">Espace réservé aux familles</h1>
          <p className="mt-3 text-sm text-muted-foreground">Connectez-vous pour gérer vos enfants.</p>
          <Link to="/login" className="mt-6 inline-flex h-11 items-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground">Se connecter</Link>
        </section>
      </div>
    );
  }

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
              <span className="h-px w-6 bg-gold" /> Espace famille {profile?.nom || ""}
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
            <EnfantCard key={e.id} enfant={e} onEdit={() => setEditing(e)} onDelete={async () => {
              if (confirm(`Supprimer ${e.prenom} ?`)) {
                try { await removeChild(e.id); toast.success("Enfant supprimé"); }
                catch (err: any) { toast.error(err.message); }
              }
            }} />
          ))}
        </div>
      </section>

      {(creating || editing) && (
        <ChildDialog
          initial={editing ?? empty}
          onClose={() => { setCreating(false); setEditing(null); }}
          onSave={async (data) => {
            try {
              if (editing) { await updateChild(editing.id, data); toast.success("Enfant mis à jour"); }
              else { await addChild({ ...data, naissance: data.naissance }); toast.success("Enfant ajouté"); }
              setCreating(false); setEditing(null);
            } catch (err: any) { toast.error(err.message); }
          }}
        />
      )}

      <SiteFooter />
    </div>
  );
}

function EnfantCard({ enfant, onEdit, onDelete }: { enfant: Child; onEdit: () => void; onDelete: () => void }) {
  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
      <div className="grid gap-0 lg:grid-cols-[280px_1fr]">
        <div className={`relative flex flex-col justify-between bg-gradient-to-br ${enfant.color} p-6`}>
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-xl font-semibold text-primary shadow-sm">
            {enfant.initials}
          </div>
          <div>
            <h3 className="text-2xl font-semibold tracking-tight text-foreground">{enfant.prenom} {enfant.nom}</h3>
            {enfant.naissance && <p className="mt-1 text-xs text-foreground/70">Né(e) le {new Date(enfant.naissance).toLocaleDateString("fr-FR")}</p>}
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
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Field label="Taille recommandée" value={enfant.taille || "—"} />
            <Field label="Hauteur" value={enfant.hauteur || "—"} />
            <Field label="Tour de poitrine" value={enfant.tour || "—"} />
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-border pt-5">
            <button onClick={onDelete} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive">
              <Trash2 className="h-3.5 w-3.5" /> Supprimer
            </button>
            <div className="flex gap-2">
              <button onClick={onEdit} className="inline-flex h-9 items-center rounded-lg border border-border bg-card px-3 text-xs font-medium text-foreground hover:bg-muted">
                Modifier
              </button>
              <Link to={shopHrefForSection(enfant.section)} className="inline-flex h-9 items-center rounded-lg bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90">
                Voir la boutique
              </Link>
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

function shopHrefForSection(section?: string): "/maternelle" | "/college" | "/lycee" | "/boutique" {
  const s = (section || "").toLowerCase();
  if (s.includes("maternelle") || s.includes("élémentaire") || s.includes("elementaire")) return "/maternelle";
  if (s.includes("collège") || s.includes("college")) return "/college";
  if (s.includes("lycée") || s.includes("lycee")) return "/lycee";
  return "/boutique";
}

function ChildDialog({ initial, onClose, onSave }: { initial: ChildForm | Child; onClose: () => void; onSave: (data: ChildForm) => Promise<void> }) {
  const [form, setForm] = useState<ChildForm>({
    prenom: initial.prenom, nom: initial.nom, naissance: initial.naissance,
    classe: initial.classe, section: initial.section, taille: initial.taille,
    hauteur: initial.hauteur, tour: initial.tour,
  });
  const [genre, setGenre] = useState<"Fille" | "Garçon" | "">("");
  const [saving, setSaving] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.prenom || !form.nom || !form.naissance || !form.classe || !form.section || !form.taille || !form.hauteur || !form.tour) {
      toast.error("Merci de remplir tous les champs");
      return;
    }
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={submit} className="w-full max-w-lg rounded-2xl bg-card p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{("id" in initial) ? "Modifier l'enfant" : "Ajouter un enfant"}</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <fieldset className="sm:col-span-2">
            <legend className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Genre</legend>
            <div className="mt-2 flex gap-4">
              <label className="inline-flex items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={genre === "Fille"}
                  onChange={() => setGenre(genre === "Fille" ? "" : "Fille")}
                  className="h-4 w-4 rounded border-border accent-primary"
                />
                Fille
              </label>
              <label className="inline-flex items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={genre === "Garçon"}
                  onChange={() => setGenre(genre === "Garçon" ? "" : "Garçon")}
                  className="h-4 w-4 rounded border-border accent-primary"
                />
                Garçon
              </label>
            </div>
          </fieldset>
          <Input label="Prénom *" value={form.prenom} onChange={(v) => setForm({ ...form, prenom: v })} required />
          <Input label="Nom *" value={form.nom} onChange={(v) => setForm({ ...form, nom: v })} required />
          <DateOfBirthPicker label="Date de naissance *" value={form.naissance} onChange={(v) => setForm({ ...form, naissance: v })} />
          <Select
            label="Section *"
            value={form.section}
            onChange={(v) => setForm({ ...form, section: v, classe: "" })}
            options={["Maternelle", "Élémentaire", "Collège", "Lycée"]}
          />
          <Select
            label="Classe actuelle*"
            value={form.classe}
            onChange={(v) => setForm({ ...form, classe: v })}
            options={classesBySection[form.section] ?? []}
            placeholder="Sélectionner une classe"
          />
          <div className="sm:col-span-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Input label="Taille habituellement commandée*" value={form.taille} onChange={(v) => setForm({ ...form, taille: v })} placeholder="ex: 8 ans, M" required />
            <Input label="Hauteur *" value={form.hauteur} onChange={(v) => setForm({ ...form, hauteur: v })} placeholder="ex: 128 cm" required />
            <Input label="Tour de poitrine *" value={form.tour} onChange={(v) => setForm({ ...form, tour: v })} placeholder="ex: 62 cm" required />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="h-10 rounded-lg border border-border bg-card px-4 text-sm font-medium hover:bg-muted">Annuler</button>
          <button type="submit" disabled={saving} className="h-10 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60">{saving ? "Enregistrement…" : "Enregistrer"}</button>
        </div>
      </form>
    </div>
  );
}

function Input({ label, value, onChange, type = "text", placeholder, required }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; required?: boolean }) {
  return (
    <label className="block">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      <input type={type} value={value} placeholder={placeholder} required={required} onChange={(e) => onChange(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm" />
    </label>
  );
}

function Select({ label, value, onChange, options, placeholder }: { label: string; value: string; onChange: (v: string) => void; options: string[]; placeholder?: string }) {
  return (
    <label className="block">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm">
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}

function DateOfBirthPicker({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [y, m, d] = value ? value.split("-") : ["", "", ""];
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 19 }, (_, i) => String(currentYear - i));
  const months = [
    { v: "01", n: "Janvier" }, { v: "02", n: "Février" }, { v: "03", n: "Mars" },
    { v: "04", n: "Avril" }, { v: "05", n: "Mai" }, { v: "06", n: "Juin" },
    { v: "07", n: "Juillet" }, { v: "08", n: "Août" }, { v: "09", n: "Septembre" },
    { v: "10", n: "Octobre" }, { v: "11", n: "Novembre" }, { v: "12", n: "Décembre" },
  ];
  const daysInMonth = (yy: string, mm: string) => {
    if (!yy || !mm) return 31;
    return new Date(Number(yy), Number(mm), 0).getDate();
  };
  const days = Array.from({ length: daysInMonth(y, m) }, (_, i) => String(i + 1).padStart(2, "0"));

  const update = (ny: string, nm: string, nd: string) => {
    if (ny && nm && nd) {
      const max = daysInMonth(ny, nm);
      const safeDay = Number(nd) > max ? String(max).padStart(2, "0") : nd;
      onChange(`${ny}-${nm}-${safeDay}`);
    } else {
      onChange("");
    }
  };

  return (
    <div className="block">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      <div className="mt-1 grid grid-cols-3 gap-2">
        <select value={d} onChange={(e) => update(y, m, e.target.value)} className="h-10 w-full rounded-lg border border-border bg-background px-2 text-sm">
          <option value="">Jour</option>
          {days.map((dd) => <option key={dd} value={dd}>{Number(dd)}</option>)}
        </select>
        <select value={m} onChange={(e) => update(y, e.target.value, d)} className="h-10 w-full rounded-lg border border-border bg-background px-2 text-sm">
          <option value="">Mois</option>
          {months.map((mm) => <option key={mm.v} value={mm.v}>{mm.n}</option>)}
        </select>
        <select value={y} onChange={(e) => update(e.target.value, m, d)} className="h-10 w-full rounded-lg border border-border bg-background px-2 text-sm">
          <option value="">Année</option>
          {years.map((yy) => <option key={yy} value={yy}>{yy}</option>)}
        </select>
      </div>
    </div>
  );
}