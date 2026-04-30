import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { ShellMotif, WaveMotif } from "@/components/SchoolMotif";
import maternelle from "@/assets/classe-maternelle-blouses.jpg";
import college from "@/assets/college-polo-porte.jpg";
import lycee from "@/assets/lycee-uniformes.jpg";
import elementaireImg from "@/assets/elementaire-hero.jpg";

export const Route = createFileRoute("/niveau")({
  head: () => ({
    meta: [
      { title: "Choisir le niveau — Boutique Saint-Jacques de Compostelle" },
      {
        name: "description",
        content:
          "Sélectionnez le niveau scolaire de votre enfant pour découvrir la sélection d'uniformes adaptée.",
      },
    ],
  }),
  component: NiveauPage,
});

const levels = [
  {
    id: "maternelle",
    title: "Maternelle",
    subtitle: "Maternelle",
    range: "PS · MS · GS",
    image: maternelle,
    href: "/maternelle" as const,
    accent: "Blouse quotidienne officielle",
  },
  {
    id: "elementaire",
    title: "Élémentaire",
    subtitle: "Élémentaire",
    range: "CP · CE1 · CE2 · CM1",
    image: elementaireImg,
    href: "/elementaire" as const,
    accent: "Blouse quotidienne officielle",
  },
  {
    id: "college",
    title: "Collège",
    subtitle: "Collège",
    range: "CM2 · 6e · 5e · 4e",
    image: college,
    href: "/college" as const,
    accent: "Polos, pulls, t-shirts",
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
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader schoolName="Saint-Jacques de Compostelle — Dax" cartCount={0} />

      <section className="relative overflow-hidden border-b border-border" style={{ background: "var(--gradient-soft)" }}>
        <div className="pointer-events-none absolute inset-0 text-primary">
          <ShellMotif className="absolute -left-32 -top-20 h-[500px] w-[500px]" opacity={0.04} />
          <ShellMotif className="absolute -right-40 -bottom-40 h-[600px] w-[600px]" opacity={0.03} />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--teal)]/30 bg-white px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--teal-deep)] shadow-sm">
            <Sparkles className="h-3 w-3" /> Rentrée 2026-2027
          </span>
          <h1 className="mt-5 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            Choisissez le niveau de votre enfant
          </h1>
          <p className="mt-2 text-sm italic text-muted-foreground">Boutique officielle Saint-Jacques de Compostelle</p>
          <div className="mx-auto mt-5 h-1 w-16 rounded-full bg-[var(--rouge)]" />
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
            Chaque niveau dispose d'une sélection d'uniformes validée par l'établissement.
            Cliquez sur la carte correspondante pour découvrir les produits disponibles.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {levels.map((level, idx) => (
            <LevelCard key={level.id} level={level} priority={idx === 0} />
          ))}
        </div>

        <p className="mt-10 text-center text-xs text-muted-foreground">
          Besoin d'aide ? Contactez la boutique au <span className="text-foreground font-medium">05 58 00 00 00</span> ·
          du lundi au vendredi, 9h–17h
        </p>
      </section>

      <SiteFooter />
    </div>
  );
}

function LevelCard({
  level,
  priority,
}: {
  level: (typeof levels)[number];
  priority: boolean;
}) {
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