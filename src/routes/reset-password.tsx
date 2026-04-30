import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Lock, ShieldCheck } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import sjcLogo from "@/assets/saint-jacques-logo-full.png";
import { ShellMotif } from "@/components/SchoolMotif";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Nouveau mot de passe — Saint-Jacques de Compostelle" },
      { name: "description", content: "Définissez un nouveau mot de passe pour votre espace famille." },
    ],
  }),
  component: ResetPasswordPage,
});

const schema = z.object({
  password: z.string().min(8, "Mot de passe : 8 caractères minimum").max(128),
  confirm: z.string().min(8, "Confirmation requise").max(128),
}).refine((d) => d.password === d.confirm, { message: "Les mots de passe ne correspondent pas", path: ["confirm"] });

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [validSession, setValidSession] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Supabase parse le hash (#access_token=...&type=recovery) automatiquement
    // et déclenche un événement PASSWORD_RECOVERY.
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) {
        setValidSession(true);
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setValidSession(true);
      setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ password, confirm });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Mot de passe mis à jour !");
    navigate({ to: "/boutique" });
  };

  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      <div className="pointer-events-none absolute inset-0 text-primary">
        <ShellMotif className="absolute -left-40 top-20 h-[520px] w-[520px]" opacity={0.045} />
      </div>
      <header className="flex items-center justify-between px-6 py-5 lg:px-10">
        <Link to="/login" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-4 w-4" /> Retour à la connexion
        </Link>
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Saint-Jacques · Dax</span>
      </header>

      <div className="relative flex flex-1 items-center justify-center px-6 py-10 lg:px-10">
        <div className="w-full max-w-md">
          <div className="flex flex-col items-center text-center">
            <img src={sjcLogo} alt="Saint-Jacques de Compostelle" className="h-24 w-auto object-contain drop-shadow-sm" />
            <div className="mt-4 h-1 w-12 rounded-full bg-[var(--rouge)]" />
            <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[var(--teal)]/15 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--teal-deep)]">
              <ShieldCheck className="h-3 w-3" /> Réinitialisation
            </span>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">Nouveau mot de passe</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Choisissez un mot de passe d'au moins 8 caractères.
            </p>
          </div>

          {!ready ? (
            <p className="mt-8 text-center text-sm text-muted-foreground">Vérification du lien…</p>
          ) : !validSession ? (
            <div className="mt-8 rounded-xl border border-border bg-card p-6 text-sm text-foreground shadow-[var(--shadow-card)]">
              <p className="font-medium">Lien invalide ou expiré.</p>
              <p className="mt-2 text-muted-foreground">
                Le lien de réinitialisation n'est plus valide. Veuillez en demander un nouveau.
              </p>
              <Link to="/mot-de-passe-oublie" className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground hover:bg-primary/90">
                Demander un nouveau lien
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Nouveau mot de passe</label>
                <div className="relative mt-1.5">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <Lock className="h-4 w-4" />
                  </span>
                  <input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"
                    className="h-11 w-full rounded-xl border border-input bg-card pl-10 pr-3 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Confirmer le mot de passe</label>
                <div className="relative mt-1.5">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <Lock className="h-4 w-4" />
                  </span>
                  <input type="password" required minLength={8} value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••"
                    className="h-11 w-full rounded-xl border border-input bg-card pl-10 pr-3 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15" />
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground shadow-[var(--shadow-card)] transition-all hover:bg-primary/90 disabled:opacity-60">
                {loading ? "Mise à jour…" : "Mettre à jour mon mot de passe"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}