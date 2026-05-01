import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Lock, Mail, MapPin, ShieldCheck, User as UserIcon, Phone } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import sjcLogo from "@/assets/saint-jacques-logo-full.png";
import classeBlouses from "@/assets/enfants-classe-blouses.jpg";
import { ShellMotif } from "@/components/SchoolMotif";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/lib/store";

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
    const parsed = signupSchema.safeParse({ civilite, prenom, nom, email, telephone, adresse, code_postal: codePostal, ville, password });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setLoading(true);
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
      }).eq("id", u.id);
    }
    toast.success("Espace famille créé !");
    navigate({ to: "/boutique" });
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative flex flex-col bg-background">
        <div className="pointer-events-none absolute inset-0 text-primary">
          <ShellMotif className="absolute -left-40 top-20 h-[520px] w-[520px]" opacity={0.045} />
        </div>
        <header className="flex items-center justify-between px-6 py-5 lg:px-10">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary text-left rounded-none">
            <ArrowLeft className="h-4 w-4" /> Retour à l'accueil
          </Link>
          <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Saint-Jacques-de-Compostelle · Dax</span>
        </header>

        <div className="relative flex flex-1 items-center justify-center px-6 py-10 lg:px-10">
          <div className="w-full max-w-md">
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
                  <input type="text" required value={adresse} onChange={(e) => setAdresse(e.target.value)} maxLength={200} placeholder="12 rue des Écoles" className={inputCls} />
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
      </div>

      <div className="relative hidden lg:block">
        <img src={classeBlouses} alt="Élèves en classe" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-tr from-primary-deep/90 via-primary/50 to-transparent" />
        <div className="absolute top-10 right-10">
          <img src={sjcLogo} alt="" className="h-20 w-auto object-contain drop-shadow-2xl opacity-90" />
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-12 text-white">
          <blockquote className="max-w-md font-display text-2xl font-light leading-snug italic">«&nbsp;Une démarche simple et rassurante pour équiper nos élèves chaque&nbsp;rentrée.&nbsp;»</blockquote>
          <p className="mt-4 text-sm text-white/80">— Direction du Groupe Saint-Jacques-de-Compostelle</p>
        </div>
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