import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Normalise une civilité stockée en base ("M.", "Mme", "Mlle", …) vers son
 * libellé complet ("Monsieur", "Madame", "Mademoiselle"). Si la valeur est
 * déjà complète ou inconnue, elle est renvoyée telle quelle.
 */
export function formatCivilite(value?: string | null): string {
  if (!value) return "";
  const v = value.trim();
  const lower = v.toLowerCase().replace(/\.$/, "");
  switch (lower) {
    case "m":
    case "mr":
    case "monsieur":
      return "Monsieur";
    case "mme":
    case "madame":
      return "Madame";
    case "mlle":
    case "mademoiselle":
      return "Mademoiselle";
    default:
      return v;
  }
}
