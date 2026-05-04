import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Mail, MapPin, Phone, User, Users, Plus, Trash2, Home, Truck, KeyRound, Lock } from "lucide-react";
import { toast } from "sonner";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { RequireAuth } from "@/components/RequireAuth";
import { useStore, type FamilyParent } from "@/lib/store";
import { PageWatermark } from "@/components/PageWatermark";
import { AddChildDialog } from "@/components/AddChildDialog";

export const Route = createFileRoute("/famille")({
  head: () => ({
    meta: [{ title: "Ma famille — Espace familles" }],
  }),
  component: () => (
    <RequireAuth>
      <FamillePage />
    </RequireAuth>
  ),
});

function FamillePage() {
  const {
    profile,
    user,
    updateProfile,
    children,
    parents,
    addParent,
    updateParent,
    removeParent,
    authLoading,
    isAdmin,
  } = useStore();

  const navigate = useNavigate();
  useEffect(() => {
    if (isAdmin) navigate({ to: "/admin" });
  }, [isAdmin, navigate]);
  if (isAdmin) return null;

  const [familyName, setFamilyName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [openAddChild, setOpenAddChild] = useState(false);

  useEffect(() => {
    if (profile) {
      setFamilyName(profile.family_name || profile.nom || "");
    }
  }, [profile]);

  if (authLoading) return null;

  const handleSaveName = async () => {
    setSavingName(true);
    try {
      await updateProfile({ family_name: familyName.trim() });
      toast.success("Nom de famille enregistré");
    } catch (err: any) {
      toast.error(err?.message ?? "Erreur");
    } finally {
      setSavingName(false);
    }
  };

  const handleAddParent = async () => {
    try {
      await addParent({
        role: parents.length === 0 ? "Mère" : parents.length === 1 ? "Père" : "Parent",
      });
      toast.success("Parent ajouté");
    } catch (err: any) {
      toast.error(err?.message ?? "Erreur");
    }
  };

  const displayedFamilyName = profile?.family_name || profile?.nom || "";

  return (
    <div className="relative flex min-h-screen flex-col bg-background/80">
      <PageWatermark />
      <SiteHeader schoolName="Saint-Jacques-de-Compostelle — Dax" />
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">Espace familles</span>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {displayedFamilyName ? `Famille ${displayedFamilyName}` : "Ma famille"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Gérez le nom de la famille, les parents et l'accès à la fiche des enfants.
          </p>
        </div>

        {/* Boîte indépendante : Nom de la famille */}
        <div className="mt-8 rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Home className="h-4 w-4 text-primary" /> Nom de la famille
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Ce nom apparaît en titre. Il représente votre famille.</p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <input
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
              placeholder="Nom de la famille"
              maxLength={80}
              className="h-11 md:flex-1 rounded-lg border border-border bg-background px-3 text-sm"
            />
            <button
              onClick={handleSaveName}
              disabled={savingName}
              className="h-11 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-card)] hover:bg-primary/90 disabled:opacity-50"
            >
              {savingName ? "Enregistrement…" : "Enregistrer"}
            </button>
          </div>
        </div>

        {/* Boîte indépendante : Code établissement (lecture seule) */}
        <div className="mt-6 rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <KeyRound className="h-4 w-4 text-primary" /> Code établissement
            <Lock className="ml-1 h-3 w-3 text-muted-foreground" />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Code transmis par l'école au moment de l'inscription. Cette information est en lecture seule. Pour toute
            modification, contactez le secrétariat de l'établissement.
          </p>
          <div className="mt-4">
            <input
              value={profile?.code_etablissement || "—"}
              readOnly
              disabled
              className="h-11 w-full max-w-sm rounded-lg border border-dashed border-border bg-muted/40 px-3 text-sm font-mono tracking-wider text-foreground"
            />
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            {parents.length === 0 && (
              <ParentCard
                key="initial"
                parent={{
                  id: "__new__",
                  role: "Mère",
                  civilite: profile?.civilite || "Mme",
                  prenom: profile?.prenom || "",
                  nom: profile?.nom || "",
                  email: user?.email ?? profile?.email ?? "",
                  telephone: profile?.telephone ?? "",
                  adresse: profile?.adresse ?? "",
                  code_postal: profile?.code_postal ?? "",
                  ville: profile?.ville ?? "",
                  is_primary: true,
                  position: 0,
                  is_shipping_default: true,
                  has_alt_shipping: false,
                  shipping_label: null,
                  shipping_adresse: null,
                  shipping_code_postal: null,
                  shipping_ville: null,
                }}
                index={0}
                isDraft
                onSave={async (patch) => {
                  await addParent(patch);
                  toast.success("Premier membre enregistré");
                }}
                onRemove={null}
                primaryAddress={null}
              />
            )}

            {parents.map((p, idx) => (
              <ParentCard
                key={p.id}
                parent={p}
                index={idx}
                isDraft={false}
                onSave={async (patch) => {
                  await updateParent(p.id, patch);
                  toast.success("Membre mis à jour");
                }}
                onRemove={
                  parents.length > 1
                    ? async () => {
                        await removeParent(p.id);
                        toast.success("Membre retiré");
                      }
                    : null
                }
                primaryAddress={
                  idx === 0
                    ? null
                    : {
                        adresse: parents[0]?.adresse ?? "",
                        code_postal: parents[0]?.code_postal ?? "",
                        ville: parents[0]?.ville ?? "",
                      }
                }
              />
            ))}

            {parents.length > 0 && (
              <button
                onClick={handleAddParent}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-card/50 px-4 py-5 text-sm font-semibold text-muted-foreground transition hover:border-primary hover:text-primary"
              >
                <Plus className="h-4 w-4" /> Ajouter un membre de la famille
              </button>
            )}
          </div>

          <aside className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Users className="h-4 w-4 text-primary" /> {parents.length >= 2 ? "Nos enfants" : "Mes enfants"}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {children.length === 0
                ? "Aucun enfant enregistré pour le moment."
                : `${children.length} enfant${children.length > 1 ? "s" : ""} dans votre famille.`}
            </p>
            {children.length > 0 && (
              <ul className="mt-3 space-y-1.5">
                {children.map((c) => {
                  const tone =
                    c.genre === "Fille"
                      ? { border: "border-pink-300", badge: "bg-pink-500 text-white", name: "text-pink-700" }
                      : c.genre === "Garçon"
                        ? { border: "border-sky-300", badge: "bg-sky-500 text-white", name: "text-sky-700" }
                        : { border: "border-border", badge: "bg-primary/10 text-primary", name: "text-foreground" };
                  return (
                    <li
                      key={c.id}
                      className={`flex items-center gap-2.5 rounded-lg border ${tone.border} bg-background px-2.5 py-1.5`}
                    >
                      <span
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${tone.badge}`}
                      >
                        {c.initials}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className={`truncate text-sm font-semibold ${tone.name}`}>
                          {c.prenom} {c.nom}
                        </div>
                        <div className="truncate text-[11px] text-muted-foreground">
                          {c.section || "—"} {c.classe ? `· ${c.classe}` : ""}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
            <button
              type="button"
              onClick={() => setOpenAddChild(true)}
              className="mt-4 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-3.5 w-3.5" /> Ajouter un enfant
            </button>
            <Link
              to="/enfants"
              className="mt-2 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-primary/30 bg-primary/5 px-3 text-xs font-semibold text-primary hover:bg-primary/10"
            >
              Gérer mes enfants
            </Link>
          </aside>
        </div>
      </section>
      <AddChildDialog
        open={openAddChild}
        onClose={() => setOpenAddChild(false)}
        onCreated={() => toast.success("Enfant ajouté")}
      />
      <SiteFooter />
    </div>
  );
}

const ROLE_OPTIONS = ["Mère", "Père", "Tuteur", "Tutrice", "Beau-père", "Belle-mère", "Grand-parent", "Autre"];

function ParentCard({
  parent,
  index,
  isDraft,
  onSave,
  onRemove,
  primaryAddress,
}: {
  parent: FamilyParent;
  index: number;
  isDraft: boolean;
  onSave: (patch: Partial<Omit<FamilyParent, "id">>) => Promise<void>;
  onRemove: null | (() => Promise<void>);
  primaryAddress: { adresse: string; code_postal: string; ville: string } | null;
}) {
  const initialAdresse = parent.adresse || primaryAddress?.adresse || "";
  const initialCp = parent.code_postal || primaryAddress?.code_postal || "";
  const initialVille = parent.ville || primaryAddress?.ville || "";
  const initialRoleIsKnown = ROLE_OPTIONS.includes(parent.role || "Parent");
  const [roleSelect, setRoleSelect] = useState(
    initialRoleIsKnown ? (parent.role || "Parent") : "Autre",
  );
  const [roleCustom, setRoleCustom] = useState(initialRoleIsKnown ? "" : parent.role || "");
  const [form, setForm] = useState({
    role: parent.role || "Parent",
    civilite: parent.civilite || "Mme",
    prenom: parent.prenom || "",
    nom: parent.nom || "",
    email: parent.email || "",
    telephone: parent.telephone || "",
    adresse: initialAdresse,
    code_postal: initialCp,
    ville: initialVille,
    is_shipping_default: parent.is_shipping_default ?? true,
    has_alt_shipping: parent.has_alt_shipping ?? false,
    shipping_label: parent.shipping_label || "",
    shipping_adresse: parent.shipping_adresse || "",
    shipping_code_postal: parent.shipping_code_postal || "",
    shipping_ville: parent.shipping_ville || "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const known = ROLE_OPTIONS.includes(parent.role || "Parent");
    setRoleSelect(known ? (parent.role || "Parent") : "Autre");
    setRoleCustom(known ? "" : parent.role || "");
    setForm({
      role: parent.role || "Parent",
      civilite: parent.civilite || "Mme",
      prenom: parent.prenom || "",
      nom: parent.nom || "",
      email: parent.email || "",
      telephone: parent.telephone || "",
      adresse: parent.adresse || primaryAddress?.adresse || "",
      code_postal: parent.code_postal || primaryAddress?.code_postal || "",
      ville: parent.ville || primaryAddress?.ville || "",
      is_shipping_default: parent.is_shipping_default ?? true,
      has_alt_shipping: parent.has_alt_shipping ?? false,
      shipping_label: parent.shipping_label || "",
      shipping_adresse: parent.shipping_adresse || "",
      shipping_code_postal: parent.shipping_code_postal || "",
      shipping_ville: parent.shipping_ville || "",
    });
  }, [parent, primaryAddress?.adresse, primaryAddress?.code_postal, primaryAddress?.ville]);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(form);
    } catch (err: any) {
      toast.error(err?.message ?? "Erreur");
    } finally {
      setSaving(false);
    }
  };

  const roleLabels: Record<string, string> = {
    Mère: "Mère de famille",
    Père: "Père de famille",
    Tuteur: "Tuteur légal",
    Tutrice: "Tutrice légale",
    "Beau-père": "Beau-père",
    "Belle-mère": "Belle-mère",
    "Grand-parent": "Grand-parent",
    Autre: "Autre membre",
    Parent: "Parent",
  };
  const title = roleLabels[form.role] || form.role || `Membre ${index + 1}`;

  return (
    <form onSubmit={handleSubmit} className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <User className="h-4 w-4 text-primary" /> {title}
        </div>
        {onRemove && (
          <button
            type="button"
            onClick={async () => {
              if (confirm("Retirer ce membre ?")) await onRemove();
            }}
            className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:border-[var(--rouge)]/40 hover:text-[var(--rouge)]"
          >
            <Trash2 className="h-3.5 w-3.5" /> Retirer
          </button>
        )}
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Field label="Rôle">
          <select
            value={roleSelect}
            onChange={(e) => {
              const v = e.target.value;
              setRoleSelect(v);
              if (v === "Autre") {
                set("role", roleCustom.trim() || "Autre");
              } else {
                set("role", v);
              }
            }}
            className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm"
          >
            {ROLE_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          {roleSelect === "Autre" && (
            <input
              value={roleCustom}
              onChange={(e) => {
                setRoleCustom(e.target.value);
                set("role", e.target.value.trim() || "Autre");
              }}
              placeholder="Précisez le rôle (ex. Marraine, Oncle…)"
              maxLength={60}
              className="mt-2 h-11 w-full rounded-lg border border-border bg-background px-3 text-sm"
            />
          )}
        </Field>
        <Field label="Civilité">
          <select
            value={form.civilite}
            onChange={(e) => set("civilite", e.target.value)}
            className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm"
          >
            <option value="Mme">Mme</option>
            <option value="M.">M.</option>
          </select>
        </Field>
        <Field label="Prénom">
          <input
            required
            value={form.prenom}
            onChange={(e) => set("prenom", e.target.value)}
            className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm"
          />
        </Field>
        <Field label="Nom">
          <input
            required
            value={form.nom}
            onChange={(e) => set("nom", e.target.value)}
            className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm"
          />
        </Field>
        <Field label="Email">
          <div className="flex h-11 items-center gap-2 rounded-lg border border-border bg-background px-3">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <input
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              className="h-full w-full bg-transparent text-sm outline-none"
              placeholder="parent@email.fr"
            />
          </div>
        </Field>
        <Field label="Téléphone">
          <div className="flex h-11 items-center gap-2 rounded-lg border border-border bg-background px-3">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <input
              value={form.telephone}
              onChange={(e) => set("telephone", e.target.value)}
              className="h-full w-full bg-transparent text-sm outline-none"
              placeholder="06 12 34 56 78"
            />
          </div>
        </Field>
        <Field label="Adresse" full>
          <div className="flex h-11 items-center gap-2 rounded-lg border border-border bg-background px-3">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <input
              value={form.adresse}
              onChange={(e) => set("adresse", e.target.value)}
              className="h-full w-full bg-transparent text-sm outline-none"
              placeholder="Numéro et rue"
            />
          </div>
        </Field>
        <Field label="Code postal">
          <input
            value={form.code_postal}
            onChange={(e) => set("code_postal", e.target.value)}
            className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm"
          />
        </Field>
        <Field label="Ville">
          <input
            value={form.ville}
            onChange={(e) => set("ville", e.target.value)}
            className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm"
          />
        </Field>
      </div>

      {/* Options de livraison */}
      <div className="mt-5 space-y-3 rounded-2xl border border-border bg-muted/30 p-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={form.is_shipping_default}
            onChange={(e) => set("is_shipping_default", e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-border accent-primary"
          />
          <span className="text-sm text-foreground">
            <span className="font-medium">Adresse de livraison par défaut</span>
            <span className="block text-xs text-muted-foreground">
              Les commandes seront livrées à l'adresse ci-dessus.
            </span>
          </span>
        </label>

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={form.has_alt_shipping}
            onChange={(e) => {
              const checked = e.target.checked;
              const isSecondary = index >= 1;
              setForm((f) => ({
                ...f,
                has_alt_shipping: checked,
                shipping_adresse: checked && isSecondary && !f.shipping_adresse ? f.adresse : f.shipping_adresse,
                shipping_code_postal:
                  checked && isSecondary && !f.shipping_code_postal ? f.code_postal : f.shipping_code_postal,
                shipping_ville: checked && isSecondary && !f.shipping_ville ? f.ville : f.shipping_ville,
              }));
            }}
            className="mt-0.5 h-4 w-4 rounded border-border accent-primary"
          />
          <span className="text-sm text-foreground">
            <span className="font-medium">Adresse de livraison différente</span>
            <span className="block text-xs text-muted-foreground">
              Cochez pour livrer à une autre adresse (ex. lieu de travail, autre domicile).
              {index >= 1 && " L'adresse principale sera recopiée automatiquement, vous pourrez ensuite la modifier."}
            </span>
          </span>
        </label>

        {form.has_alt_shipping && (
          <div className="mt-2 grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-2">
            <div className="flex items-center gap-2 sm:col-span-2 text-xs font-semibold uppercase tracking-wider text-primary">
              <Truck className="h-3.5 w-3.5" /> Adresse de livraison
            </div>
            <Field label="Nom de l'adresse" full>
              <input
                value={form.shipping_label}
                onChange={(e) => set("shipping_label", e.target.value)}
                placeholder="Ex. Bureau, Domicile mère, Grands-parents…"
                className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm"
              />
            </Field>
            <Field label="Adresse (numéro et rue)" full>
              <input
                value={form.shipping_adresse}
                onChange={(e) => set("shipping_adresse", e.target.value)}
                className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm"
              />
            </Field>
            <Field label="Code postal">
              <input
                value={form.shipping_code_postal}
                onChange={(e) => set("shipping_code_postal", e.target.value)}
                className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm"
              />
            </Field>
            <Field label="Ville">
              <input
                value={form.shipping_ville}
                onChange={(e) => set("shipping_ville", e.target.value)}
                className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm"
              />
            </Field>
          </div>
        )}
      </div>

      <div className="mt-6 flex items-center justify-end gap-3">
        <button
          type="submit"
          disabled={saving}
          className="h-11 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-card)] hover:bg-primary/90 disabled:opacity-50"
        >
          {saving ? "Enregistrement…" : isDraft ? "Enregistrer ce membre" : "Enregistrer"}
        </button>
      </div>
    </form>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <label className={`flex flex-col gap-1.5 ${full ? "sm:col-span-2" : ""}`}>
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
