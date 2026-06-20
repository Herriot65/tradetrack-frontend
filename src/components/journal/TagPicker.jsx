import { useEffect, useRef, useState } from "react";
import { Plus, X } from "lucide-react";

export default function TagPicker({
  selected = [],
  onChange,
  options = [],
  onCreateTag,
  placeholder = "Select or create…",
  emptyText,
}) {
  const [query,  setQuery]  = useState("");
  const [open,   setOpen]   = useState(false);
  const inputRef     = useRef(null);
  const containerRef = useRef(null);

  const filtered = options.filter(
    (o) => !selected.includes(o) && o.toLowerCase().includes(query.toLowerCase())
  );
  const trimmed   = query.trim();
  const canCreate = trimmed.length > 0 &&
    !options.some((o) => o.toLowerCase() === trimmed.toLowerCase()) &&
    !selected.includes(trimmed);

  function add(tag) {
    if (!selected.includes(tag)) onChange([...selected, tag]);
    setQuery("");
    inputRef.current?.focus();
  }

  function remove(tag) {
    onChange(selected.filter((t) => t !== tag));
  }

  function handleCreate() {
    if (!trimmed) return;
    onCreateTag?.(trimmed);
    add(trimmed);
  }

  function handleKeyDown(e) {
    if (e.key === "Backspace" && !query && selected.length > 0) {
      remove(selected[selected.length - 1]);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered.length > 0) add(filtered[0]);
      else if (canCreate) handleCreate();
    } else if (e.key === "Escape") {
      setOpen(false);
    }
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

  const showDropdown = open && (filtered.length > 0 || canCreate);

  return (
    <div ref={containerRef} className="relative">
      {/* Tag chips + input */}
      <div
        className="flex min-h-9 w-full flex-wrap items-center gap-1 rounded-md border border-zinc-800 bg-zinc-900/60 px-2 py-1 cursor-text"
        onClick={() => { inputRef.current?.focus(); setOpen(true); }}
      >
        {selected.length === 0 && !query && emptyText && (
          <span className="text-xs text-zinc-600 py-0.5">{emptyText}</span>
        )}
        {selected.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-200"
          >
            {tag}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); remove(tag); }}
              className="text-zinc-500 hover:text-zinc-100"
            >
              <X className="size-2.5" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={selected.length === 0 ? placeholder : ""}
          className="min-w-[80px] flex-1 bg-transparent text-sm text-zinc-100 outline-none placeholder:text-zinc-600"
        />
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute z-50 mt-1 max-h-52 w-full overflow-y-auto rounded-md border border-zinc-800 bg-zinc-900 shadow-2xl">
          {filtered.map((tag) => (
            <button
              key={tag}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); add(tag); }}
              className="flex w-full items-center px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
            >
              {tag}
            </button>
          ))}
          {canCreate && (
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); handleCreate(); }}
              className="flex w-full items-center gap-2 border-t border-zinc-800/60 px-3 py-2 text-sm text-emerald-400 hover:bg-zinc-800"
            >
              <Plus className="size-3.5 shrink-0" />
              Create &ldquo;{trimmed}&rdquo;
            </button>
          )}
        </div>
      )}
    </div>
  );
}
