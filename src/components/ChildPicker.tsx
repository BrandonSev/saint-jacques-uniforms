import { Link } from "@tanstack/react-router";
import { UserPlus } from "lucide-react";
import { useStore, type Child } from "@/lib/store";

export function ChildPicker({
  value,
  onChange,
  filter,
}: {
  value: string;
  onChange: (id: string) => void;
  filter?: (c: Child) => boolean;
}) {
  const { children, user } = useStore();
  const list = filter ? children.filter(filter) : children;

  if (!user) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-secondary/40 px-3 py-2.5 text-xs text-muted-foreground">
        <Link to="/login" className="font-semibold text-primary hover:underline">
          Connectez-vous
        </Link>{" "}
        pour choisir un enfant.
      </div>
    );
  }

  if (children.length === 0) {
    return (
      <Link
        to="/enfants"
        className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-primary/40 bg-primary/5 px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/10"
      >
        <UserPlus className="h-3.5 w-3.5" /> Ajouter un enfant d'abord
      </Link>
    );
  }

  if (list.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-secondary/40 px-3 py-2 text-xs text-muted-foreground">
        Aucun enfant concerné par cette section.{" "}
        <Link to="/enfants" className="font-semibold text-primary hover:underline">
          Modifier
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {list.map((c: Child) => (
        <button
          key={c.id}
          onClick={() => onChange(c.id)}
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all ${
            value === c.id
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-card text-foreground hover:border-primary/40"
          }`}
        >
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/30 text-[9px] font-bold">
            {c.initials}
          </span>
          {c.prenom}
        </button>
      ))}
    </div>
  );
}