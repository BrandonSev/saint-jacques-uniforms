import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Mail, MapPin, Phone, User, Users } from "lucide-react";
import { toast } from "sonner";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { RequireAuth } from "@/components/RequireAuth";
import { useStore } from "@/lib/store";

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
  const { profile, user, updateProfile, children, authLoading } = useStore();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    civilite: "Mme",
    prenom: "",
    nom: "",
    telephone: "",
    adresse: "",
    code_postal: "",
    ville: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setForm({
        civilite: profile.civilite || "Mme",
        prenom: profile.prenom || "",
        nom: profile.nom || "",
        telephone: profile.telephone || "",
        adresse: profile.adresse || "",
        code_postal: profile.code_postal || "",
        ville: profile.ville || "",
      });
    }
  }, [profile]);

  if (authLoading) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile(form);
      toast.success("Coordonnées mises à jour");
    } catch (err: any) {
      toast.error(err?.message ?? "Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader schoolName="Saint-Jacques de Compostelle — Dax" />
      <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
            Espace familles
          </span>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {profile?.nom ? `Famille ${profile.nom}` : "Ma famille"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Mettez à jour vos coordonnées et accédez à la fiche de vos enfants.
          </p>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <form
            onSubmit={handleSave}
            className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-card)] lg:col-span-2"
          >
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <User className="h-4 w-4 text-primary" /> Coordonnées de la famille
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="Civilité">
                <select
                  value={form.civilite}
                  onChange={(e) => set("civilite", e.target.value)}
                  className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm"
                >
                  <option value="Mme">Mme</option>
                  <option value="M.">M.</option>
                  <option value="Mme et M.">Mme et M.</option>
                </select>
              </Field>
              <Field label="Email">
                <div className="flex h-11 items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span className="truncate">{user?.email ?? profile?.email}</span>
                </div>
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

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate({ to: "/boutique" })}
                className="h-11 rounded-lg border border-border bg-card px-4 text-sm font-medium text-foreground hover:bg-muted"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={saving}
                className="h-11 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-card)] hover:bg-primary/90 disabled:opacity-50"
              >
                {saving ? "Enregistrement…" : "Enregistrer"}
              </button>
            </div>
          </form>

          <aside className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Users className="h-4 w-4 text-primary" /> Mes enfants
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {children.length === 0
                ? "Aucun enfant enregistré pour le moment."
                : `${children.length} enfant${children.length > 1 ? "s" : ""} dans votre famille.`}
            </p>
            {children.length > 0 && (
              <ul className="mt-4 space-y-2">
                {children.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-center gap-3 rounded-xl border border-border bg-background px-3 py-2"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      {c.initials}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-foreground">
                        {c.prenom} {c.nom}
                      </div>
                      <div className="truncate text-xs text-muted-foreground">
                        {c.section || "—"} {c.classe ? `· ${c.classe}` : ""}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <Link
              to="/enfants"
              className="mt-5 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 text-sm font-semibold text-primary hover:bg-primary/10"
            >
              Gérer mes enfants
            </Link>
          </aside>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}

function Field({
  label,
  children,
  full,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <label className={`flex flex-col gap-1.5 ${full ? "sm:col-span-2" : ""}`}>
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}