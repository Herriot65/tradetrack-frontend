import { useState } from "react";
import { DayPicker } from "react-day-picker";
import { enUS, fr } from "date-fns/locale";
import { CalendarDays } from "lucide-react";
import { getLanguage, translate as t } from "@/i18n/language";
import { useLanguage } from "@/i18n/useLanguage";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { CalendarDropdown } from "./date-time-picker";
import "react-day-picker/style.css";
import "./date-time-picker.css";

const toDate = value => value ? new Date(`${value}T00:00:00Z`) : undefined;

export default function DatePicker({ id, label, value, onChange, min, max }) {
  useLanguage();
  const [open, setOpen] = useState(false);
  const selected = toDate(value);
  const disabled = [
    ...(min ? [{ before: toDate(min) }] : []),
    ...(max ? [{ after: toDate(max) }] : []),
  ];
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button id={id} type="button" aria-label={label} className="flex h-9 min-w-0 items-center gap-2 rounded-lg border border-hairline bg-surface-raised px-3 text-[11px] text-ink-secondary outline-none focus-visible:ring-2 focus-visible:ring-white/20">
          <CalendarDays className="size-3.5 shrink-0 text-ink-muted" />
          <span>{selected ? new Intl.DateTimeFormat(getLanguage(), { timeZone: "UTC", month: "short", day: "numeric", year: "numeric" }).format(selected) : t("Select date")}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent aria-label={label} align="start" collisionPadding={12} className="trade-date-popover w-[300px] max-w-[calc(100vw-24px)] overflow-y-auto rounded-xl p-3" style={{ maxHeight: "var(--radix-popover-content-available-height)" }}>
        <DayPicker
          locale={getLanguage() === "fr-FR" ? fr : enUS}
          mode="single" required selected={selected} defaultMonth={selected || toDate(max) || toDate(min) || new Date()}
          onSelect={date => { if (date) { onChange(date.toISOString().slice(0, 10)); setOpen(false); } }}
          disabled={disabled} timeZone="UTC" showOutsideDays weekStartsOn={1}
          captionLayout="dropdown" navLayout="after"
          startMonth={new Date(Date.UTC(1970, 0, 1))} endMonth={new Date(Date.UTC(2100, 11, 31))}
          components={{ Dropdown: CalendarDropdown }}
        />
        <button type="button" className="mt-3 rounded px-2 py-1 text-xs text-ink-muted hover:text-ink" onClick={() => { onChange(""); setOpen(false); }}>{t("Clear")}</button>
      </PopoverContent>
    </Popover>
  );
}
