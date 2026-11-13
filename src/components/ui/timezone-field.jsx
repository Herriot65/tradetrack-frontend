import { useId, useState } from "react";
import { Check, Globe, Search } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { cn } from "@/lib/utils";

const ZONES = ["UTC", ...Intl.supportedValuesOf("timeZone")];

export default function TimezoneField({ value, onChange, label, className }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const id = useId();
  const filtered = [...new Set([value, ...ZONES])].filter(zone => zone && zone.toLowerCase().replaceAll("_", " ").includes(query.toLowerCase().replaceAll("_", " ")));
  // Keep IANA aliases accepted by the server/browser available as well.
  if (query && !filtered.includes(query)) {
    try { new Intl.DateTimeFormat("en-US", { timeZone: query }).format(); filtered.unshift(query); } catch { /* Search may be a partial timezone. */ }
  }
  const choose = zone => { onChange(zone); setOpen(false); };
  return <Popover open={open} onOpenChange={next => { setOpen(next); setQuery(""); setActive(0); }}>
    <PopoverTrigger asChild><button type="button" aria-label={label} className={cn("flex h-10 w-full min-w-0 items-center gap-2 rounded-lg border border-border bg-background/50 px-3 text-left text-[13px] outline-none hover:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary/30", className)}><Globe aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" /><span className="truncate">{value || "Select timezone"}</span></button></PopoverTrigger>
    <PopoverContent align="start" collisionPadding={12} className="w-72 max-w-[calc(100vw-24px)] rounded-xl p-1" style={{ maxHeight: "var(--radix-popover-content-available-height)", overflowY: "auto" }}>
      <div className="flex items-center gap-2 border-b border-border px-2"><Search className="size-4 text-muted-foreground" /><input role="combobox" aria-label="Search timezones" aria-expanded="true" aria-autocomplete="list" aria-controls={`${id}-list`} aria-activedescendant={filtered[active] ? `${id}-${active}` : undefined} value={query} placeholder="Search city or timezone…" className="h-10 w-full min-w-0 bg-transparent text-sm outline-none" onChange={event => { setQuery(event.target.value); setActive(0); }} onKeyDown={event => {
        if (event.key === "ArrowDown" || event.key === "ArrowUp") { event.preventDefault(); const next = Math.max(0, Math.min(filtered.length - 1, active + (event.key === "ArrowDown" ? 1 : -1))); setActive(next); document.getElementById(`${id}-${next}`)?.scrollIntoView({ block: "nearest" }); }
        if (event.key === "Enter") { event.preventDefault(); if (filtered[active]) choose(filtered[active]); }
      }} /></div>
      <div id={`${id}-list`} role="listbox" aria-label="Timezones" className="max-h-56 overflow-y-auto py-1">
        {filtered.map((zone, index) => <button type="button" role="option" id={`${id}-${index}`} key={zone} aria-selected={value === zone} tabIndex={-1} onMouseMove={() => setActive(index)} onClick={() => choose(zone)} className={cn("flex min-h-9 w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-xs outline-none", active === index && "bg-primary/10 text-primary")}><Check className={cn("size-3.5 shrink-0", value !== zone && "invisible")} />{zone}</button>)}
      </div>
      {!filtered.length && <p role="status" className="p-3 text-xs text-muted-foreground">No matching timezone. Try a city name.</p>}
    </PopoverContent>
  </Popover>;
}
