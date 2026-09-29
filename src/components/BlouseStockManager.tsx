import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Save, RefreshCw } from "lucide-react";

type Row = { id: string; size: string; remaining: number };

const SIZE_ORDER = ["3 ans", "4 ans", "6 ans", "8 ans", "10 ans", "12 ans", "14 ans", "16 ans", "18 ans"];

export function BlouseStockManager() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("blouse_stock").select("id, size, remaining");
    if (error) {
      toast.error("Impossible de charger le stock");
    } else {
      const sorted = [...(data ?? [])].sort(
        (a, b) => SIZE_ORDER.indexOf(a.size) - SIZE_ORDER.indexOf(b.size),
      );
      setRows(sorted as Row[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const updateLocal = (id: string, value: number) => {
    setRows((r) => r.map((row) => (row.id === id ? { ...row, remaining: value } : row)));
  };

  const save = async (row: Row) => {
    setSaving(row.id);
    const { error } = await supabase
      .from("blouse_stock")
      .update({ remaining: Math.max(0, Math.floor(row.remaining || 0)) })
      .eq("id", row.id);
    setSaving(null);
    if (error) toast.error("Échec de la sauvegarde");
    else toast.success(`Stock ${row.size} mis à jour`);
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">Stock blouses officielles</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Le stock est déduit automatiquement à chaque paiement validé. Les tailles à 0 sont bloquées à la commande.
          </p>
        </div>
        <button
          onClick={load}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-xs font-medium text-foreground hover:bg-muted"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Rafraîchir
        </button>
      </div>

      {loading ? (
        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Chargement…
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {rows.map((row) => (
            <div
              key={row.id}
              className={`rounded-xl border p-3 ${
                row.remaining === 0 ? "border-red-300 bg-red-50" : "border-border bg-background"
              }`}
            >
              <div className="text-xs font-semibold text-muted-foreground">{row.size}</div>
              <div className="mt-2 flex items-center gap-1.5">
                <input
                  type="number"
                  min={0}
                  value={row.remaining}
                  onChange={(e) => updateLocal(row.id, parseInt(e.target.value || "0", 10))}
                  className="h-9 w-full rounded-md border border-border bg-card px-2 text-sm focus:border-primary focus:outline-none"
                />
                <button
                  onClick={() => save(row)}
                  disabled={saving === row.id}
                  aria-label="Enregistrer"
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {saving === row.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
