import logo from "@/assets/saint-jacques-logo-full.png";

/**
 * Motif circulaire concentrique — accent décoratif sobre,
 * évoquant les cercles du blason Saint-Jacques de Compostelle.
 */
export function ShellMotif({ className = "", opacity = 0.07 }: { className?: string; opacity?: number }) {
  return (
    <svg viewBox="0 0 400 400" className={className} aria-hidden style={{ opacity }}>
      {Array.from({ length: 8 }).map((_, i) => (
        <circle
          key={i}
          cx="200"
          cy="200"
          r={40 + i * 22}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        />
      ))}
    </svg>
  );
}

/**
 * Formes ondulées décoratives — utilisées en bas de héros pour adoucir la transition.
 */
export function WaveMotif({ className = "", opacity = 1 }: { className?: string; opacity?: number }) {
  return (
    <svg
      viewBox="0 0 1200 200"
      preserveAspectRatio="none"
      className={className}
      aria-hidden
      style={{ opacity }}
    >
      <path
        d="M0,80 C200,140 400,20 600,80 C800,140 1000,20 1200,80 L1200,200 L0,200 Z"
        fill="currentColor"
        opacity="0.6"
      />
      <path
        d="M0,110 C200,170 400,50 600,110 C800,170 1000,50 1200,110 L1200,200 L0,200 Z"
        fill="currentColor"
        opacity="0.8"
      />
      <path
        d="M0,140 C200,200 400,80 600,140 C800,200 1000,80 1200,140 L1200,200 L0,200 Z"
        fill="currentColor"
      />
    </svg>
  );
}

/**
 * School identity ribbon — sits below the header on every authenticated
 * page to reinforce the Saint-Jacques visual world.
 */
export function SchoolIdentityBar() {
  return (
    <div className="relative overflow-hidden border-b border-white/10" style={{ background: "var(--gradient-shield)" }}>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 text-white/20">
        <WaveMotif className="h-full w-full" opacity={0.25} />
      </div>
      <div className="pointer-events-none absolute inset-y-0 right-0 w-1/3 text-white">
        <ShellMotif className="absolute -right-20 -top-10 h-[280px] w-[280px]" opacity={0.18} />
      </div>
      <div className="relative mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white p-0.5 shadow-sm">
          <img src={logo} alt="Saint-Jacques de Compostelle" className="h-full w-full object-contain" />
        </div>
        <div className="min-w-0 flex-1 leading-tight text-white">
          <div className="text-[10px] font-medium uppercase tracking-[0.22em] text-white/70">
            Groupe scolaire catholique de Dax
          </div>
          <div className="truncate text-sm font-semibold tracking-tight sm:text-base">
            Boutique officielle des uniformes
          </div>
        </div>
        <div className="hidden items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-white/90 backdrop-blur sm:inline-flex">
          Espace familles · Rentrée 2026-2027
        </div>
      </div>
    </div>
  );
}