import { useState } from "react";
import { Clock3 } from "lucide-react";
import { useLanguage } from "@/i18n/useLanguage";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import SelectField from "./select-field";
import { Button } from "./button";

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));

export default function TimeField({ value, onChange, label, required, className }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [hour = "00", minute = "00"] = (value || "00:00").split(":");
  return <Popover open={open} onOpenChange={setOpen}>
    <PopoverTrigger asChild><button type="button" aria-label={label} aria-required={required || undefined} className={cn("flex h-10 w-full items-center gap-2 rounded-lg border border-border bg-background/50 px-3 text-sm tabular-nums outline-none hover:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary/30", className)}><Clock3 className="size-4 text-muted-foreground" aria-hidden="true" />{value ? `${hour}:${minute}` : t("Select time")}</button></PopoverTrigger>
    <PopoverContent align="start" collisionPadding={12} className="w-64 max-w-[calc(100vw-24px)] rounded-xl">
      <p className="mb-3 text-xs text-muted-foreground">{t("Time (24-hour)")}</p>
      <div className="flex items-center gap-2"><SelectField label={`${label} ${t("hour")}`} value={hour} onValueChange={next => onChange(`${next}:${minute}`)} options={HOURS} allowClear={false} /><span>:</span><SelectField label={`${label} ${t("minute")}`} value={minute} onValueChange={next => onChange(`${hour}:${next}`)} options={MINUTES} allowClear={false} /></div>
      <Button type="button" size="sm" className="mt-3 w-full" onClick={() => { if (!value) onChange(`${hour}:${minute}`); setOpen(false); }}>{t("Done")}</Button>
    </PopoverContent>
  </Popover>;
}
