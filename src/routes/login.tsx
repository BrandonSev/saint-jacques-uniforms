import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, KeyRound, Lock, Mail, MapPin, ShieldCheck, User as UserIcon, Phone, HelpCircle } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import sjcLogo from "@/assets/saint-jacques-logo-full.png";
import { AuthHeroBackground } from "@/components/AuthHeroBackground";
import { AddressAutocomplete } from "@/components/AddressAutocomplete";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/lib/store";
import { verifyEstablishmentCode } from "@/server/establishment.functions";
import { sendWelcome } from "@/server/email.functions";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Espace familles — Saint-Jacques-de-Compostelle" },
      { name: "description", content: "Connectez-vous ou créez votre espace famille." },
    ],
  }),
  component: LoginPage,
});

const signinSchema = z.object({
  email: z.string().trim().email("Email invalide").max(255),
  password: z.string().min(6, "Mot de passe : 6 caractères minimum").max(128),
});

const signupSchema = z.object({
  civilite: z.enum(["M.", "Mme", "Autre"]),
  prenom: z.string().trim().min(1, "Prénom requis").max(80),
  nom: z.string().trim().min(1, "Nom requis").max(80),
  email: z.string().trim().email("Email invalide").max(255),
  telephone: z.string().trim().max(30).optional().or(z.literal("")),
  adresse: z.string().trim().min(1, "Adresse requise").max(200),
  code_postal: z.string().trim().min(4, "Code postal requis").max(10),
  ville: z.string().trim().min(1, "Ville requise").max(100),
  password: z.string().min(8, "Mot de passe : 8 caractères minimum").max(128),
  code_etablissement: z.string().trim().min(1, "Code établissement requis").max(64),
});

function LoginPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user, authLoading } = useStore();

  useEffect(() => {
    if (!authLoading && user) navigate({ to: "/boutique" });
  }, [user, authLoading, navigate]);

  const [civilite, setCivilite] = useState<"M." | "Mme" | "Autre">("Mme");
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [telephone, setTelephone] = useState("");
  const [adresse, setAdresse] = useState("");
  const [codePostal, setCodePostal] = useState("");
  const [ville, setVille] = useState("");
  const [password, setPassword] = useState("");
  const [codeEtablissement, setCodeEtablissement] = useState("");

  // Évite tout flash : tant que l'auth n'est pas prête, ou si l'utilisateur
  // est déjà connecté, on ne rend pas le formulaire.
  if (authLoading || user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-primary">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/30 border-t-white" />
      </div>
    );
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = signinSchema.safeParse({ email, password });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: parsed.data.email, password: parsed.data.password });
    setLoading(false);
    if (error) { toast.error(error.message === "Invalid login credentials" ? "Identifiants invalides" : error.message); return; }
    toast.success("Bienvenue !");
    navigate({ to: "/boutique" });
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = signupSchema.safeParse({ civilite, prenom, nom, email, telephone, adresse, code_postal: codePostal, ville, password, code_etablissement: codeEtablissement });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setLoading(true);
    // Validation serveur du code établissement
    try {
      const check = await verifyEstablishmentCode({ data: { code: parsed.data.code_etablissement } });
      if (!check.valid) {
        setLoading(false);
        toast.error(
          check.reason === "not_configured"
            ? "La validation du code établissement est temporairement indisponible. Contactez l'établissement."
            : "Code établissement invalide. Contactez l'établissement si vous n'en avez pas reçu.",
        );
        return;
      }
    } catch {
      setLoading(false);
      toast.error("Impossible de vérifier le code établissement. Réessayez.");
      return;
    }
    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/boutique`,
        data: {
          civilite: parsed.data.civilite,
          prenom: parsed.data.prenom,
          nom: parsed.data.nom,
          telephone: parsed.data.telephone || "",
          adresse: parsed.data.adresse,
          code_postal: parsed.data.code_postal,
          ville: parsed.data.ville,
          code_etablissement: parsed.data.code_etablissement,
        },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message.includes("already") ? "Cet email est déjà utilisé" : error.message);
      return;
    }
    // Persiste les infos postales sur le profil après création
    const { data: { user: u } } = await supabase.auth.getUser();
    if (u) {
      await supabase.from("profiles").update({
        adresse: parsed.data.adresse,
        code_postal: parsed.data.code_postal,
        ville: parsed.data.ville,
        telephone: parsed.data.telephone || null,
        code_etablissement: parsed.data.code_etablissement,
      }).eq("id", u.id);
      // Email de bienvenue (best-effort)
      try { await sendWelcome({ data: { email: parsed.data.email, prenom: parsed.data.prenom } }); } catch {}
    }
    toast.success("Espace famille créé !");
    navigate({ to: "/boutique" });
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-primary">
      <AuthHeroBackground />

      <div className="relative flex min-h-screen flex-col">
        <header className="flex items-center justify-between px-6 py-5 lg:px-10">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-white/80 hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Retour à l'accueil
          </Link>
          <span className="hidden text-xs uppercase tracking-[0.2em] text-white/70 font-semibold sm:inline">Saint-Jacques-de-Compostelle · Dax</span>
        </header>

        <div className="relative flex flex-1 items-center justify-center px-4 py-8 sm:px-6 sm:py-12 lg:px-10">
          <div className="w-full max-w-md rounded-2xl border border-white/15 bg-card/95 p-6 shadow-[var(--shadow-elegant)] backdrop-blur-md sm:p-8">
            <div className="flex flex-col items-center text-center">
              <img src={sjcLogo} alt="Saint-Jacques-de-Compostelle" className="h-24 w-auto object-contain drop-shadow-sm" />
              <div className="mt-4 h-1 w-12 rounded-full bg-[var(--rouge)]" />
              <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[var(--teal)]/15 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--teal-deep)]">
                <ShieldCheck className="h-3 w-3" /> Espace sécurisé
              </span>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
                {mode === "signin" ? "Espace familles" : "Créer mon espace famille"}
              </h1>
            </div>

            <div className="mt-8 grid grid-cols-2 rounded-xl border border-border bg-secondary p-1 text-sm font-medium">
              <button type="button" onClick={() => setMode("signin")}
                className={`h-9 rounded-lg transition-colors ${mode === "signin" ? "bg-card text-primary shadow-sm" : "text-muted-foreground"}`}>
                Connexion
              </button>
              <button type="button" onClick={() => setMode("signup")}
                className={`h-9 rounded-lg transition-colors ${mode === "signup" ? "bg-card text-primary shadow-sm" : "text-muted-foreground"}`}>
                Créer un espace
              </button>
            </div>

            {mode === "signin" ? (
              <form onSubmit={handleSignIn} className="mt-6 space-y-4">
                <Field label="Email" icon={<Mail className="h-4 w-4" />}>
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@exemple.com" className={inputCls} />
                </Field>
                <Field label="Mot de passe" icon={<Lock className="h-4 w-4" />}>
                  <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className={inputCls} />
                </Field>
                <button type="submit" disabled={loading} className={primaryBtn}>
                  {loading ? "Connexion…" : "Accéder à la boutique"}
                </button>
                <div className="text-right">
                  <Link to="/mot-de-passe-oublie" className="text-xs font-medium text-[var(--teal-deep)] hover:text-primary hover:underline">
                    Mot de passe oublié ?
                  </Link>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSignUp} className="mt-6 space-y-4">
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Civilité</span>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {(["Mme", "M.", "Autre"] as const).map((c) => (
                      <button type="button" key={c} onClick={() => setCivilite(c)}
                        className={`h-10 rounded-lg border text-sm font-medium transition-colors ${civilite === c ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-foreground hover:bg-muted"}`}>
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Prénom" icon={<UserIcon className="h-4 w-4" />}>
                    <input type="text" required value={prenom} onChange={(e) => setPrenom(e.target.value)} maxLength={80} className={inputCls} />
                  </Field>
                  <Field label="Nom" icon={<UserIcon className="h-4 w-4" />}>
                    <input type="text" required value={nom} onChange={(e) => setNom(e.target.value)} maxLength={80} className={inputCls} />
                  </Field>
                </div>
                <Field label="Email" icon={<Mail className="h-4 w-4" />}>
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
                </Field>
                <Field label="Téléphone (optionnel)" icon={<Phone className="h-4 w-4" />}>
                  <input type="tel" value={telephone} onChange={(e) => setTelephone(e.target.value)} maxLength={30} placeholder="06 12 34 56 78" className={inputCls} />
                </Field>
                <Field label="Adresse postale" icon={<MapPin className="h-4 w-4" />}>
                  <AddressAutocomplete
                    value={adresse}
                    onChange={setAdresse}
                    onSelect={({ adresse: a, code_postal, ville: v }) => {
                      setAdresse(a);
                      setCodePostal(code_postal);
                      setVille(v);
                    }}
                    required
                    className={inputCls}
                  />
                </Field>
                <div className="grid grid-cols-[120px_1fr] gap-3">
                  <Field label="Code postal" icon={<MapPin className="h-4 w-4" />}>
                    <input type="text" required value={codePostal} onChange={(e) => setCodePostal(e.target.value)} maxLength={10} placeholder="40100" className={inputCls} />
                  </Field>
                  <Field label="Ville" icon={<MapPin className="h-4 w-4" />}>
                    <input type="text" required value={ville} onChange={(e) => setVille(e.target.value)} maxLength={100} placeholder="Dax" className={inputCls} />
                  </Field>
                </div>
                <Field label="Mot de passe (8 car. min.)" icon={<Lock className="h-4 w-4" />}>
                  <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} className={inputCls} />
                </Field>
                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Code établissement
                    </label>
                    <span
                      className="group relative inline-flex cursor-help items-center text-muted-foreground"
                      tabIndex={0}
                    >
                      <HelpCircle className="h-3.5 w-3.5" />
                      <span className="pointer-events-none absolute right-0 top-5 z-30 w-64 rounded-lg border border-border bg-card p-3 text-left text-[11px] leading-snug text-foreground opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus:opacity-100">
                        Le code établissement vous a été transmis par l'école. Si vous ne l'avez pas reçu, contactez le secrétariat de Saint-Jacques-de-Compostelle.
                      </span>
                    </span>
                  </div>
                  <div className="relative mt-1.5">
                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                      <KeyRound className="h-4 w-4" />
                    </span>
                    <input
                      type="text"
                      required
                      value={codeEtablissement}
                      onChange={(e) => setCodeEtablissement(e.target.value)}
                      maxLength={64}
                      placeholder="Code transmis par l'établissement"
                      className={inputCls}
                      autoComplete="off"
                    />
                  </div>
                </div>
                <button type="submit" disabled={loading} className={primaryBtn}>
                  {loading ? "Création…" : "Créer mon espace famille"}
                </button>
              </form>
            )}

            <p className="mt-6 text-center text-xs text-muted-foreground">
              En continuant, vous acceptez nos{" "}
              <Link to="/aide/cgu" className="text-[var(--teal-deep)] underline hover:text-primary">CGU</Link>
              {" "}et notre{" "}
              <Link to="/aide/confidentialite" className="text-[var(--teal-deep)] underline hover:text-primary">politique de confidentialité</Link>.
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

const inputCls = "h-11 w-full rounded-xl border border-input bg-card pl-10 pr-3 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15";
const primaryBtn = "inline-flex h-12 w-full items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground shadow-[var(--shadow-card)] transition-all hover:bg-primary/90 disabled:opacity-60";

function Field({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</label>
      <div className="relative mt-1.5">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">{icon}</span>
        {children}
      </div>
    </div>
  );
}