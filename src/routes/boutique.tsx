import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { ArrowRight, CreditCard, Sparkles } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { ShellMotif, WaveMotif } from "@/components/SchoolMotif";
import { useStore } from "@/lib/store";
import { RequireAuth } from "@/components/RequireAuth";
import maternelle from "@/assets/classe-maternelle-blouses.jpg";
import college from "@/assets/college-polo-porte.jpg";
import lycee from "@/assets/lycee-uniformes.jpg";
import { PageWatermark } from "@/components/PageWatermark";
import { DirectorQuote } from "@/components/DirectorQuote";
import { BackToSchoolAlert } from "@/components/BackToSchoolAlert";

export const Route = createFileRoute("/boutique")({
  head: () => ({
    meta: [
      { title: "Choisir le niveau — Boutique Saint-Jacques-de-Compostelle" },
      {
        name: "description",
        content: "Sélectionnez le niveau scolaire de votre enfant pour découvrir la sélection d'uniformes adaptée.",
      },
    ],
  }),
  component: () => (
    <RequireAuth>
      <NiveauPage />
    </RequireAuth>
  ),
});

const levels = [
  {
    id: "maternelle",
    title: "Maternelle & Élémentaire",
    subtitle: "Maternelle & Élémentaire",
    range: "PS · MS · GS · CP · CE1 · CE2 · CM1",
    image: maternelle,
    href: "/maternelle" as const,
    accent: "Blouse, Tee-shirt quotidien officiel",
  },
  {
    id: "college",
    title: "Collège",
    subtitle: "Collège",
    range: "CM2 · 6e · 5e · 4e",
    image: college,
    href: "/college" as const,
    accent: "Polo, pull, chemise, tee-shirt",
  },
  {
    id: "lycee",
    title: "Lycée",
    subtitle: "Lycée",
    range: "3e · 2nde · 1re · Terminale",
    image: lycee,
    href: "/lycee" as const,
    accent: "Prochainement !",
  },
];

function NiveauPage() {
  const { isAdmin, authLoading } = useStore();
  if (authLoading) return null;
  if (isAdmin) return <Navigate to="/admin" />;
  return (
    <div className="relative flex min-h-screen flex-col bg-background/80">
      <PageWatermark />
      <SiteHeader schoolName="Saint-Jacques-de-Compostelle — Dax" cartCount={0} />

      <div className="mx-auto w-full max-w-6xl px-4 pt-6 sm:px-6 lg:px-8">
        <BackToSchoolAlert />
      </div>

      <section
        className="relative overflow-hidden border-b border-border"
        style={{ background: "var(--gradient-soft)" }}
      >
        <div className="pointer-events-none absolute inset-0 text-primary">
          <ShellMotif className="absolute -left-32 -top-20 h-[500px] w-[500px]" opacity={0.04} />
          <ShellMotif className="absolute -right-40 -bottom-40 h-[600px] w-[600px]" opacity={0.03} />
        </div>
        <div className="relative mx-auto w-full px-4 py-16 text-center sm:px-6 lg:px-8">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--teal)]/30 bg-white px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--teal-deep)] shadow-sm">
            <Sparkles className="h-3 w-3" /> Rentrée 2026-2027
          </span>
          <h1 className="mt-5 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            Choisissez le niveau de votre enfant
          </h1>
          <p className="mt-2 text-sm italic text-muted-foreground">
            Boutique officielle du groupe scolaire de Saint-Jacques-de-Compostelle
          </p>
          <div className="mx-auto mt-5 h-1 w-16 rounded-full bg-[var(--rouge)]" />
          <div className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
            Chaque niveau dispose d'une sélection d'uniformes validée, en cours d'étude par l'établissement ou
            prochainement disponible. Cliquez sur la carte correspondante pour découvrir les produits disponibles.
          </div>
          <div className="mt-6 flex justify-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-primary shadow-sm">
              <CreditCard className="h-3.5 w-3.5" /> Paiement en ligne sécurisé
            </span>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto grid grid-cols-1 justify-center gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:max-w-5xl">
          {levels.map((level, idx) => (
            <LevelCard key={level.id} level={level} priority={idx === 0} />
          ))}
        </div>

        <p className="mt-10 text-center text-xs text-muted-foreground">
          Besoin d'aide ? Contactez la boutique par email à{" "}
          <span className="text-foreground font-medium">boutique@franceuniformes.fr</span> · du lundi au vendredi,
          9h–17h
        </p>
      </section>
      <DirectorQuote
        variant="hero"
        quote="Toutes les actions menées dans notre Groupe scolaire ont pour finalité essentielle de contribuer à l'épanouissement et à la réussite du Jeune. La tenue de Saint-Jacques-de-Compostelle s'inscrit pleinement dans ce projet : elle incarne notre Éducation Intégrale, le sens de l'appartenance à notre communauté et l'attention quotidienne portée à chaque élève."
      />
      <SiteFooter />
    </div>
  );
}

function LevelCard({ level, priority }: { level: (typeof levels)[number]; priority: boolean }) {
  return (
    <Link
      to={level.href}
      className="group relative flex h-[420px] flex-col justify-end overflow-hidden rounded-3xl border border-border shadow-[var(--shadow-card)] transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-elegant)]"
    >
      <img
        src={level.image}
        alt={level.title}
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        loading={priority ? "eager" : "lazy"}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/60 to-primary/0" />

      <div className="absolute left-6 top-6">
        <span className="inline-flex items-center rounded-full bg-white/95 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary backdrop-blur">
          {level.subtitle}
        </span>
      </div>

      <div className="relative p-6 text-white">
        <p className="text-[11px] uppercase tracking-wider text-white/75">{level.range}</p>
        <h3 className="mt-2 text-2xl font-semibold tracking-tight">{level.title}</h3>
        <p className="mt-1 text-sm text-white/85">{level.accent}</p>

        <div className="mt-4 inline-flex h-10 items-center gap-2 whitespace-nowrap rounded-full bg-white px-4 text-sm font-semibold text-primary shadow-md transition-all group-hover:gap-3">
          Accéder <ArrowRight className="h-4 w-4 shrink-0" />
        </div>
      </div>
    </Link>
  );
}
