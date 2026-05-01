import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Mail, ShieldCheck } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import sjcLogo from "@/assets/saint-jacques-logo-full.png";
import { ShellMotif } from "@/components/SchoolMotif";
import { sendCustomPasswordReset } from "@/server/email.functions";

export const Route = createFileRoute("/mot-de-passe-oublie")({
  head: () => ({
    meta: [
      { title: "Mot de passe oublié — Saint-Jacques-de-Compostelle" },
      { name: "description", content: "Réinitialisez le mot de passe de votre espace famille." },
    ],
  }),
  component: ForgotPasswordPage,
});

const schema = z.object({
  email: z.string().trim().email("Email invalide").max(255),
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ email });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setLoading(true);
    try {
      await sendCustomPasswordReset({
        data: { email: parsed.data.email, redirectTo: `${window.location.origin}/reset-password` },
      });
    } catch {}
    setLoading(false);
    setSent(true);
    toast.success("Email envoyé !");
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
            <img src={sjcLogo} alt="Saint-Jacques-de-Compostelle" className="h-24 w-auto object-contain drop-shadow-sm" />
            <div className="mt-4 h-1 w-12 rounded-full bg-[var(--rouge)]" />
            <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[var(--teal)]/15 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--teal-deep)]">
              <ShieldCheck className="h-3 w-3" /> Espace sécurisé
            </span>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">Mot de passe oublié ?</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Saisissez votre email, nous vous enverrons un lien pour le réinitialiser.
            </p>
          </div>

          {sent ? (
            <div className="mt-8 rounded-xl border border-border bg-card p-6 text-sm text-foreground shadow-[var(--shadow-card)]">
              <p className="font-medium">Vérifiez votre boîte de réception.</p>
              <p className="mt-2 text-muted-foreground">
                Si un compte existe pour <span className="font-medium text-foreground">{email}</span>, vous recevrez un email contenant un lien pour réinitialiser votre mot de passe. Pensez à vérifier vos spams.
              </p>
              <Link to="/login" className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground hover:bg-primary/90">
                Retour à la connexion
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Email</label>
                <div className="relative mt-1.5">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                  </span>
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@exemple.com"
                    className="h-11 w-full rounded-xl border border-input bg-card pl-10 pr-3 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15" />
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground shadow-[var(--shadow-card)] transition-all hover:bg-primary/90 disabled:opacity-60">
                {loading ? "Envoi…" : "Envoyer le lien de réinitialisation"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}