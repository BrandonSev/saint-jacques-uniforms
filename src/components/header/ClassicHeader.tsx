/**
 * Phase 7 — Variant "classic" du header (header historique SJDC).
 *
 * Aucune modification de comportement : on ré-exporte le composant existant
 * `SiteHeader` afin que `<HeaderDispatch>` puisse switcher dessus par défaut.
 */

export { SiteHeader as ClassicHeader } from "@/components/SiteHeader";