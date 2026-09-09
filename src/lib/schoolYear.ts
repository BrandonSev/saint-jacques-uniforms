/**
 * Année scolaire courante et progression des niveaux.
 *
 * Source unique de vérité pour :
 *  - savoir dans quelle année scolaire on se trouve (bascule au 1er juillet),
 *  - connaître l'ordre des niveaux et la section associée à chacun,
 *  - proposer le niveau suivant lors du passage à l'année supérieure.
 */

export type Section = "Maternelle" | "Élémentaire" | "Collège" | "Lycée";

/** Niveaux ordonnés, du plus jeune au plus âgé, avec leur section. */
export const LEVELS: { classe: string; section: Section }[] = [
  { classe: "PS", section: "Maternelle" },
  { classe: "MS", section: "Maternelle" },
  { classe: "GS", section: "Maternelle" },
  { classe: "CP", section: "Élémentaire" },
  { classe: "CE1", section: "Élémentaire" },
  { classe: "CE2", section: "Élémentaire" },
  { classe: "CM1", section: "Élémentaire" },
  // Mapping historique conservé : CM2 est rattaché à la section "Collège".
  { classe: "CM2", section: "Collège" },
  { classe: "6e", section: "Collège" },
  { classe: "5e", section: "Collège" },
  { classe: "4e", section: "Collège" },
  { classe: "3e", section: "Lycée" },
  { classe: "2nde", section: "Lycée" },
  { classe: "1re", section: "Lycée" },
  { classe: "Terminale", section: "Lycée" },
];

/** Classes proposées par section (dérivé de LEVELS, remplace l'ancien objet dupliqué). */
export const classesBySection: Record<Section, string[]> = LEVELS.reduce(
  (acc, { classe, section }) => {
    (acc[section] ??= []).push(classe);
    return acc;
  },
  {} as Record<Section, string[]>,
);

/**
 * Année scolaire courante au format "AAAA/AAAA+1" (ex. "2026/2027").
 * Bascule le 1er juillet : à partir de juillet, on est déjà sur l'année scolaire
 * de la rentrée à venir.
 */
export function currentSchoolYear(now: Date = new Date()): string {
  const y = now.getFullYear();
  const start = now.getMonth() >= 6 ? y : y - 1; // getMonth() : 6 = juillet
  return `${start}/${start + 1}`;
}

/**
 * Niveau suivant dans la progression, ou null si l'enfant sort du lycée
 * (Terminale) ou si le niveau n'est pas reconnu.
 */
export function nextLevel(classe: string): { classe: string; section: Section } | null {
  const idx = LEVELS.findIndex((l) => l.classe === classe);
  if (idx === -1 || idx === LEVELS.length - 1) return null;
  return LEVELS[idx + 1];
}

/** Section associée à un niveau, ou null si inconnu. */
export function sectionForLevel(classe: string): Section | null {
  return LEVELS.find((l) => l.classe === classe)?.section ?? null;
}

/**
 * true si la classe de l'enfant a été confirmée par la famille pour l'année
 * scolaire courante.
 */
export function isClasseConfirmedForCurrentYear(
  classeConfirmeeAnnee: string | null | undefined,
  now: Date = new Date(),
): boolean {
  return !!classeConfirmeeAnnee && classeConfirmeeAnnee === currentSchoolYear(now);
}
