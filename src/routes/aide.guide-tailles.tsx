import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { Ruler } from "lucide-react";
import { PageWatermark } from "@/components/PageWatermark";

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

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-start">
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <table className="w-full text-sm">
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
    <svg
      viewBox="0 0 240 360"
      className="h-80 w-auto"
      role="img"
      aria-label="Schéma des 4 points de mesure : stature, tour de poitrine, tour de taille, tour de bassin"
    >
      <defs>
        <linearGradient id="bodyFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(var(--muted))" stopOpacity="0.55" />
          <stop offset="100%" stopColor="hsl(var(--muted))" stopOpacity="0.85" />
        </linearGradient>
      </defs>

      {/* ---------- Stature axis (1) ---------- */}
      <g stroke="hsl(var(--primary))" strokeWidth="1.5" fill="none" strokeLinecap="round">
        <line x1="22" y1="34" x2="22" y2="326" />
        <polyline points="16,42 22,32 28,42" />
        <polyline points="16,318 22,328 28,318" />
      </g>
      <g>
        <circle cx="22" cy="180" r="11" fill="hsl(var(--primary))" />
        <text x="22" y="184" textAnchor="middle" fontSize="12" fontWeight="700" fill="hsl(var(--primary-foreground))">1</text>
      </g>

      {/* ---------- Child silhouette (front view) ----------
          Drawn as a single soft outline. Coordinates are tuned so the
          chest / waist / hip bands sit on the correct anatomical points. */}
      <g
        fill="url(#bodyFill)"
        stroke="hsl(var(--foreground) / 0.55)"
        strokeWidth="1.4"
        strokeLinejoin="round"
        strokeLinecap="round"
      >
        {/* Head */}
        <path d="M120 30
                 C 100 30, 92 50, 94 68
                 C 95 80, 102 88, 110 92
                 L 110 100
                 C 110 106, 116 110, 120 110
                 C 124 110, 130 106, 130 100
                 L 130 92
                 C 138 88, 145 80, 146 68
                 C 148 50, 140 30, 120 30 Z" />
        {/* Body : shoulders → arms → waist → hips → legs */}
        <path d="M 92 112
                 C 80 116, 74 128, 72 144
                 L 68 196
                 C 66 208, 64 218, 62 226
                 L 70 230
                 C 74 222, 78 210, 80 198
                 L 84 168
                 L 86 200
                 C 86 232, 84 262, 86 296
                 L 100 320
                 L 112 320
                 L 114 248
                 C 114 232, 117 220, 120 218
                 C 123 220, 126 232, 126 248
                 L 128 320
                 L 140 320
                 L 154 296
                 C 156 262, 154 232, 154 200
                 L 156 168
                 L 160 198
                 C 162 210, 166 222, 170 230
                 L 178 226
                 C 176 218, 174 208, 172 196
                 L 168 144
                 C 166 128, 160 116, 148 112
                 C 142 110, 136 110, 130 110
                 L 110 110
                 C 104 110, 98 110, 92 112 Z" />
      </g>

      {/* ---------- Measurement bands ---------- */}
      <g stroke="hsl(var(--primary))" fill="none" strokeWidth="2.5" strokeLinecap="round">
        {/* (2) Poitrine */}
        <line x1="74" y1="158" x2="166" y2="158" />
        {/* (3) Taille */}
        <line x1="80" y1="190" x2="160" y2="190" />
        {/* (4) Bassin */}
        <line x1="76" y1="222" x2="164" y2="222" />
      </g>

      {/* ---------- Numbered badges (centered on body) ---------- */}
      <g>
        <circle cx="120" cy="158" r="11" fill="hsl(var(--primary))" stroke="white" strokeWidth="2" />
        <text x="120" y="162" textAnchor="middle" fontSize="12" fontWeight="700" fill="hsl(var(--primary-foreground))">2</text>

        <circle cx="120" cy="190" r="11" fill="hsl(var(--primary))" stroke="white" strokeWidth="2" />
        <text x="120" y="194" textAnchor="middle" fontSize="12" fontWeight="700" fill="hsl(var(--primary-foreground))">3</text>

        <circle cx="120" cy="222" r="11" fill="hsl(var(--primary))" stroke="white" strokeWidth="2" />
        <text x="120" y="226" textAnchor="middle" fontSize="12" fontWeight="700" fill="hsl(var(--primary-foreground))">4</text>
      </g>

      {/* Ground line */}
      <line x1="90" y1="330" x2="150" y2="330" stroke="hsl(var(--foreground) / 0.25)" strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}