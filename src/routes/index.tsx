import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, MapPin, Search, ShieldCheck, Truck } from "lucide-react";
import logoFU from "@/assets/france-uniformes-logo-blue.jpeg";
import sjcLogo from "@/assets/saint-jacques-logo.png";
import sjcSeal from "@/assets/saint-jacques-seal.png";
import classeBlouses from "@/assets/enfants-classe-blouses.jpg";

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
    seal: sjcSeal,
    featured: true,
  },
  { name: "Sainte-Marie", city: "Bayonne (64)" },
  { name: "Notre-Dame du Rosaire", city: "Pau (64)" },
  { name: "Saint-Joseph", city: "Bordeaux (33)" },
  { name: "Sacré-Cœur", city: "Mont-de-Marsan (40)" },
  { name: "Saint-Vincent-de-Paul", city: "Toulouse (31)" },
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
        <div className="absolute inset-0 -z-10 opacity-25 mix-blend-overlay">
          <img
            src={classeBlouses}
            alt=""
            className="h-full w-full object-cover"
            loading="eager"
          />
        </div>
        <div className="mx-auto max-w-7xl px-4 py-20 text-center sm:px-6 sm:py-28 lg:px-8">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-white backdrop-blur">
            <ShieldCheck className="h-3.5 w-3.5" /> Espace familles officiel
          </span>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Boutique des uniformes scolaires
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-white/85 sm:text-lg">
            Accédez à votre espace établissement pour commander les tenues officielles
            de votre enfant en quelques clics.
          </p>

          {/* Search bar */}
          <div className="mx-auto mt-10 flex max-w-xl items-center gap-2 rounded-full border border-white/20 bg-white p-2 shadow-2xl">
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
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-secondary">
          {school.seal ? (
            <img src={school.seal} alt={school.name} className="h-14 w-14 object-contain" />
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
