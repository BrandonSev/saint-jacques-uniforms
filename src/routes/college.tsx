import { createFileRoute, Link } from "@tanstack/react-router";
import { RequireAuth } from "@/components/RequireAuth";
import { ChevronRight, CreditCard, ShieldCheck } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { ShellMotif } from "@/components/SchoolMotif";
import { ProductCard } from "@/components/ProductCard";
import polo from "@/assets/polo-alban.jpg";
import pull from "@/assets/pull-oscar.jpg";
import tshirt from "@/assets/tshirt-valery.jpg";
import chemise from "@/assets/chemise-candice.jpg";
import chemiseFille from "@/assets/chemise-candice-fille.png";
import poloPorte from "@/assets/college-polo-porte.jpg";
import { PageWatermark } from "@/components/PageWatermark";

export const Route = createFileRoute("/college")({
  head: () => ({
    meta: [
      { title: "Uniformes collège — Saint-Jacques-de-Compostelle" },
      {
        name: "description",
        content:
          "Polos, pulls et t-shirts validés par l'établissement pour les collégiens du Groupe Saint-Jacques-de-Compostelle.",
      },
    ],
  }),
  component: () => (
    <RequireAuth>
      <CollegePage />
    </RequireAuth>
  ),
});

const sizes = ["10 ans", "12 ans", "14 ans", "16 ans", "18 ans"];

const products = [
  {
    id: "polo",
    name: "Polo Alban",
    ref: "PO-FU-013",
    price: 33.6,
    image: polo,
    tag: "Best-seller",
    desc: "Polo blanc en piqué de coton, écusson brodé du groupe scolaire et liseré tricolore.",
  },
  {
    id: "pull",
    name: "Pull Oscar",
    ref: "PU-FU-009",
    price: 45.6,
    image: pull,
    tag: "Hiver",
    desc: "Pull col V bleu marine, maille jacquard, écusson brodé poitrine.",
  },
  {
    id: "chemise",
    name: "Chemise Candice — Garçon",
    ref: "CHE-FU-002G",
    price: 26.4,
    image: chemise,
    tag: "Cérémonie",
    desc: "Chemise blanche manches longues, coton tissé, écusson brodé poitrine.",
  },
  {
    id: "chemise-fille",
    name: "Chemise Candice — Fille",
    ref: "CHE-FU-002F",
    price: 29.4,
    image: chemiseFille,
    tag: "Fille",
    desc: "Chemise blanche manches longues, coupe cintrée (pinces poitrine & dos), 50% polyester / 50% coton.",
  },
  {
    id: "tshirt",
    name: "Tee-shirt Valery",
    ref: "TS-FU-019",
    price: 19.2,
    image: tshirt,
    tag: "Sport",
    desc: "Tee-shirt blanc col rond, coton souple, écusson brodé et finition tricolore.",
  },
];

function CollegePage() {
  return (
    <div className="relative flex min-h-screen flex-col bg-background/80">
      <PageWatermark />
      <SiteHeader schoolName="Saint-Jacques-de-Compostelle — Dax" />

      <div className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl items-center gap-1.5 px-4 py-3 text-xs text-muted-foreground sm:px-6 lg:px-8">
          <Link to="/boutique" className="hover:text-primary">Boutique</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">Collège (CM2 → 4ᵉ)</span>
        </div>
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border" style={{ background: "var(--gradient-soft)" }}>
        <div className="pointer-events-none absolute inset-0 text-primary">
          <ShellMotif className="absolute -left-32 -bottom-32 h-[480px] w-[480px]" opacity={0.05} />
        </div>
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:px-8">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-semibold uppercase tracking-wider text-sm text-lime-400 bg-red-500">
              <ShieldCheck className="h-3 w-3" /> SÉLECTION EN COURS D'ETUDE PAR L'ÉTABLISSEMENT
            </span>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Collège
            </h1>
            <p className="mt-3 max-w-xl leading-relaxed text-muted-foreground">
              Sélection d'uniformes validée par l'établissement pour les classes
              de CM2, 6ᵉ, 5ᵉ et 4ᵉ. Commande simple pour les familles : tous les
              produits ci-dessous sont autorisés au collège
              Saint-Jacques-de-Compostelle.
            </p>
            <div className="mt-6 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full border border-border bg-card px-3 py-1.5 text-muted-foreground">5 produits</span>
              <span className="rounded-full border border-border bg-card px-3 py-1.5 text-muted-foreground">Tailles 10 → 18 ans</span>
              <span className="rounded-full border border-border bg-card px-3 py-1.5 text-muted-foreground">Livraison à l'établissement</span>
              <span className="rounded-full border border-border bg-card px-3 py-1.5 text-muted-foreground">Livraison à domicile</span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--teal)]/30 bg-[var(--teal)]/10 px-3 py-1.5 font-semibold text-[var(--teal-deep)]">
                <CreditCard className="h-3 w-3" /> Paiement en ligne sécurisé
              </span>
            </div>
          </div>
          <div className="relative h-64 overflow-hidden rounded-3xl border border-border lg:h-80">
            <img src={poloPorte} alt="Collégien en uniforme" className="h-full w-full object-cover" loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/40 to-transparent" />
          </div>
        </div>
      </section>

      {/* Products */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 [grid-template-columns:repeat(auto-fill,minmax(320px,1fr))]">
          {products.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              sizes={sizes}
              defaultSize="14 ans"
              childFilter={(c) => c.section === "Collège" || c.section === "Lycée"}
            />
          ))}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}