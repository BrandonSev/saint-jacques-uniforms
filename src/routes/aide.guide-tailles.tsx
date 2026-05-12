import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { Ruler, Sparkles } from "lucide-react";
import { PageWatermark } from "@/components/PageWatermark";
import mesuresDiagram from "@/assets/guide-tailles-mesures.png";
import { useMemo, useState, useEffect } from "react";
import { ChildPicker } from "@/components/ChildPicker";
import { useStore } from "@/lib/store";

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

type Row = (typeof rows)[number];

/** Parse "90/97" or "176" into [min, max] in cm. */
function parseRange(v: string): [number, number] {
  const parts = v.split("/").map((p) => parseFloat(p.trim()));
  if (parts.length === 2 && parts.every((n) => !isNaN(n))) return [parts[0], parts[1]];
  if (parts.length === 1 && !isNaN(parts[0])) return [parts[0], parts[0]];
  return [NaN, NaN];
}

/** Index of the smallest row whose upper bound >= value. Falls back to last row. */
function findRowIndexFor(value: number, key: keyof Pick<Row, "stature" | "poitrine" | "taille" | "bassin">): number {
  for (let i = 0; i < rows.length; i++) {
    const [min, max] = parseRange(rows[i][key]);
    if (isNaN(min)) continue;
    if (value <= max) return i;
  }
  return rows.length - 1;
}

function num(v: string | undefined | null): number | null {
  if (!v) return null;
  const n = parseFloat(String(v).replace(",", "."));
  return isNaN(n) ? null : n;
}

const measurePoints = [
  { n: 1, label: "Stature", desc: "Hauteur totale, du sommet de la tête aux pieds." },
  { n: 2, label: "Tour de poitrine", desc: "Mesuré au niveau le plus fort de la poitrine." },
  { n: 3, label: "Tour de taille", desc: "Mesuré au creux naturel de la taille." },
  { n: 4, label: "Tour de bassin", desc: "Mesuré au niveau le plus fort des hanches." },
];

function GuideTaillesPage() {
  const { children, user } = useStore();
  const [childId, setChildId] = useState<string>("");

  // Auto-select first child when available.
  useEffect(() => {
    if (!childId && children.length > 0) setChildId(children[0].id);
  }, [children, childId]);

  const selectedChild = useMemo(() => children.find((c) => c.id === childId) ?? null, [children, childId]);

  const recommendation = useMemo(() => {
    if (!selectedChild) return null;
    const stature = num(selectedChild.hauteur);
    const poitrine = num(selectedChild.tour);
    const tailleM = num(selectedChild.tour_taille);
    const bassin = num(selectedChild.tour_bassin);
    const candidates: { key: string; idx: number; value: number }[] = [];
    if (stature !== null) candidates.push({ key: "Stature", idx: findRowIndexFor(stature, "stature"), value: stature });
    if (poitrine !== null)
      candidates.push({ key: "Tour de poitrine", idx: findRowIndexFor(poitrine, "poitrine"), value: poitrine });
    if (tailleM !== null)
      candidates.push({ key: "Tour de taille", idx: findRowIndexFor(tailleM, "taille"), value: tailleM });
    if (bassin !== null)
      candidates.push({ key: "Tour de bassin", idx: findRowIndexFor(bassin, "bassin"), value: bassin });
    if (candidates.length === 0) return null;
    // Take the most enveloping (largest) suggestion.
    const best = candidates.reduce((a, b) => (b.idx > a.idx ? b : a));
    const allSame = candidates.every((c) => c.idx === candidates[0].idx);
    return {
      idx: best.idx,
      row: rows[best.idx],
      drivers: candidates,
      consistent: allSame,
    };
  }, [selectedChild]);

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
        <div className="mt-3 text-sm leading-relaxed text-muted-foreground space-y-4">
          <p>
            <b>Le tableau ci-dessous est un barème "corps à nu" </b> : il indique la taille de vêtement adaptée à votre
            enfant pour une <b>première couche</b> (body, t-shirt, polo, chemise), en s'appuyant sur les normes et
            statistiques françaises en vigueur.
          </p>
          <br />
          <p>
            <b>Ce tableau ne s'applique pas directement aux vêtements de deuxième ou troisième couche</b> (pulls,
            sweatshirts, blouses…). Pour ces articles, une recommandation de taille spécifique est indiquée directement
            sur la page de chaque vêtement, tenant compte de sa coupe et de son aisance
          </p>
          <br />
          <p>
            <b>Avant de commander</b>, nous vous conseillons de faire essayer le vêtement visé à votre enfant, si
            possible sur un exemplaire d'un camarade. En cas d'hésitation entre deux tailles, privilégiez la taille
            supérieure.
          </p>
        </div>

        {user && (
          <div className="mt-6 rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Suggestion personnalisée
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Sélectionnez un enfant pour mettre en évidence la taille recommandée d'après ses mesures enregistrées dans{" "}
              <span className="font-medium text-foreground">Mes enfants</span>.
            </p>
            <div className="mt-3">
              <ChildPicker value={childId} onChange={setChildId} />
            </div>

            {selectedChild && recommendation && (
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-xl bg-primary/5 px-3 py-2 text-xs">
                <span className="font-semibold text-foreground">
                  Taille recommandée : <span className="text-primary">{recommendation.row.age}</span>
                </span>
                <span className="text-muted-foreground">
                  {recommendation.drivers.map((d) => `${d.key} ${d.value} cm → ${rows[d.idx].age}`).join(" · ")}
                </span>
                {!recommendation.consistent && (
                  <span className="rounded-full px-2 py-0.5 font-semibold bg-amber-50 text-emerald-500">
                    En cas de mesures discordantes —&gt; la taille la plus enveloppante est retenue dans la
                    recommandation
                  </span>
                )}
              </div>
            )}

            {selectedChild && !recommendation && (
              <p className="mt-3 text-xs text-muted-foreground">
                Aucune mesure renseignée pour {selectedChild.prenom}. Ajoutez sa stature et son tour de poitrine dans{" "}
                <span className="font-medium text-foreground">Mes enfants</span>.
              </p>
            )}
          </div>
        )}

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] border-collapse text-xs sm:text-sm">
                <colgroup>
                  <col className="w-[20%]" />
                  <col className="w-[20%]" />
                  <col className="w-[20%]" />
                  <col className="w-[20%]" />
                  <col className="w-[20%]" />
                </colgroup>
                <thead>
                  <tr className="bg-secondary text-left text-[10px] uppercase tracking-wider text-muted-foreground sm:text-[11px]">
                    <th scope="col" className="sticky left-0 z-10 bg-secondary px-2 py-2.5 sm:px-4 sm:py-3">
                      Taille
                    </th>
                    <th scope="col" className="px-2 py-2.5 sm:px-4 sm:py-3">
                      <span className="inline-flex items-center gap-1.5">
                        <NumberBadge n={1} />
                        <span className="hidden sm:inline">Stature</span>
                        <span className="sm:hidden">Stat.</span>
                      </span>
                    </th>
                    <th scope="col" className="px-2 py-2.5 sm:px-4 sm:py-3">
                      <span className="inline-flex items-center gap-1.5">
                        <NumberBadge n={2} />
                        <span className="hidden sm:inline">Tour de poitrine</span>
                        <span className="sm:hidden">Poitr.</span>
                      </span>
                    </th>
                    <th scope="col" className="px-2 py-2.5 sm:px-4 sm:py-3">
                      <span className="inline-flex items-center gap-1.5">
                        <NumberBadge n={3} />
                        <span className="hidden sm:inline">Tour de taille</span>
                        <span className="sm:hidden">Taille</span>
                      </span>
                    </th>
                    <th scope="col" className="px-2 py-2.5 sm:px-4 sm:py-3">
                      <span className="inline-flex items-center gap-1.5">
                        <NumberBadge n={4} />
                        <span className="hidden sm:inline">Tour de bassin</span>
                        <span className="sm:hidden">Bassin</span>
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {rows.map((r, i) => (
                    <tr
                      key={r.age}
                      className={
                        recommendation?.idx === i
                          ? "bg-emerald-100 ring-2 ring-inset ring-lime-500"
                          : i % 2 === 1
                            ? "bg-secondary/30"
                            : undefined
                      }
                    >
                      <th
                        scope="row"
                        className={`sticky left-0 z-10 px-2 py-2.5 text-left font-semibold text-foreground sm:px-4 sm:py-3 ${
                          recommendation?.idx === i ? "bg-emerald-300" : i % 2 === 1 ? "bg-secondary/60" : "bg-card"
                        }`}
                      >
                        <span className="inline-flex items-center gap-1.5">
                          {r.age}
                          {recommendation?.idx === i && (
                            <span className="rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase text-white bg-emerald-700">
                              Reco
                            </span>
                          )}
                        </span>
                      </th>
                      <td className="whitespace-nowrap px-2 py-2.5 text-foreground/80 sm:px-4 sm:py-3">{r.stature}</td>
                      <td className="whitespace-nowrap px-2 py-2.5 text-foreground/80 sm:px-4 sm:py-3">{r.poitrine}</td>
                      <td className="whitespace-nowrap px-2 py-2.5 text-foreground/80 sm:px-4 sm:py-3">{r.taille}</td>
                      <td className="whitespace-nowrap px-2 py-2.5 text-foreground/80 sm:px-4 sm:py-3">{r.bassin}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="whitespace-pre-line border-t border-border bg-secondary/40 px-3 py-2 text-[11px] text-muted-foreground sm:px-4 font-medium">
              Mesures en centimètres. {"\n"}Faites défiler horizontalement si nécessaire.
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
