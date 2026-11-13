import { useState } from "react";
import { DayPicker } from "react-day-picker";
import { fr, enUS } from "date-fns/locale";
import { CalendarDays } from "lucide-react";
import { useLanguage } from "@/i18n/useLanguage";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import CalendarDropdown from "./calendar-dropdown";
import "react-day-picker/style.css";
import "./date-time-picker.css";

// Date-only values are calendar dates, independent of the device's timezone.
const parseDate = value => /^\d{4}-\d{2}-\d{2}$/.test(value || "") ? new Date(`${value}T00:00:00Z`) : undefined;

export default function DateField({ value, onChange, min, max, label, id, required = false, invalid, className, onBlur, disabled }) {
  const { language, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const selected = parseDate(value);
  const before = parseDate(min);
  const after = parseDate(max);
  const today = new Date();
  const initialMonth = selected || (after && today > after ? after : before && today < before ? before : today);
  return <Popover open={open} onOpenChange={next => { setOpen(next); if (!next) onBlur?.(); }}>
    <PopoverTrigger asChild>
      <button type="button" id={id} disabled={disabled} aria-label={label} aria-required={required || undefined} aria-invalid={invalid || undefined} className={cn("flex h-10 w-full min-w-0 items-center gap-2 rounded-lg border border-border bg-background/50 px-3 text-left text-[13px] text-foreground outline-none transition-colors hover:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-50 aria-[invalid=true]:border-destructive", className)}>
        <CalendarDays aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
        <span className="truncate">{selected ? new Intl.DateTimeFormat(language, { timeZone: "UTC", day: "numeric", month: "short", year: "numeric" }).format(selected) : t("Select date")}</span>
      </button>
    </PopoverTrigger>
    <PopoverContent aria-label={label} align="start" collisionPadding={12} className="trade-date-popover w-[300px] max-w-[calc(100vw-24px)] overflow-y-auto rounded-xl p-3" style={{ maxHeight: "var(--radix-popover-content-available-height)" }}>
      <DayPicker autoFocus locale={language === "fr-FR" ? fr : enUS} timeZone="UTC" mode="single" required selected={selected} defaultMonth={initialMonth} disabled={[...(before ? [{ before }] : []), ...(after ? [{ after }] : [])]} onSelect={date => { if (date) { onChange(date.toISOString().slice(0, 10)); setOpen(false); onBlur?.(); } }} showOutsideDays weekStartsOn={1} captionLayout="dropdown" navLayout="after" startMonth={new Date("1970-01-01T00:00:00Z")} endMonth={new Date("2100-12-31T00:00:00Z")} components={{ Dropdown: CalendarDropdown }} />
      {!required && value && <button type="button" className="mt-2 w-full rounded-lg border-t border-border py-2 text-xs text-muted-foreground hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary" onClick={() => { onChange(""); setOpen(false); onBlur?.(); }}>{t("Clear")}</button>}
    </PopoverContent>
  </Popover>;
}
