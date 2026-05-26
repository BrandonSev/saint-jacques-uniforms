import { AlertTriangle, CalendarClock } from "lucide-react";

/**
 * Date limite de commande pour garantir la fabrication et la livraison
 * des blouses pour la rentrée 2026.
 */
export const BACK_TO_SCHOOL_DEADLINE = "24 mai 2026";
export const BACK_TO_SCHOOL_DEADLINE_DATE = new Date(2026, 4, 24); // 24 mai 2026

/**
 * Nombre de jours restants avant la date limite (>=0).
 */
export function daysUntilDeadline(now: Date = new Date()): number {
  const ms = BACK_TO_SCHOOL_DEADLINE_DATE.getTime() - now.getTime();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

/**
 * Bandeau fin (header global) — visible sur toutes les pages.
 */
export function BackToSchoolBanner() {
  return (
    <div className="w-full bg-green-200 text-green-400">
      <div className="mx-auto flex max-w-6xl w-full items-center justify-center gap-2 px-4 py-2 text-[12px] font-semibold leading-snug sm:px-6 sm:text-[13px] lg:px-8">
        <CalendarClock className="hidden h-4 w-4 shrink-0 sm:inline" aria-hidden />
        <span className="text-center">
          <strong>Précommande garantie terminée.</strong> Vous pouvez encore commander selon les blouses disponibles à
          produire.
          <br />
          Nous ferons notre maximum pour intégrer les commandes reçues rapidement à la production.
        </span>
      </div>
    </div>
  );
}

/**
 * Bloc plus visible — à insérer en tête des pages d'achat
 * (boutique, fiche produit, panier).
 */
export function BackToSchoolAlert({ className = "" }: { className?: string }) {
  return (
    <div
      role="alert"
      className={`rounded-2xl border border-red-400 bg-red-50 p-4 sm:p-5 text-red-900 shadow-[var(--shadow-card)] ${className}`}
    >
      <div className="gap-3 items-start justify-start flex flex-col">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-200/70 text-red-900">
          <AlertTriangle className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-wider sm:text-[13px]">
            Préparation de la rentrée 2026
          </p>
          <p className="mt-1 text-sm leading-relaxed sm:text-[15px]">
            Pour garantir la fabrication dans nos ateliers en France et la livraison à votre enfant pour la rentrée de
            septembre 2026, merci de passer commande avant le{" "}
            <strong className="whitespace-nowrap underline">{BACK_TO_SCHOOL_DEADLINE}</strong>.
          </p>
          <p className="mt-1.5 text-[12px] leading-relaxed text-red-900/70 sm:text-[13px]">
            Les commandes passées au-delà de cette date restent possibles, mais nous ne pourrons pas vous garantir la
            disponibilité de toutes les tailles, ni la livraison avant la rentrée. Anticipez et commandez dès maintenant
            !
          </p>
        </div>
      </div>
    </div>
  );
}
