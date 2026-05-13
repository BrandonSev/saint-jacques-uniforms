import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Lock, ShieldCheck } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import sjcLogo from "@/assets/saint-jacques-logo-full.png";
import { AuthHeroBackground } from "@/components/AuthHeroBackground";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Nouveau mot de passe — Saint-Jacques-de-Compostelle" },
      { name: "description", content: "Définissez un nouveau mot de passe pour votre espace famille." },
    ],
  }),
  validateSearch: (search: Record<string, unknown>) => ({
    token_hash: typeof search.token_hash === "string" ? search.token_hash : undefined,
    type: typeof search.type === "string" ? search.type : undefined,
  }),
  component: ResetPasswordPage,
});

const schema = z.object({
  password: z.string().min(8, "Mot de passe : 8 caractères minimum").max(128),
  confirm: z.string().min(8, "Confirmation requise").max(128),
}).refine((d) => d.password === d.confirm, { message: "Les mots de passe ne correspondent pas", path: ["confirm"] });

function ResetPasswordPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [ready, setReady] = useState(false);
  const [validSession, setValidSession] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Deux flux possibles :
    // 1) Lien custom : ?token_hash=...&type=recovery -> verifyOtp pour ouvrir la session.
    // 2) Lien historique Supabase : #access_token=... (parse automatique).
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) {
        setValidSession(true);
      }
    });
    (async () => {
      if (search.token_hash) {
        const { data, error } = await supabase.auth.verifyOtp({
          type: "recovery",
          token_hash: search.token_hash,
        });
        if (!error && data.session) setValidSession(true);
        setReady(true);
        return;
      }
      const { data } = await supabase.auth.getSession();
      if (data.session) setValidSession(true);
      setReady(true);
    })();
    return () => sub.subscription.unsubscribe();
  }, [search.token_hash]);

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
    <div className="relative min-h-screen overflow-hidden bg-primary">
      <AuthHeroBackground />

      <div className="relative flex min-h-screen flex-col">
        <header className="flex items-center justify-between px-6 py-5 lg:px-10">
          <Link to="/login" className="inline-flex items-center gap-2 text-sm text-white/80 hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Retour à la connexion
          </Link>
          <span className="hidden text-xs uppercase tracking-[0.2em] text-white/70 font-semibold sm:inline">
            Saint-Jacques-de-Compostelle · Dax
          </span>
        </header>

        <div className="relative flex flex-1 items-center justify-center px-4 py-8 sm:px-6 sm:py-12 lg:px-10">
          <div className="w-full max-w-md rounded-2xl border border-white/15 bg-card/95 p-6 shadow-[var(--shadow-elegant)] backdrop-blur-md sm:p-8">
            <div className="flex flex-col items-center text-center">
              <img src={sjcLogo} alt="Saint-Jacques-de-Compostelle" className="h-24 w-auto object-contain drop-shadow-sm" />
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
              <div className="mt-8 rounded-xl border border-border bg-muted/30 p-6 text-sm text-foreground">
                <p className="font-medium">Lien invalide ou expiré.</p>
                <p className="mt-2 text-muted-foreground">
                  Le lien de réinitialisation n'est plus valide. Veuillez en demander un nouveau.
                </p>
                <Link
                  to="/mot-de-passe-oublie"
                  className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  Demander un nouveau lien
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-8 space-y-4">
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Nouveau mot de passe
                  </label>
                  <div className="relative mt-1.5">
                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                      <Lock className="h-4 w-4" />
                    </span>
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="h-11 w-full rounded-xl border border-input bg-card pl-10 pr-3 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Confirmer le mot de passe
                  </label>
                  <div className="relative mt-1.5">
                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                      <Lock className="h-4 w-4" />
                    </span>
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      placeholder="••••••••"
                      className="h-11 w-full rounded-xl border border-input bg-card pl-10 pr-3 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground shadow-[var(--shadow-card)] transition-all hover:bg-primary/90 disabled:opacity-60"
                >
                  {loading ? "Mise à jour…" : "Mettre à jour mon mot de passe"}
                </button>
              </form>
            )}

            <p className="mt-6 text-center text-xs text-muted-foreground">
              Besoin d'aide ?{" "}
              <Link to="/aide/contact" className="text-[var(--teal-deep)] underline hover:text-primary">
                Contactez l'établissement
              </Link>
              .
            </p>
          </div>
        </div>

        <footer className="relative px-6 pb-8 text-center lg:px-10">
          <blockquote className="mx-auto max-w-xl font-display text-base font-light italic leading-snug text-white/85 sm:text-lg">
            «&nbsp;Une démarche simple et rassurante pour équiper nos élèves chaque&nbsp;rentrée.&nbsp;»
          </blockquote>
          <p className="mt-2 text-xs text-white/60">— Direction du Groupe Saint-Jacques-de-Compostelle</p>
        </footer>
      </div>
    </div>
  );
}