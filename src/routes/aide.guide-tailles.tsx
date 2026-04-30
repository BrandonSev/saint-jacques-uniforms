import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { Ruler } from "lucide-react";

export const Route = createFileRoute("/aide/guide-tailles")({
  head: () => ({
    meta: [
      { title: "Guide des tailles — Saint-Jacques de Compostelle" },
      { name: "description", content: "Tableau des tailles et conseils de mesure pour les uniformes." },
    ],
  }),
  component: GuideTaillesPage,
});

const rows = [
  { age: "3 ans", hauteur: "94-100 cm", poitrine: "54 cm" },
  { age: "4 ans", hauteur: "100-106 cm", poitrine: "56 cm" },
  { age: "5 ans", hauteur: "106-112 cm", poitrine: "58 cm" },
  { age: "6 ans", hauteur: "112-118 cm", poitrine: "60 cm" },
  { age: "8 ans", hauteur: "124-130 cm", poitrine: "64 cm" },
  { age: "10 ans", hauteur: "136-142 cm", poitrine: "70 cm" },
  { age: "12 ans", hauteur: "148-154 cm", poitrine: "76 cm" },
  { age: "14 ans", hauteur: "160-166 cm", poitrine: "82 cm" },
  { age: "16 ans", hauteur: "168-174 cm", poitrine: "88 cm" },
];

function GuideTaillesPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader schoolName="Saint-Jacques de Compostelle — Dax" />
      <section className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
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

        <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-secondary text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3">Taille</th>
                <th className="px-4 py-3">Hauteur</th>
                <th className="px-4 py-3">Tour de poitrine</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((r) => (
                <tr key={r.age}>
                  <td className="px-4 py-3 font-semibold text-foreground">{r.age}</td>
                  <td className="px-4 py-3 text-foreground/80">{r.hauteur}</td>
                  <td className="px-4 py-3 text-foreground/80">{r.poitrine}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}