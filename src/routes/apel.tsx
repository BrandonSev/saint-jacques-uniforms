import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Download, Send, ShieldCheck, Search, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { RequireAuth } from "@/components/RequireAuth";
import { useStore } from "@/lib/store";
import { toast } from "sonner";
import { apelListFamilies, sendApelReminders } from "@/lib/server/apel.functions";
import { formatCivilite } from "@/lib/utils";

const SCHOOL_LABEL = "Saint-Jacques-de-Compostelle — Dax";
const SCHOOL_SHORT = "Saint-Jacques";
const DEADLINE = "24 mai 2026";

export const Route = createFileRoute("/apel")({
  head: () => ({ meta: [{ title: `APEL — Suivi des commandes — ${SCHOOL_SHORT}` }] }),
  component: () => (
    <RequireAuth>
      <ApelPage />
    </RequireAuth>
  ),
});

type Family = {
  user_id: string;
  family_civilite: string | null;
  family_prenom: string;
  family_nom: string;
  family_email: string;
  family_telephone: string | null;
  ville: string | null;
  children_count: number;
  classes: string | null;
  paid_orders_count: number;
  items_count: number;
  last_paid_at: string | null;
  has_ordered: boolean;
};

function ApelPage() {
  const { isAdmin, isApel, authLoading } = useStore();
  const allowed = isAdmin || isApel;
  const [families, setFamilies] = useState<Family[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "ordered" | "pending">("pending");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState(false);
  const [customMessage, setCustomMessage] = useState("");

  useEffect(() => {
    if (!allowed) {
      setLoading(false);
      return;
    }
    (async () => {
      const r = await apelListFamilies({ data: {} });
      if (!r.ok) toast.error(r.error || "Erreur de chargement");
      else setFamilies(r.families as Family[]);
      setLoading(false);
    })();
  }, [allowed]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return families.filter((f) => {
      if (filter === "ordered" && !f.has_ordered) return false;
      if (filter === "pending" && f.has_ordered) return false;
      if (!q) return true;
      return (
        f.family_nom?.toLowerCase().includes(q) ||
        f.family_prenom?.toLowerCase().includes(q) ||
        f.family_email?.toLowerCase().includes(q) ||
        (f.classes ?? "").toLowerCase().includes(q)
      );
    });
  }, [families, filter, search]);

  const totalCount = families.length;
  const orderedCount = families.filter((f) => f.has_ordered).length;
  const pendingCount = totalCount - orderedCount;
  const rate = totalCount ? Math.round((orderedCount * 100) / totalCount) : 0;

  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map((f) => f.user_id)));
  };
  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  const exportCsv = () => {
    const header = [
      "Civilité",
      "Prénom",
      "Nom",
      "Email",
      "Téléphone",
      "Ville",
      "Nb enfants",
      "Classes",
      "Nb commandes",
      "Nb articles",
      "Dernière commande",
      "Statut",
    ];
    const rows = filtered.map((f) => [
      formatCivilite(f.family_civilite),
      f.family_prenom,
      f.family_nom,
      f.family_email,
      f.family_telephone ?? "",
      f.ville ?? "",
      String(f.children_count),
      f.classes ?? "",
      String(f.paid_orders_count),
      String(f.items_count),
      f.last_paid_at ? new Date(f.last_paid_at).toLocaleDateString("fr-FR") : "",
      f.has_ordered ? "A commandé" : "Pas encore commandé",
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";"))
      .join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `apel-familles-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Export CSV généré");
  };

  const sendReminders = async () => {
    const ids = Array.from(selected);
    if (ids.length === 0) {
      toast.error("Sélectionnez au moins une famille");
      return;
    }
    if (!confirm(`Envoyer une relance à ${ids.length} famille(s) ?`)) return;
    setSending(true);
    try {
      const r = await sendApelReminders({
        data: { userIds: ids, customMessage: customMessage || undefined, deadline: DEADLINE },
      });
      if (!r.ok) toast.error(r.error || "Échec de l'envoi");
      else toast.success(`${r.sent} relance(s) envoyée(s) sur ${r.total}`);
      setSelected(new Set());
    } catch (e: any) {
      toast.error(e?.message ?? "Erreur");
    } finally {
      setSending(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <SiteHeader schoolName={SCHOOL_LABEL} />
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <SiteHeader schoolName={SCHOOL_LABEL} />
        <section className="mx-auto max-w-3xl px-4 py-20 text-center">
          <ShieldCheck className="mx-auto h-10 w-10 text-muted-foreground" />
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground">Accès réservé</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Cette page est réservée à l'Association des Parents d'Élèves et aux administrateurs.
          </p>
        </section>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader schoolName={SCHOOL_LABEL} />
      <section className="mx-auto w-full max-w-6xl px-4 pt-6 pb-12 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
              <span className="h-px w-6 bg-gold" /> Espace APEL
            </span>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Suivi des commandes — Rentrée 2026
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Liste des familles et statut de leur commande pour la rentrée. Échéance recommandée :{" "}
              <strong>{DEADLINE}</strong>.
            </p>
          </div>
          <button
            onClick={exportCsv}
            disabled={filtered.length === 0}
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-medium hover:bg-accent disabled:opacity-50"
          >
            <Download className="h-4 w-4" /> Export CSV
          </button>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-4">
          <Stat label="Familles inscrites" value={totalCount.toString()} />
          <Stat label="Ont commandé" value={orderedCount.toString()} tone="ok" />
          <Stat label="Pas encore" value={pendingCount.toString()} tone="warn" />
          <Stat label="Taux" value={`${rate} %`} />
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <div className="inline-flex rounded-xl border border-border bg-card p-1">
            {([
              ["pending", `À relancer (${pendingCount})`],
              ["ordered", `Ont commandé (${orderedCount})`],
              ["all", `Toutes (${totalCount})`],
            ] as const).map(([k, label]) => (
              <button
                key={k}
                onClick={() => {
                  setFilter(k);
                  setSelected(new Set());
                }}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  filter === k
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher (nom, email, classe)…"
              className="h-11 w-full rounded-xl border border-border bg-card pl-10 pr-3 text-sm focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        {filter !== "ordered" && (
          <div className="mt-4 rounded-2xl border border-amber-300/40 bg-amber-50/40 p-4 dark:bg-amber-950/20">
            <p className="text-sm font-medium text-foreground">Relance par email</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Sélectionnez les familles ci-dessous puis cliquez sur « Envoyer la relance ». Vous pouvez
              ajouter un message personnalisé.
            </p>
            <textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="Message complémentaire (facultatif)"
              rows={2}
              className="mt-3 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm focus:border-primary focus:outline-none"
              maxLength={1000}
            />
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">
                {selected.size} famille(s) sélectionnée(s)
              </p>
              <button
                onClick={sendReminders}
                disabled={sending || selected.size === 0}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Envoyer la relance
              </button>
            </div>
          </div>
        )}

        <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-3 py-3">
                    <input
                      type="checkbox"
                      checked={filtered.length > 0 && selected.size === filtered.length}
                      onChange={toggleAll}
                      aria-label="Tout sélectionner"
                    />
                  </th>
                  <th className="px-3 py-3">Famille</th>
                  <th className="px-3 py-3">Email</th>
                  <th className="px-3 py-3">Téléphone</th>
                  <th className="px-3 py-3 text-center">Enfants</th>
                  <th className="px-3 py-3">Classes</th>
                  <th className="px-3 py-3 text-center">Cmd</th>
                  <th className="px-3 py-3 text-center">Articles</th>
                  <th className="px-3 py-3">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading && (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">
                      Chargement…
                    </td>
                  </tr>
                )}
                {!loading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">
                      Aucune famille ne correspond à ce filtre.
                    </td>
                  </tr>
                )}
                {filtered.map((f) => (
                  <tr key={f.user_id} className="hover:bg-muted/30">
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        checked={selected.has(f.user_id)}
                        onChange={() => toggleOne(f.user_id)}
                        aria-label={`Sélectionner ${f.family_nom}`}
                      />
                    </td>
                    <td className="px-3 py-3 font-medium text-foreground">
                      {formatCivilite(f.family_civilite)} {f.family_prenom} {f.family_nom}
                    </td>
                    <td className="px-3 py-3 text-muted-foreground">{f.family_email}</td>
                    <td className="px-3 py-3 text-muted-foreground">{f.family_telephone ?? "—"}</td>
                    <td className="px-3 py-3 text-center">{f.children_count}</td>
                    <td className="px-3 py-3 text-muted-foreground">{f.classes ?? "—"}</td>
                    <td className="px-3 py-3 text-center">{f.paid_orders_count}</td>
                    <td className="px-3 py-3 text-center">{f.items_count}</td>
                    <td className="px-3 py-3">
                      {f.has_ordered ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          <CheckCircle2 className="h-3 w-3" /> A commandé
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                          <XCircle className="h-3 w-3" /> Pas encore
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "ok" | "warn" }) {
  const color =
    tone === "ok"
      ? "text-emerald-700 dark:text-emerald-400"
      : tone === "warn"
        ? "text-amber-700 dark:text-amber-400"
        : "text-foreground";
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${color}`}>{value}</p>
    </div>
  );
}