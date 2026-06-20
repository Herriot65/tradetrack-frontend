import { useEffect, useRef, useState } from "react";
import { Check, Plus } from "lucide-react";

// Generic single-select combobox backed by a per-journal catalog list.
// Preserves case (unlike AssetCombobox which forces uppercase).
export default function CatalogCombobox({
  value,
  onChange,
  options = [],
  onCreateOption,
  placeholder = "Select or type…",
  createLabel = (v) => `Add "${v}"`,
}) {
  const [query,     setQuery]     = useState(value ?? "");
  const [open,      setOpen]      = useState(false);
  const containerRef = useRef(null);

  useEffect(() => { setQuery(value ?? ""); }, [value]);

  const filtered  = options.filter((o) => o.toLowerCase().includes(query.toLowerCase()));
  const exact     = options.some((o) => o.toLowerCase() === query.toLowerCase());
  const canCreate = query.trim().length > 0 && !exact;

  function select(opt) {
    onChange(opt);
    setQuery(opt);
    setOpen(false);
  }

  function handleCreate() {
    const v = query.trim();
    if (!v) return;
    onCreateOption?.(v);
    select(v);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      if (filtered.length > 0) select(filtered[0]);
      else if (canCreate) handleCreate();
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  function handleBlur() {
    setTimeout(() => {
      if (!containerRef.current?.contains(document.activeElement)) {
        setOpen(false);
        if (!options.includes(query) && query !== value) {
          setQuery(value ?? "");
          onChange(value ?? "");
        }
      }
    }, 150);
  }

  useEffect(() => {
    function down(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", down);
    return () => document.removeEventListener("mousedown", down);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => { setQuery(e.target.value); onChange(""); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoComplete="off"
        className="h-9 w-full rounded-md border border-zinc-800 bg-zinc-900/60 px-3 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:ring-1 focus:ring-emerald-500/50"
      />

      {open && (filtered.length > 0 || canCreate) && (
        <div className="absolute z-50 mt-1 max-h-52 w-full overflow-y-auto rounded-md border border-zinc-800 bg-zinc-900 shadow-2xl">
          {filtered.map((opt) => (
            <button
              key={opt}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); select(opt); }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-zinc-800"
            >
              <Check className={`size-3.5 shrink-0 ${value === opt ? "text-emerald-400" : "opacity-0"}`} />
              <span className="text-zinc-200">{opt}</span>
            </button>
          ))}
          {canCreate && (
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); handleCreate(); }}
              className="flex w-full items-center gap-2 border-t border-zinc-800/60 px-3 py-2 text-sm text-emerald-400 hover:bg-zinc-800"
            >
              <Plus className="size-3.5 shrink-0" />
              {createLabel(query.trim())}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
