import { ShellMotif } from "@/components/SchoolMotif";
import directorPhoto from "@/assets/emmanuel-ortolo.jpg";

type Props = {
  /** Texte de la citation (sans guillemets, ils sont ajoutés). */
  quote: string;
  /** Variant visuel. `hero` pour les pages d'accueil/landing, `card` pour les pages produit. */
  variant?: "hero" | "card";
  className?: string;
};

/**
 * Bloc "Mot du chef d'établissement" réutilisable.
 * Harmonise le rendu sur l'index, les pages produit, et toute autre page.
 */
export function DirectorQuote({ quote, variant = "hero", className = "" }: Props) {
  if (variant === "card") {
    return (
      <figure className={`rounded-3xl border border-border bg-card p-8 sm:p-12 ${className}`}>
        <div className="grid items-center gap-8 md:grid-cols-[auto,1fr] md:gap-10">
          <div className="mx-auto md:mx-0">
            <div className="relative h-32 w-32 overflow-hidden rounded-full border-4 border-card shadow-[var(--shadow-card)] ring-1 ring-primary/15 sm:h-40 sm:w-40">
              <img
                src={directorPhoto}
                alt="Emmanuel ORTOLO, Chef d'établissement"
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
          </div>
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-primary">
              Le mot du chef d'établissement
            </span>
            <blockquote className="mt-5 font-display text-lg leading-relaxed text-foreground sm:text-xl">
              <p>« {quote} »</p>
            </blockquote>
            <figcaption className="mt-6 flex items-center gap-3">
              <span className="h-px w-10 bg-gold" />
              <div>
                <div className="text-sm font-semibold text-foreground">Emmanuel ORTOLO</div>
                <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Chef d'établissement · Coordinateur du Groupe Scolaire
                </div>
              </div>
            </figcaption>
          </div>
        </div>
      </figure>
    );
  }

  return (
    <section className={`relative overflow-hidden border-t border-border bg-secondary ${className}`}>
      <div className="pointer-events-none absolute inset-0 -z-0 text-primary">
        <ShellMotif className="absolute -left-32 -bottom-32 h-[420px] w-[420px]" opacity={0.05} />
        <ShellMotif className="absolute -right-32 -top-32 h-[420px] w-[420px]" opacity={0.05} />
      </div>
      <div className="relative mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="grid items-center justify-center place-items-center gap-10 md:grid-cols-[auto,1fr] md:gap-12">
          <div className="mx-auto md:mx-0">
            <div className="relative h-40 w-40 overflow-hidden rounded-full border-4 border-card shadow-[var(--shadow-card)] ring-1 ring-primary/15 sm:h-48 sm:w-48">
              <img
                src={directorPhoto}
                alt="Emmanuel ORTOLO, Chef d'établissement"
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
          </div>
          <div className="text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.18em] text-primary">
              Le mot du chef d'établissement
            </span>
            <figure className="mt-8">
              <svg
                aria-hidden="true"
                className="mx-auto h-10 w-10 text-gold/70"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M7.17 6C4.32 6 2 8.32 2 11.17V18h6.83v-6.83H5.17C5.17 9.42 6.42 8.17 8.17 8.17V6h-1zm10 0c-2.85 0-5.17 2.32-5.17 5.17V18h6.83v-6.83h-3.66c0-1.75 1.25-3 3-3V6h-1z"></path>
              </svg>
              <blockquote className="mt-6 font-display text-xl leading-relaxed text-foreground sm:text-2xl">
                <p>« {quote} »</p>
              </blockquote>
              <figcaption className="mt-8 flex flex-col items-center gap-1">
                <span className="h-px w-12 bg-gold"></span>
                <span className="mt-3 font-semibold tracking-wide text-foreground text-lg">Emmanuel ORTOLO</span>
                <span className="uppercase tracking-[0.18em] text-muted-foreground text-sm">
                  Chef d'établissement · Coordinateur du Groupe Scolaire
                </span>
              </figcaption>
            </figure>
          </div>
        </div>
      </div>
    </section>
  );
}