import { Sparkles } from "lucide-react";

type Variant = "default" | "blouse";

type Props = {
  size: string;
  variant?: Variant;
  className?: string;
};

/**
 * Harmonized badge displayed across the app for "Taille recommandée".
 * - default: 1ʳᵉ couche (t-shirt, polo, chemise)
 * - blouse: ajoute la mention "(taille au-dessus pour la blouse de Septembre 2025)"
 */
export function SizeBadge({ size, variant = "default", className = "" }: Props) {
  const isBlouse = variant === "blouse";
  return (
    <span
      title={
        isBlouse
          ? "Taille recommandée pour la blouse livrée à la rentrée de Septembre 2025 (une taille au-dessus)"
          : "Taille recommandée pour une 1ʳᵉ couche (t-shirt, polo, chemise)"
      }
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold shadow-sm ring-1 ring-inset bg-emerald-50 text-emerald-800 ring-emerald-700 ${className}`}
    >
      <Sparkles className="h-3.5 w-3.5 text-emerald-700" />
      <span className="opacity-80">
        {isBlouse ? "Reco blouse" : "Reco"}&nbsp;:
      </span>
      <span className="font-bold">{size}</span>
    </span>
  );
}
