import { useEffect, useRef, useState } from "react";
import { Check, Plus } from "lucide-react";

export default function AssetCombobox({ value, onChange, options = [], onCreateAsset }) {
  const [query,     setQuery]     = useState(value ?? "");
  const [open,      setOpen]      = useState(false);
  const inputRef     = useRef(null);
  const containerRef = useRef(null);

  // Keep input in sync when value changes from outside (form reset)
  useEffect(() => { setQuery(value ?? ""); }, [value]);

  const qUpper   = query.toUpperCase();
  const filtered = options.filter((o) => o.toUpperCase().includes(qUpper));
  const exact    = options.some((o) => o.toUpperCase() === qUpper);
  const canCreate = qUpper.length > 0 && !exact;

  function select(asset) {
    onChange(asset);
    setQuery(asset);
    setOpen(false);
  }

  function handleCreate() {
    if (!qUpper) return;
    onCreateAsset?.(qUpper);
    select(qUpper);
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
    // small delay so click-on-option fires first
    setTimeout(() => {
      if (!containerRef.current?.contains(document.activeElement)) {
        setOpen(false);
        // If user typed something not in list and didn't create, reset to last valid value
        if (!options.includes(query) && query !== value) {
          setQuery(value ?? "");
          onChange(value ?? "");
        }
      }
    }, 150);
  }

  useEffect(() => {
    function down(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", down);
    return () => document.removeEventListener("mousedown", down);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value.toUpperCase());
          onChange(""); // clear until selection confirmed
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder="e.g. EURUSD"
        autoComplete="off"
        className="h-9 w-full rounded-md border border-zinc-800 bg-zinc-900/60 px-3 text-sm font-mono text-zinc-100 placeholder:text-zinc-600 outline-none focus:ring-1 focus:ring-emerald-500/50"
      />

      {open && (filtered.length > 0 || canCreate) && (
        <div className="absolute z-50 mt-1 max-h-52 w-full overflow-y-auto rounded-md border border-zinc-800 bg-zinc-900 shadow-2xl">
          {filtered.map((asset) => (
            <button
              key={asset}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); select(asset); }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm font-mono hover:bg-zinc-800"
            >
              <Check
                className={`size-3.5 shrink-0 ${value === asset ? "text-emerald-400" : "opacity-0"}`}
              />
              <span className="text-zinc-200">{asset}</span>
            </button>
          ))}
          {canCreate && (
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); handleCreate(); }}
              className="flex w-full items-center gap-2 border-t border-zinc-800/60 px-3 py-2 text-sm text-emerald-400 hover:bg-zinc-800"
            >
              <Plus className="size-3.5 shrink-0" />
              Add &ldquo;{qUpper}&rdquo; to catalog
            </button>
          )}
        </div>
      )}
    </div>
  );
}
