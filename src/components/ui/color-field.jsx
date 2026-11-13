import { useRef, useState } from "react";
import { Check } from "lucide-react";
import { useLanguage } from "@/i18n/useLanguage";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Button } from "./button";

const COLORS = ["#f4f4f5", "#18181b", "#94a3b8", "#ef4444", "#fb923c", "#facc15", "#4ade80", "#2dd4bf", "#38bdf8", "#818cf8", "#c084fc", "#f472b6"];

function Palette({ value, onChange }) {
  const { t } = useLanguage();
  const [hex, setHex] = useState(value);
  const valid = /^#[\da-f]{6}$/i.test(hex);
  return <>
    <div className="grid grid-cols-6 gap-2">{COLORS.map(color => <button type="button" key={color} aria-label={color} aria-pressed={color.toLowerCase() === value.toLowerCase()} onClick={() => onChange(color)} className="flex size-8 items-center justify-center rounded-lg border border-border outline-none transition-transform hover:scale-110 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2" style={{ backgroundColor: color }}>{color.toLowerCase() === value.toLowerCase() && <Check className="size-4" style={{ color: color === "#18181b" ? "white" : "#18181b" }} />}</button>)}</div>
    <div className="mt-3 flex gap-2"><input aria-label={t("Hex color")} value={hex} maxLength={7} spellCheck={false} onChange={event => setHex(event.target.value)} onKeyDown={event => { if (event.key === "Enter") { event.preventDefault(); if (valid) onChange(hex); } }} className="h-9 min-w-0 flex-1 rounded-lg border border-border bg-background px-2 font-mono text-xs outline-none focus-visible:ring-2 focus-visible:ring-primary/30" /><Button type="button" size="sm" disabled={!valid} onClick={() => onChange(hex)}>{t("Apply")}</Button></div>
  </>;
}

export default function ColorField({ value, onChange, label }) {
  const [open, setOpen] = useState(false);
  const applied = useRef(false);
  return <Popover open={open} onOpenChange={next => { setOpen(next); if (next) applied.current = false; }}>
    <PopoverTrigger asChild><button type="button" aria-label={label} className="flex h-9 items-center gap-1.5 rounded-md px-2 text-xs text-muted-foreground outline-none hover:bg-secondary focus-visible:ring-2 focus-visible:ring-primary/30"><span>{label}</span><span className="size-5 rounded border border-border" style={{ backgroundColor: value }} /></button></PopoverTrigger>
    <PopoverContent align="start" collisionPadding={12} className="w-[264px] max-w-[calc(100vw-24px)] rounded-xl" onCloseAutoFocus={event => { if (applied.current) event.preventDefault(); }}><Palette value={value} onChange={next => { applied.current = true; onChange(next); setOpen(false); }} /></PopoverContent>
  </Popover>;
}
