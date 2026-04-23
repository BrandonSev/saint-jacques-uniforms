import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, MapPin, Search, ShieldCheck, Truck, GraduationCap, Package } from "lucide-react";
import logoFU from "@/assets/france-uniformes-logo-blue.jpeg";
import sjcLogo from "@/assets/saint-jacques-logo-full.png";
import classeBlouses from "@/assets/enfants-classe-blouses.jpg";
import { ShellMotif } from "@/components/SchoolMotif";
import lysLogo from "@/assets/schools/lys.png";
import saintLouisLogo from "@/assets/schools/saint-louis.png";
import genevieveLogo from "@/assets/schools/genevieve.png";
import sacreCoeurLogo from "@/assets/schools/sacre-coeur.png";
import saintMichelLogo from "@/assets/schools/saint-michel.png";
import providenceLogo from "@/assets/schools/providence.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "France Uniformes — Boutique des uniformes scolaires" },
      {
        name: "description",
        content:
          "Sélectionnez votre établissement scolaire pour accéder à votre espace familles et commander vos uniformes officiels.",
      },
      { property: "og:title", content: "France Uniformes — Boutique des uniformes scolaires" },
      {
        property: "og:description",
        content: "Accédez à votre espace établissement et commandez les uniformes officiels.",
      },
    ],
  }),
  component: Index,
});

const schools = [
  {
    name: "Saint-Jacques de Compostelle",
    city: "Dax (40)",
    seal: sjcLogo,
    featured: true,
  },
  { name: "Notre-Dame des Lys", city: "Lille (59)", seal: lysLogo },
  { name: "Institution Saint-Louis", city: "Strasbourg (67)", seal: saintLouisLogo },
  { name: "Sainte-Geneviève", city: "Rennes (35)", seal: genevieveLogo },
  { name: "Sacré-Cœur", city: "Lyon (69)", seal: sacreCoeurLogo },
  { name: "Saint-Michel", city: "Reims (51)", seal: saintMichelLogo },
  { name: "Notre-Dame de la Providence", city: "Amiens (80)", seal: providenceLogo },
];

function Index() {
  return (
    <div className="min-h-screen bg-background">
      {/* Top utility bar */}
      <div className="border-b border-border bg-card">
        <div className="mx-auto flex h-10 max-w-7xl items-center justify-between px-4 text-xs text-muted-foreground sm:px-6 lg:px-8">
          <span className="hidden sm:inline">Fabricant français · Livraison directement à l'établissement</span>
          <div className="flex items-center gap-4">
            <span>Aide</span>
            <span className="hidden sm:inline">Contact</span>
          </div>
        </div>
      </div>

      {/* Header simple (pas d'école sélectionnée) */}
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex h-20 max-w-7xl items-center px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <img src={logoFU} alt="France Uniformes" className="h-11 w-11 rounded-md object-cover" />
            <div className="leading-tight">
              <div className="text-base font-semibold tracking-tight text-primary">France Uniformes</div>
              <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Fabrication française
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 -z-10"
          style={{ background: "var(--gradient-hero)" }}
        />
        <div className="absolute inset-0 -z-10 opacity-30 mix-blend-overlay">
          <img
            src={classeBlouses}
            alt=""
            className="h-full w-full object-cover"
            loading="eager"
          />
        </div>
        <div className="pointer-events-none absolute inset-0 -z-10 text-white">
          <ShellMotif className="absolute -left-40 -top-32 h-[700px] w-[700px]" opacity={0.10} />
          <ShellMotif className="absolute -right-48 -bottom-48 h-[700px] w-[700px]" opacity={0.08} />
        </div>
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_1fr]">
            {/* Left : copy + search */}
            <div className="text-center lg:text-left">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.18em] text-white backdrop-blur">
                <ShieldCheck className="h-3.5 w-3.5" /> Espace familles officiel
              </span>
              <h1 className="mt-6 text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-[3.4rem] lg:leading-[1.05]">
                Boutique des uniformes scolaires
              </h1>
              <div className="mt-5 h-px w-16 bg-gold mx-auto lg:mx-0" />
              <p className="mt-5 max-w-xl text-base leading-relaxed text-white/85 sm:text-lg mx-auto lg:mx-0">
                Sélectionnez l'établissement de votre enfant pour accéder à son
                espace familles et commander les tenues officielles en quelques clics.
              </p>

              {/* Search bar */}
              <div className="mt-8 flex max-w-xl items-center gap-2 rounded-full border border-white/20 bg-white p-2 shadow-2xl mx-auto lg:mx-0">
                <Search className="ml-3 h-5 w-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Rechercher votre établissement…"
                  className="flex-1 bg-transparent px-2 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground"
                />
                <button className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
                  Rechercher
                </button>
              </div>

              {/* Stats */}
              <div className="mt-10 grid grid-cols-3 gap-4 max-w-xl mx-auto lg:mx-0">
                <HeroStat icon={<GraduationCap className="h-4 w-4" />} value="120+" label="Établissements" />
                <HeroStat icon={<Package className="h-4 w-4" />} value="48 000" label="Tenues / an" />
                <HeroStat icon={<MapPin className="h-4 w-4" />} value="30 ans" label="Savoir-faire" />
              </div>
            </div>

            {/* Right : framed photo */}
            <div className="relative hidden lg:block">
              <div className="relative overflow-hidden rounded-3xl border border-white/20 shadow-2xl">
                <img
                  src={classeBlouses}
                  alt="Élèves en blouse"
                  className="aspect-[4/5] w-full object-cover"
                  loading="eager"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-primary-deep/85 via-primary-deep/30 to-transparent p-6">
                  <div className="text-[10px] font-medium uppercase tracking-[0.22em] text-white/75">
                    Rentrée 2025-2026
                  </div>
                  <div className="mt-1 text-base font-semibold text-white">
                    Tenues officielles validées par les établissements
                  </div>
                </div>
              </div>
              <div className="absolute -right-4 -top-4 h-20 w-20 rounded-2xl border-2 border-gold/70 bg-white/10 backdrop-blur" />
              <div className="absolute -left-3 bottom-10 h-12 w-12 rounded-full bg-gold/90" />
            </div>
          </div>
        </div>
      </section>

      {/* Schools grid */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-col items-baseline justify-between gap-2 sm:flex-row">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Sélectionnez votre établissement
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {schools.length} établissements partenaires en France
            </p>
          </div>
          <div className="text-xs text-muted-foreground">Affichés par proximité</div>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {schools.map((school) => (
            <SchoolCard key={school.name} school={school} />
          ))}
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-t border-border bg-card">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:grid-cols-3 sm:px-6 lg:px-8">
          <TrustItem
            icon={<ShieldCheck className="h-5 w-5" />}
            title="Tenues validées par l'établissement"
            text="Chaque produit est référencé en accord avec la direction de l'école."
          />
          <TrustItem
            icon={<Truck className="h-5 w-5" />}
            title="Livraison à l'école"
            text="Vos commandes sont remises directement dans le cartable de votre enfant."
          />
          <TrustItem
            icon={<MapPin className="h-5 w-5" />}
            title="Fabrication française"
            text="Confection dans nos ateliers du Sud-Ouest, depuis plus de 30 ans."
          />
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:px-6 lg:px-8">
          <span>© {new Date().getFullYear()} France Uniformes</span>
          <span>Paiement sécurisé · Données protégées</span>
        </div>
      </footer>
    </div>
  );
}

function SchoolCard({ school }: { school: (typeof schools)[number] }) {
  const inner = (
    <div
      className={`group relative flex h-full flex-col rounded-2xl border bg-card p-6 transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-card)] ${
        school.featured ? "border-primary/40 ring-2 ring-primary/15" : "border-border"
      }`}
    >
      {school.featured && (
        <span className="absolute -top-2.5 left-6 inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground">
          Votre établissement
        </span>
      )}
      <div className="flex items-start gap-4">
        <div className="flex h-20 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-secondary p-1.5">
          {school.seal ? (
            <img
              src={school.seal}
              alt={school.name}
              className="h-[140%] w-full object-contain object-top"
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-sm font-semibold text-primary">
              {school.name
                .split(" ")
                .filter((w) => w.length > 2)
                .slice(0, 2)
                .map((w) => w[0])
                .join("")}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-semibold tracking-tight text-foreground">
            {school.name}
          </h3>
          <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" /> {school.city}
          </p>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
        <span className="text-xs text-muted-foreground">Espace familles ouvert</span>
        <span className="inline-flex items-center gap-1 text-sm font-medium text-primary group-hover:gap-2 transition-all">
          Accéder <ArrowRight className="h-4 w-4" />
        </span>
      </div>
    </div>
  );

  if (school.featured) {
    return (
      <Link to="/login" className="block h-full">
        {inner}
      </Link>
    );
  }
  return <div className="opacity-95">{inner}</div>;
}

function TrustItem({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="flex gap-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        {icon}
      </div>
      <div>
        <h4 className="text-sm font-semibold text-foreground">{title}</h4>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{text}</p>
      </div>
    </div>
  );
}

function HeroStat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="rounded-xl border border-white/15 bg-white/10 px-3 py-3 text-left backdrop-blur">
      <div className="flex items-center gap-1.5 text-white/70">
        {icon}
        <span className="text-[10px] font-medium uppercase tracking-[0.18em]">{label}</span>
      </div>
      <div className="mt-1 text-xl font-semibold text-white">{value}</div>
    </div>
  );
}
