import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Plus, UserPlus } from "lucide-react";
import { useStore, type Child } from "@/lib/store";
import { AddChildDialog } from "@/components/AddChildDialog";

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
  const [openAdd, setOpenAdd] = useState(false);

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
      <>
        <button
          type="button"
          onClick={() => setOpenAdd(true)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-primary/40 bg-primary/5 px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/10"
        >
          <UserPlus className="h-3.5 w-3.5" /> Ajouter un enfant d'abord
        </button>
        <AddChildDialog
          open={openAdd}
          onClose={() => setOpenAdd(false)}
          onCreated={(c) => onChange(c.id)}
        />
      </>
    );
  }

  if (list.length === 0) {
    return (
      <>
        <div className="rounded-lg border border-dashed border-border bg-secondary/40 px-3 py-2 text-xs text-muted-foreground">
          Vous n'avez aucun&nbsp;enfant concerné par cette section.{" "}
          <button
            type="button"
            onClick={() => setOpenAdd(true)}
            className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
          >
            <UserPlus className="h-3 w-3" /> Ajouter un enfant
          </button>
        </div>
        <AddChildDialog
          open={openAdd}
          onClose={() => setOpenAdd(false)}
          onCreated={(c) => onChange(c.id)}
        />
      </>
    );
  }

  return (
    <>
    <div className="flex flex-wrap gap-1.5">
      {list.map((c: Child) => (
        <button
          key={c.id}
          onClick={() => onChange(c.id)}
          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold transition-all ${
            value === c.id
              ? c.genre === "Fille"
                ? "border-pink-400 bg-pink-500 text-white"
                : c.genre === "Garçon"
                ? "border-sky-400 bg-sky-500 text-white"
                : "border-primary bg-primary text-primary-foreground"
              : "border-border bg-card text-foreground hover:border-primary/40"
          }`}
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/30 text-[10px] font-bold">
            {c.initials}
          </span>
          {c.prenom}
        </button>
      ))}
      <button
        type="button"
        onClick={() => setOpenAdd(true)}
        title="Ajouter un nouvel enfant"
        aria-label="Ajouter un nouvel enfant"
        className="inline-flex items-center gap-1 rounded-full border border-dashed border-primary/40 bg-primary/5 px-3 py-1.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/10"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
    <AddChildDialog
      open={openAdd}
      onClose={() => setOpenAdd(false)}
      onCreated={(c) => onChange(c.id)}
    />
    </>
  );
}