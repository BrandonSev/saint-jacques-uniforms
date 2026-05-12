import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Cake, Info, Ruler, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useStore, type Child } from "@/lib/store";
import { recommendSize } from "@/lib/sizeRecommendation";
import guideMesuresImg from "@/assets/guide-tailles-mesures.png";

export type ChildForm = {
  prenom: string;
  nom: string;
  naissance: string;
  classe: string;
  section: string;
  taille: string;
  hauteur: string;
  tour: string;
  tour_taille: string;
  tour_bassin: string;
  genre: "" | "Fille" | "Garçon";
  blouse_portee_2025: "" | "oui" | "non";
  taille_blouse_2025: string;
};

const empty: ChildForm = {
  prenom: "", nom: "", naissance: "", classe: "", section: "Maternelle",
  taille: "", hauteur: "", tour: "", tour_taille: "", tour_bassin: "", genre: "",
  blouse_portee_2025: "", taille_blouse_2025: "",
};

const classesBySection: Record<string, string[]> = {
  Maternelle: ["PS", "MS", "GS"],
  Élémentaire: ["CP", "CE1", "CE2", "CM1"],
  Collège: ["CM2", "6e", "5e", "4e"],
  Lycée: ["3e", "2nde", "1re", "Terminale"],
};

type Props = {
  open: boolean;
  initial?: ChildForm | Child;
  onClose: () => void;
  /** Optional: appelée après création réussie avec l'enfant créé. Pratique pour auto-sélectionner. */
  onCreated?: (child: Child) => void;
};

/**
 * Modal réutilisable pour ajouter ou modifier un enfant.
 * Style harmonisé : checkboxes shadcn, bg coloré selon le genre.
 */
export function AddChildDialog({ open, initial, onClose, onCreated }: Props) {
  const { addChild, updateChild, children, profile } = useStore();
  const isEdit = initial && "id" in initial;
  const defaultFamilyName = profile?.family_name || profile?.nom || "";
  const [form, setForm] = useState<ChildForm>(() => ({
    prenom: initial?.prenom ?? "",
    nom: initial?.nom ?? (isEdit ? "" : defaultFamilyName),
    naissance: initial?.naissance ?? "",
    classe: initial?.classe ?? "",
    section: initial?.section || "Maternelle",
    taille: initial?.taille ?? "",
    hauteur: initial?.hauteur ?? "",
    tour: initial?.tour ?? "",
    tour_taille: (initial as any)?.tour_taille ?? "",
    tour_bassin: (initial as any)?.tour_bassin ?? "",
    genre: (initial && "genre" in initial ? (initial.genre as ChildForm["genre"]) : "") || "",
    blouse_portee_2025: ((initial as any)?.blouse_portee_2025 ?? "") as ChildForm["blouse_portee_2025"],
    taille_blouse_2025: (initial as any)?.taille_blouse_2025 ?? "",
  }));
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const setGenre = (g: ChildForm["genre"]) =>
    setForm((f) => ({ ...f, genre: f.genre === g ? "" : g }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.prenom || !form.nom || !form.naissance || !form.classe || !form.section || !form.hauteur) {
      toast.error("Merci de remplir les champs obligatoires (prénom, nom, naissance, classe, section et hauteur)");
      return;
    }
    setSaving(true);
    try {
      if (isEdit && initial && "id" in initial) {
        await updateChild(initial.id, form);
        toast.success("Enfant mis à jour");
      } else {
        const before = new Set(children.map((c) => c.id));
        await addChild(form);
        toast.success(`${form.prenom} ajouté${form.genre === "Fille" ? "e" : ""}`);
        if (onCreated) {
          // Find the freshly created child (latest one not in `before`)
          setTimeout(() => {
            const created = children.find((c) => !before.has(c.id));
            if (created) onCreated(created);
          }, 50);
        }
      }
      onClose();
    } catch (err: any) {
      toast.error(err?.message ?? "Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const genre = form.genre;

  const node = (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className={`w-full max-w-3xl max-h-[88vh] overflow-y-auto rounded-2xl p-4 sm:p-5 shadow-xl transition-colors ${
          genre === "Fille" ? "bg-pink-100" : genre === "Garçon" ? "bg-sky-100" : "bg-card"
        }`}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-semibold">
            {isEdit ? "Modifier l'enfant" : "Ajouter un enfant"}
          </h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 grid gap-2.5 sm:grid-cols-4">
          <fieldset className="sm:col-span-4">
            <legend className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Genre *
            </legend>
            <RadioGroup
              value={genre || ""}
              onValueChange={(v) => setGenre(v as ChildForm["genre"])}
              className="mt-1.5 grid grid-cols-2 gap-2 sm:max-w-sm"
            >
              <label
                htmlFor="genre-fille"
                className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 px-3 py-2 text-sm font-medium transition-all ${
                  genre === "Fille"
                    ? "border-pink-400 bg-pink-50 text-pink-700"
                    : "border-border bg-card text-foreground hover:border-pink-200"
                }`}
              >
                <RadioGroupItem
                  id="genre-fille"
                  value="Fille"
                  className="border-pink-400 text-pink-500 data-[state=checked]:border-pink-500"
                />
                Fille
              </label>
              <label
                htmlFor="genre-garcon"
                className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 px-3 py-2 text-sm font-medium transition-all ${
                  genre === "Garçon"
                    ? "border-sky-400 bg-sky-50 text-sky-700"
                    : "border-border bg-card text-foreground hover:border-sky-200"
                }`}
              >
                <RadioGroupItem
                  id="genre-garcon"
                  value="Garçon"
                  className="border-sky-400 text-sky-500 data-[state=checked]:border-sky-500"
                />
                Garçon
              </label>
            </RadioGroup>
          </fieldset>

          <div className="sm:col-span-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:items-end">
            <Input label="Prénom *" value={form.prenom} onChange={(v) => setForm({ ...form, prenom: v })} required />
            <Input label="Nom *" value={form.nom} onChange={(v) => setForm({ ...form, nom: v })} required />
            <div className="col-span-2 sm:col-span-2">
              <DateOfBirthPicker
                label="Date de naissance *"
                value={form.naissance}
                onChange={(v) => setForm({ ...form, naissance: v })}
              />
            </div>
          </div>

          <div className="sm:col-span-4 grid grid-cols-2 gap-2.5">
            <Select
              label="Section *"
              value={form.section}
              onChange={(v) => setForm({ ...form, section: v, classe: "" })}
              options={["Maternelle", "Élémentaire", "Collège", "Lycée"]}
            />
            <Select
              label="Classe actuelle *"
              value={form.classe}
              onChange={(v) => setForm({ ...form, classe: v })}
              options={classesBySection[form.section] ?? []}
              placeholder="Sélectionner une classe"
            />
          </div>

          <div className="sm:col-span-4 mt-2 flex items-center gap-3">
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
              <Ruler className="h-4 w-4 text-primary" />
              Mensurations
            </span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <div className="sm:col-span-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-start">
            <div className="flex flex-col gap-2.5 sm:self-center">
              <div className="grid items-stretch gap-2.5 sm:grid-cols-2">
                <div className="rounded-xl border border-border bg-background/60 p-2.5">
                  <SizeSelect
                    label="Taille portée habituellement ?"
                    value={form.taille}
                    onChange={(v) => setForm({ ...form, taille: v })}
                    tooltip="Quelle taille achetez-vous habituellement pour votre enfant (dans le commerce) ?"
                  />
                </div>
                <div className="rounded-xl border border-border bg-background/60 p-2.5 flex flex-col gap-2">
                  <LabelWithTooltip
                    label={`Nouvelle blouse "FU" depuis la rentrée 09/2025 ?`}
                    tooltip="Votre enfant a-t-il porté une blouse France Uniformes depuis septembre 2025 ?"
                  />
                  <div className="flex gap-2">
                    {(["oui", "non"] as const).map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() =>
                          setForm((f) => ({
                            ...f,
                            blouse_portee_2025: f.blouse_portee_2025 === v ? "" : v,
                            taille_blouse_2025: v === "non" ? "" : f.taille_blouse_2025,
                          }))
                        }
                        className={`flex-1 h-10 rounded-lg border-2 text-sm font-medium capitalize transition-all ${
                          form.blouse_portee_2025 === v
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-card text-foreground hover:border-primary/40"
                        }`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                  {form.blouse_portee_2025 === "oui" && (
                    <SizeSelect
                      label={`Taille de blouse "FU" portée ?`}
                      value={form.taille_blouse_2025}
                      onChange={(v) => setForm({ ...form, taille_blouse_2025: v })}
                      tooltip="Quelle taille de blouse a-t-il porté cette année ? Selon vous, quelle taille était la plus adaptée par rapport au modèle fourni par France Uniformes ?"
                    />
                  )}
                </div>
              </div>
              <div className="rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-[11px] leading-relaxed text-foreground/80">
                <span className="font-semibold text-primary">Conseil :</span> renseignez aussi le tour de poitrine, de taille et de bassin pour fiabiliser le choix de la taille. Les numéros correspondent au{" "}
                <a
                  href="/aide/guide-tailles"
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-primary underline-offset-2 hover:underline"
                >
                  guide des tailles
                </a>.
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <Input
                  label="Hauteur (stature)*"
                  value={form.hauteur}
                  onChange={(v) => setForm({ ...form, hauteur: v })}
                  placeholder="ex: 128"
                  suffix="cm"
                  required
                  badge={1}
                />
                <Input
                  label="Tour de poitrine"
                  value={form.tour}
                  onChange={(v) => setForm({ ...form, tour: v })}
                  placeholder="ex: 62"
                  suffix="cm"
                  badge={2}
                />
                <Input
                  label="Tour de taille"
                  value={form.tour_taille}
                  onChange={(v) => setForm({ ...form, tour_taille: v })}
                  placeholder="ex: 56"
                  suffix="cm"
                  badge={3}
                />
                <Input
                  label="Tour de bassin"
                  value={form.tour_bassin}
                  onChange={(v) => setForm({ ...form, tour_bassin: v })}
                  placeholder="ex: 64"
                  suffix="cm"
                  badge={4}
                />
              </div>
              <LiveSizeRecommendation
                hauteur={form.hauteur}
                tour={form.tour}
                tour_taille={form.tour_taille}
                tour_bassin={form.tour_bassin}
                className="sm:hidden"
              />
            </div>
            <div className="flex justify-center rounded-xl border border-border bg-background/60 p-2 sm:w-[18.4rem]">
              <img
                src={guideMesuresImg}
                alt="Schéma des mesures : 1 hauteur, 2 tour de poitrine, 3 tour de taille, 4 tour de bassin"
                className="h-auto max-h-64 w-auto object-contain sm:max-h-[30rem]"
                loading="lazy"
              />
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-end gap-2 sm:flex-nowrap">
          <div className="hidden sm:block sm:mr-auto sm:w-1/2 sm:max-w-[calc(50%-0.5rem)]">
            <LiveSizeRecommendation
              hauteur={form.hauteur}
              tour={form.tour}
              tour_taille={form.tour_taille}
              tour_bassin={form.tour_bassin}
            />
          </div>
          <button type="button" onClick={onClose} className="h-10 rounded-lg border border-border bg-card px-4 text-sm font-medium hover:bg-muted">
            Annuler
          </button>
          <button type="submit" disabled={saving} className="h-10 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
            {saving ? "Enregistrement…" : isEdit ? "Enregistrer" : "Ajouter l'enfant"}
          </button>
        </div>
      </form>
    </div>
  );

  if (typeof document === "undefined") return node;
  return createPortal(node, document.body);
}

export { empty as emptyChildForm };

/* ----------------------- Live size recommendation ----------------------- */

function LiveSizeRecommendation({
  hauteur, tour, tour_taille, tour_bassin, className,
}: { hauteur: string; tour: string; tour_taille: string; tour_bassin: string; className?: string }) {
  const reco = useMemo(
    () => recommendSize({ hauteur, tour, tour_taille, tour_bassin }),
    [hauteur, tour, tour_taille, tour_bassin],
  );
  const filledCount = [hauteur, tour, tour_taille, tour_bassin].filter((v) => v && v.trim() !== "").length;

  if (!reco) {
    return (
      <div className={`flex flex-col items-start gap-1 rounded-xl border border-dashed border-border bg-muted/40 px-3 py-2.5 text-[11px] text-muted-foreground ${className ?? ""}`}>
        <Sparkles className="h-3.5 w-3.5 text-primary/60" />
        Saisissez au moins une mesure pour voir la taille recommandée.
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col items-start gap-1.5 rounded-xl px-3 py-2.5 text-xs shadow-sm bg-emerald-50 ring-2 ring-inset ring-emerald-700 ${className ?? ""}`}
    >
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-emerald-700" />
        <span className="font-medium text-foreground">
          Taille recommandée :{" "}
          <span className="text-base font-bold text-emerald-800">
            {reco.row.age}
          </span>
        </span>
        <span className="rounded-full bg-emerald-700 px-1.5 py-0.5 text-[9px] font-bold uppercase text-white">
          Reco
        </span>
      </div>
      <span className="text-[11px] text-muted-foreground">
        {filledCount}/4 mesure{filledCount > 1 ? "s" : ""} renseignée{filledCount > 1 ? "s" : ""}
      </span>
      <span className="text-[11px] italic text-muted-foreground">
        Pour une 1ʳᵉ couche : body, t-shirt, polo, chemise.
      </span>
    </div>
  );
}

/* ------------------------- Sub-components ------------------------- */

function Input({
  label, value, onChange, type = "text", placeholder, required, suffix, tooltip, badge,
}: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; required?: boolean; suffix?: string; tooltip?: string; badge?: number;
}) {
  const [tipOpen, setTipOpen] = useState(false);
  const tipRef = useRef<HTMLSpanElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [tipPos, setTipPos] = useState<{ top: number; left: number } | null>(null);
  useEffect(() => {
    if (!tipOpen) return;
    const onClick = (e: MouseEvent) => {
      if (tipRef.current && !tipRef.current.contains(e.target as Node)) setTipOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [tipOpen]);
  useEffect(() => {
    if (!tipOpen || !btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    setTipPos({ top: r.bottom + 6, left: r.left + r.width / 2 });
  }, [tipOpen]);
  return (
    <label className="flex flex-col">
      <span className="line-clamp-2 inline-flex min-h-[2rem] items-start gap-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {badge !== undefined && (
          <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
            {badge}
          </span>
        )}
        <span>{label}</span>
        {tooltip && (
          <span ref={tipRef} className="relative inline-flex">
            <button
              ref={btnRef}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setTipOpen((v) => !v);
              }}
              title={tooltip}
              aria-label={tooltip}
              aria-expanded={tipOpen}
              className="cursor-help text-primary"
            >
              <Info className="h-3 w-3" />
            </button>
            {tipOpen && tipPos && typeof document !== "undefined" &&
              createPortal(
                <span
                  role="tooltip"
                  style={{ position: "fixed", top: tipPos.top, left: tipPos.left, transform: "translateX(-50%)" }}
                  className="z-[80] w-56 max-w-[calc(100vw-2rem)] rounded-md border border-border bg-popover px-2.5 py-2 text-[11px] font-normal normal-case tracking-normal text-popover-foreground shadow-md"
                >
                  {tooltip}
                </span>,
                document.body,
              )
            }
          </span>
        )}
      </span>
      <div className="relative mt-auto">
        <input
          type={type}
          value={value}
          placeholder={placeholder}
          required={required}
          onChange={(e) => onChange(e.target.value)}
          className={`h-10 w-full rounded-lg border border-border bg-background px-3 text-sm ${suffix ? "pr-10" : ""}`}
        />
        {suffix && (
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-medium text-muted-foreground">
            {suffix}
          </span>
        )}
      </div>
    </label>
  );
}

function Select({
  label, value, onChange, options, placeholder,
}: { label: string; value: string; onChange: (v: string) => void; options: string[]; placeholder?: string }) {
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
  const [parts, setParts] = useState<{ y: string; m: string; d: string }>(() => {
    if (value) {
      const [yy, mm, dd] = value.split("-");
      return { y: yy ?? "", m: mm ?? "", d: dd ?? "" };
    }
    return { y: "", m: "", d: "" };
  });
  const { y, m, d } = parts;
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
    let safeDay = nd;
    if (ny && nm && nd) {
      const max = daysInMonth(ny, nm);
      if (Number(nd) > max) safeDay = String(max).padStart(2, "0");
    }
    setParts({ y: ny, m: nm, d: safeDay });
    onChange(ny && nm && safeDay ? `${ny}-${nm}-${safeDay}` : "");
  };

  const computeAge = () => {
    if (!y || !m || !d) return null;
    const birth = new Date(Number(y), Number(m) - 1, Number(d));
    const today = new Date();
    let years = today.getFullYear() - birth.getFullYear();
    let months = today.getMonth() - birth.getMonth();
    const days = today.getDate() - birth.getDate();
    if (days < 0) months--;
    if (months < 0) {
      years--;
      months += 12;
    }
    // Total months since birth (used for newborn / <1 an logic)
    let totalMonths = years * 12 + months;
    if (totalMonths < 0 || years > 120) return null;
    return { years, months, totalMonths };
  };
  const age = computeAge();
  const ageInfo = (() => {
    if (!age) return null;
    const { years, months, totalMonths } = age;
    let label: string;
    let tooltip: string;
    if (totalMonths < 1) {
      label = "Nouveau-né";
      tooltip = "Moins d'un mois";
    } else if (years === 0) {
      label = `${totalMonths} mois`;
      tooltip = `${totalMonths} mois`;
    } else if (years === 1 && months === 0) {
      label = "1 an";
      tooltip = "1 an pile";
    } else {
      const half = months >= 6 ? " et demi" : "";
      label = `${years} an${years > 1 ? "s" : ""}${half}`;
      tooltip = `${years} an${years > 1 ? "s" : ""} et ${months} mois`;
    }
    return { label, tooltip };
  })();

  return (
    <div className="flex h-full flex-col">
      <div className="line-clamp-2 inline-flex min-h-[2rem] items-start justify-between gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        <span>{label}</span>
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
      <div className="mt-auto grid grid-cols-3 gap-2">
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