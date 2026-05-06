import margueritePortrait from "@/assets/marguerite-de-perignon.jpg";
import { ShellMotif } from "@/components/SchoolMotif";

type Props = {
  /** Texte de la citation (sans guillemets, ils sont ajoutés). */
  quote: string;
  /** Variant visuel. `hero` pour pages d'accueil/landing, `card` pour pages produit. */
  variant?: "hero" | "card";
  className?: string;
};

/**
 * Bloc "Mot de la cheffe d'établissement — 1er degré" réutilisable.
 * Pendant de DirectorQuote pour Marguerite de Pérignon.
 */
export function HeadteacherQuote({ quote, variant = "card", className = "" }: Props) {
  if (variant === "card") {
    return (
      <figure
        className={`overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)] ${className}`}
      >
        <div className="flex flex-col gap-0 sm:flex-row sm:items-stretch">
          <img
            src={margueritePortrait}
            alt="Marguerite de Pérignon, Cheffe d'établissement du 1er degré"
            className="h-40 w-full object-cover sm:h-auto sm:w-40 sm:shrink-0"
            loading="lazy"
          />
          <div className="flex flex-col justify-center gap-3 p-5 sm:p-6">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.16em] text-primary">
              Mot de la cheffe d'établissement — 1er degré
            </span>
            <blockquote className="font-display text-sm leading-relaxed text-foreground sm:text-base">
              <p>« {quote} »</p>
            </blockquote>
            <figcaption className="flex items-center gap-2.5">
              <span className="h-px w-8 bg-gold" />
              <div>
                <div className="text-xs font-semibold text-foreground">Marguerite de Pérignon</div>
                <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                  Cheffe d'établissement · 1er degré
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
                src={margueritePortrait}
                alt="Marguerite de Pérignon, Cheffe d'établissement du 1er degré"
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
          </div>
          <div className="text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.18em] text-primary">
              Le mot de la cheffe d'établissement — 1er degré
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
                <span className="mt-3 text-sm font-semibold tracking-wide text-foreground">Marguerite de Pérignon</span>
                <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Cheffe d'établissement · 1er degré
                </span>
              </figcaption>
            </figure>
          </div>
        </div>
      </div>
    </section>
  );
}