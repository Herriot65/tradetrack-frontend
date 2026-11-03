import { memo, useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";

// Keep keystrokes local: the table only receives a committed search term.
export default memo(function TradeSearchInput({ onSearch }) {
  const [draft, setDraft] = useState("");
  const input = useRef(null);
  useEffect(() => {
    const timeout = setTimeout(() => onSearch(draft.trim()), 300);
    return () => clearTimeout(timeout);
  }, [draft, onSearch]);
  return <div className="relative w-full max-w-xs flex-1">
    <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-zinc-500" />
    <Input ref={input} aria-label="Search assets" placeholder="Search asset..." value={draft} onChange={event => setDraft(event.target.value)} onKeyDown={event => { if(event.key === "Enter") onSearch(draft.trim()); }} className="h-9 border-zinc-800 bg-zinc-900/60 pl-8 pr-9 text-sm placeholder:text-zinc-600 focus-visible:ring-zinc-400/30" />
    {draft && <button type="button" aria-label="Clear asset search" className="absolute right-1 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded text-zinc-500 hover:text-zinc-100" onClick={() => { setDraft(""); onSearch(""); input.current?.focus(); }}><X className="size-3.5"/></button>}
  </div>;
});
