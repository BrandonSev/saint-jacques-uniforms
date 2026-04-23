import logo from "@/assets/saint-jacques-logo-full.png";

/**
 * Decorative coquille / sun rays motif inspired by the
 * Saint-Jacques de Compostelle blason. Used as a soft background.
 */
export function ShellMotif({ className = "", opacity = 0.07 }: { className?: string; opacity?: number }) {
  return (
    <svg
      viewBox="0 0 400 400"
      className={className}
      aria-hidden
      style={{ opacity }}
    >
      <defs>
        <radialGradient id="sun" cx="50%" cy="55%" r="55%">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.9" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="200" cy="220" r="60" fill="url(#sun)" />
      {Array.from({ length: 22 }).map((_, i) => {
        const angle = -90 + (i - 11) * 7;
        const rad = (angle * Math.PI) / 180;
        const x2 = 200 + Math.cos(rad) * 260;
        const y2 = 220 + Math.sin(rad) * 260;
        return (
          <line
            key={i}
            x1={200}
            y1={220}
            x2={x2}
            y2={y2}
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
          />
        );
      })}
    </svg>
  );
}

/**
 * School identity ribbon — sits below the header on every authenticated
 * page to reinforce the Saint-Jacques visual world.
 */
export function SchoolIdentityBar() {
  return (
    <div className="relative overflow-hidden border-b border-border" style={{ background: "var(--gradient-shield)" }}>
      <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2 text-white">
        <ShellMotif className="absolute -right-20 -top-10 h-[280px] w-[280px]" opacity={0.18} />
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-1/3 text-white">
        <ShellMotif className="absolute -left-24 top-0 h-[260px] w-[260px]" opacity={0.10} />
      </div>
      <div className="relative mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white/95 p-1 shadow-sm">
          <img src={logo} alt="Saint-Jacques de Compostelle" className="h-full w-full object-contain" />
        </div>
        <div className="min-w-0 flex-1 leading-tight text-white">
          <div className="text-[10px] font-medium uppercase tracking-[0.22em] text-white/70">
            Groupe scolaire catholique de Dax
          </div>
          <div className="truncate text-sm font-semibold tracking-tight sm:text-base">
            Saint-Jacques de Compostelle
          </div>
        </div>
        <div className="hidden items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-white/90 backdrop-blur sm:inline-flex">
          Espace familles · Rentrée 2026-2027
        </div>
      </div>
    </div>
  );
}