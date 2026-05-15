/**
 * Phase 6 — Sérialisation contrôlée des theme_tokens d'un tenant en CSS.
 *
 * Ce module est volontairement client-safe (pas d'accès DB, pas d'imports
 * server-only) afin de pouvoir être consommé côté SSR comme côté client.
 *
 * Stratégie de sécurité :
 *   - whitelist stricte des noms de variables autorisées
 *   - valeurs validées par regex (pas de `}`, pas de `<`, pas de `;` libre)
 *   - aucune variable inconnue ne franchit le sérialiseur
 */

/**
 * Variables CSS autorisées à être surchargées par un tenant.
 * Tout token absent de cette liste est silencieusement ignoré.
 */
export const ALLOWED_THEME_TOKENS = [
  // Couleurs sémantiques shadcn
  "background",
  "foreground",
  "card",
  "card-foreground",
  "popover",
  "popover-foreground",
  "primary",
  "primary-foreground",
  "secondary",
  "secondary-foreground",
  "muted",
  "muted-foreground",
  "accent",
  "accent-foreground",
  "destructive",
  "destructive-foreground",
  "border",
  "input",
  "ring",
  // Tokens de marque (cf. src/styles.css)
  "primary-soft",
  "primary-deep",
  "primary-lagoon",
  "school-yellow",
  "cream",
  "gold",
  "teal",
  "teal-deep",
  "rouge",
  // Sidebar
  "sidebar",
  "sidebar-foreground",
  "sidebar-primary",
  "sidebar-primary-foreground",
  "sidebar-accent",
  "sidebar-accent-foreground",
  "sidebar-border",
  "sidebar-ring",
  // Typo + radius
  "radius",
  "font-display",
  "font-sans",
] as const;

export type AllowedThemeToken = (typeof ALLOWED_THEME_TOKENS)[number];

const ALLOWED_SET = new Set<string>(ALLOWED_THEME_TOKENS);

/**
 * Valeur autorisée : oklch(...), rgb(...), hsl(...), #hex, var(--xxx),
 * unités numériques, ou une short-list de keywords. On rejette tout caractère
 * dangereux (`{`, `}`, `<`, `>`, `;`, `\\`, ``).
 */
const SAFE_VALUE = /^[a-zA-Z0-9_\-#.,()%/'"\s]+$/;

function isSafeValue(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 200) return false;
  return SAFE_VALUE.test(trimmed);
}

/**
 * Convertit un objet `theme_tokens` (jsonb DB) en déclarations CSS.
 * Retourne `null` si aucun token valide n'est trouvé.
 */
export function buildThemeCss(
  tokens: Record<string, unknown> | null | undefined,
): string | null {
  if (!tokens || typeof tokens !== "object") return null;

  const lines: string[] = [];
  for (const [rawKey, rawValue] of Object.entries(tokens)) {
    const key = rawKey.startsWith("--") ? rawKey.slice(2) : rawKey;
    if (!ALLOWED_SET.has(key)) continue;
    if (!isSafeValue(rawValue)) continue;
    lines.push(`  --${key}: ${rawValue.trim()};`);
  }

  if (lines.length === 0) return null;
  return `:root{\n${lines.join("\n")}\n}`;
}