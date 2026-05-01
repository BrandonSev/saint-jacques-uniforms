import { useEffect, useRef, useState } from "react";
import { MapPin, Loader2 } from "lucide-react";

type Suggestion = {
  label: string;
  name: string;
  postcode: string;
  city: string;
};

type Props = {
  value: string;
  onChange: (v: string) => void;
  onSelect: (s: { adresse: string; code_postal: string; ville: string }) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
  maxLength?: number;
};

/**
 * Champ d'autocomplétion d'adresse basé sur l'API Adresse (gouv.fr).
 * Gratuit, sans clé, idéal pour les adresses françaises.
 */
export function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = "12 rue des Écoles",
  className,
  required,
  maxLength = 200,
}: Props) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length < 3) {
      setSuggestions([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        setLoading(true);
        const url = `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(
          value,
        )}&limit=5&autocomplete=1`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("API error");
        const json = await res.json();
        const items: Suggestion[] = (json.features ?? []).map((f: any) => ({
          label: f.properties.label as string,
          name: f.properties.name as string,
          postcode: f.properties.postcode as string,
          city: f.properties.city as string,
        }));
        setSuggestions(items);
        setOpen(items.length > 0);
        setActiveIdx(-1);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value]);

  const handleSelect = (s: Suggestion) => {
    onSelect({ adresse: s.name, code_postal: s.postcode, ville: s.city });
    onChange(s.name);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <span className="pointer-events-none absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-muted-foreground">
        <MapPin className="h-4 w-4" />
      </span>
      <input
        type="text"
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        onKeyDown={(e) => {
          if (!open) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActiveIdx((i) => Math.min(i + 1, suggestions.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveIdx((i) => Math.max(i - 1, 0));
          } else if (e.key === "Enter" && activeIdx >= 0) {
            e.preventDefault();
            handleSelect(suggestions[activeIdx]);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
        placeholder={placeholder}
        maxLength={maxLength}
        autoComplete="street-address"
        className={className}
      />
      {loading && (
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
        </span>
      )}
      {open && suggestions.length > 0 && (
        <ul className="absolute left-0 right-0 top-full z-50 mt-1.5 max-h-64 overflow-auto rounded-xl border border-border bg-card shadow-lg">
          {suggestions.map((s, idx) => (
            <li key={`${s.label}-${idx}`}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(s);
                }}
                className={`flex w-full items-start gap-2 px-3 py-2 text-left text-sm transition-colors ${
                  activeIdx === idx
                    ? "bg-primary/10 text-primary"
                    : "text-foreground hover:bg-muted"
                }`}
              >
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span>
                  <span className="block font-medium">{s.name}</span>
                  <span className="block text-xs text-muted-foreground">
                    {s.postcode} {s.city}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}