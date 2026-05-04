import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { Ruler } from "lucide-react";
import { PageWatermark } from "@/components/PageWatermark";
import mesuresDiagram from "@/assets/guide-tailles-mesures.png";

export const Route = createFileRoute("/aide/guide-tailles")({
  head: () => ({
    meta: [
      { title: "Guide des tailles — Saint-Jacques-de-Compostelle" },
      { name: "description", content: "Tableau des tailles et conseils de mesure pour les uniformes." },
    ],
  }),
  component: GuideTaillesPage,
});

const rows = [
  { age: "3 ans", stature: "90/97", poitrine: "53", taille: "50", bassin: "56" },
  { age: "4 ans", stature: "98/107", poitrine: "55", taille: "52", bassin: "58" },
  { age: "5 ans", stature: "108/113", poitrine: "57", taille: "54", bassin: "60" },
  { age: "6 ans", stature: "114/119", poitrine: "59", taille: "55", bassin: "64" },
  { age: "7 ans", stature: "120/125", poitrine: "61", taille: "56", bassin: "66" },
  { age: "8 ans", stature: "126/137", poitrine: "63", taille: "57", bassin: "68" },
  { age: "10 ans", stature: "138/143", poitrine: "71", taille: "62", bassin: "76" },
  { age: "12 ans", stature: "144/155", poitrine: "77", taille: "66", bassin: "81" },
  { age: "14 ans", stature: "156/164", poitrine: "84", taille: "71", bassin: "86" },
  { age: "16 ans", stature: "164/176", poitrine: "88", taille: "75", bassin: "91" },
  { age: "18 ans", stature: "176/182", poitrine: "92", taille: "79", bassin: "96" },
];

const measurePoints = [
  { n: 1, label: "Stature", desc: "Hauteur totale, du sommet de la tête aux pieds." },
  { n: 2, label: "Tour de poitrine", desc: "Mesuré au niveau le plus fort de la poitrine." },
  { n: 3, label: "Tour de taille", desc: "Mesuré au creux naturel de la taille." },
  { n: 4, label: "Tour de bassin", desc: "Mesuré au niveau le plus fort des hanches." },
];

function GuideTaillesPage() {
  return (
    <div className="relative flex min-h-screen flex-col bg-background/80">
      <PageWatermark />
      <SiteHeader schoolName="Saint-Jacques-de-Compostelle — Dax" />
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
          <span className="h-px w-6 bg-gold" /> Aide
        </span>
        <h1 className="mt-1 inline-flex items-center gap-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          <Ruler className="h-6 w-6 text-primary" /> Guide des tailles
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Le tableau ci-dessous vous aide à choisir la taille adaptée à votre enfant. En cas de doute
          entre deux tailles, nous vous conseillons de prendre la taille supérieure.
        </p>

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
          <div className="overflow-x-auto rounded-2xl border border-border bg-card">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="bg-secondary text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3">Taille</th>
                  <th className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5">
                      <NumberBadge n={1} /> Stature
                    </span>
                  </th>
                  <th className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5">
                      <NumberBadge n={2} /> Tour de poitrine
                    </span>
                  </th>
                  <th className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5">
                      <NumberBadge n={3} /> Tour de taille
                    </span>
                  </th>
                  <th className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5">
                      <NumberBadge n={4} /> Tour de bassin
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((r) => (
                  <tr key={r.age}>
                    <td className="px-4 py-3 font-semibold text-foreground">{r.age}</td>
                    <td className="px-4 py-3 text-foreground/80">{r.stature}</td>
                    <td className="px-4 py-3 text-foreground/80">{r.poitrine}</td>
                    <td className="px-4 py-3 text-foreground/80">{r.taille}</td>
                    <td className="px-4 py-3 text-foreground/80">{r.bassin}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="border-t border-border bg-secondary/40 px-4 py-2 text-[11px] text-muted-foreground">
              Mesures exprimées en centimètres.
            </p>
          </div>

          <aside className="rounded-2xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold text-foreground">Points de mesure</h2>
            <div className="mt-4 flex justify-center">
              <MeasureDiagram />
            </div>
            <ul className="mt-4 space-y-2.5">
              {measurePoints.map((p) => (
                <li key={p.n} className="flex gap-2.5 text-xs leading-relaxed">
                  <NumberBadge n={p.n} />
                  <div>
                    <div className="font-semibold text-foreground">{p.label}</div>
                    <div className="text-muted-foreground">{p.desc}</div>
                  </div>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}

function NumberBadge({ n }: { n: number }) {
  return (
    <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
      {n}
    </span>
  );
}

function MeasureDiagram() {
  return (
    <img
      src={mesuresDiagram}
      alt="Schéma des 4 points de mesure : stature, tour de poitrine, tour de taille, tour de bassin"
      className="h-80 w-auto object-contain"
      loading="lazy"
    />
  );
}