import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  buildCalendarWeeks,
  compareMonth,
  formatDateLabel,
  formatValue,
  monthLabel,
  summarizeCalendarMonth,
} from "@/lib/analytics";
import { cn } from "@/lib/utils";

import AnalyticsCard from "./AnalyticsCard";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const GRID_TEMPLATE = "repeat(7, minmax(0,1fr)) 78px";

function clampMonth(year, month, bounds) {
  if (!bounds) return { year, month };
  if (compareMonth(year, month, bounds.minYear, bounds.minMonth) < 0) {
    return { year: bounds.minYear, month: bounds.minMonth };
  }
  if (compareMonth(year, month, bounds.maxYear, bounds.maxMonth) > 0) {
    return { year: bounds.maxYear, month: bounds.maxMonth };
  }
  return { year, month };
}

function dayTone(net) {
  if (net > 0) return "var(--profit-tint)";
  if (net < 0) return "var(--loss-tint)";
  return "var(--surface-raised)";
}

function DayPopover({ cell, entry, trades, unit, onOpenTrade }) {
  return (
    <PopoverContent side="right" align="start" className="w-[280px] p-0">
      <div className="flex w-full items-center justify-between gap-3 border-b border-hairline px-3 py-2.5">
        <div>
          <p className="text-[11px] font-medium text-ink">
            {formatDateLabel(cell.key, "MMM d, yyyy")}
          </p>
          <p className="mt-0.5 text-[12px] text-ink-muted">
            {entry.count} {entry.count === 1 ? "trade" : "trades"}
          </p>
        </div>
        <span
          className={cn(
            "text-[12px] font-medium tabular-nums",
            entry.net > 0 ? "text-profit" : entry.net < 0 ? "text-loss" : "text-ink-secondary",
          )}
        >
          {formatValue(entry.net, unit)}
        </span>
      </div>
      <div className="max-h-64 overflow-y-auto px-3 py-1">
        {trades.map((trade, index) => (
          <button type="button" onClick={() => onOpenTrade?.(trade)}
            key={`${trade.seq}-${index}`}
            className="flex w-full items-center justify-between gap-3 border-b border-hairline py-2 last:border-b-0"
          >
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-[11px] text-ink-secondary">
                <span className="truncate">{trade.asset}</span>
                <span className="rounded border border-hairline px-1 text-[11px] text-ink-muted">
                  {trade.side}
                </span>
              </p>
              <p className="mt-0.5 text-[12px] tabular-nums text-ink-muted">
                {formatDateLabel(trade.date, "HH:mm")}
                <span className="mx-1 text-ink-faint">{"\u00b7"}</span>
                {formatValue(trade.value, unit)}
              </p>
            </div>
            <span
              className={cn(
                "shrink-0 text-[11px] font-medium tabular-nums",
                trade.r > 0 ? "text-profit" : trade.r < 0 ? "text-loss" : "text-ink-secondary",
              )}
            >
              {formatValue(trade.r, "R")}
            </span>
          </button>
        ))}
      </div>
    </PopoverContent>
  );
}

export default function CalendarCard({
  calendar,
  unit,
  bounds,
  month,
  onMonthChange,
  onOpenTrade,
}) {
  const [selectedDay, setSelectedDay] = useState(null);
  const fallback = {
    year: bounds?.maxYear ?? new Date().getFullYear(),
    month: bounds?.maxMonth ?? new Date().getMonth(),
  };
  const view = clampMonth(
    month?.year ?? fallback.year,
    month?.month ?? fallback.month,
    bounds,
  );

  const weeks = useMemo(
    () => buildCalendarWeeks(view.year, view.month, calendar).filter(week => week.cells.some(cell => cell.inMonth)),
    [calendar, view.year, view.month],
  );
  const summary = useMemo(
    () => summarizeCalendarMonth(calendar, view.year, view.month),
    [calendar, view.year, view.month],
  );
  const atStart = bounds
    ? compareMonth(view.year, view.month, bounds.minYear, bounds.minMonth) <= 0
    : true;
  const atEnd = bounds
    ? compareMonth(view.year, view.month, bounds.maxYear, bounds.maxMonth) >= 0
    : true;

  function move(delta) {
    const date = new Date(view.year, view.month + delta, 1);
    setSelectedDay(null);
    onMonthChange({ year: date.getFullYear(), month: date.getMonth() });
  }

  return (
    <AnalyticsCard>
      <div className="flex flex-wrap items-center justify-between gap-4 px-5 pb-2 pt-5 min-[900px]:px-6 min-[900px]:pt-6">
        <div className="flex min-w-0 items-center gap-1.5">
          <button
            type="button"
            onClick={() => move(-1)}
            aria-label="Previous month"
            className={cn(
              "flex size-8 items-center justify-center rounded-md border border-hairline text-ink-muted outline-none transition-colors hover:bg-surface-raised hover:text-ink focus-visible:ring-2 focus-visible:ring-white/20",
              atStart && "invisible",
            )}
          >
            <ChevronLeft className="size-3.5" />
          </button>
          <span className="whitespace-nowrap px-2 text-[14px] font-medium tabular-nums text-ink">
            {monthLabel(view.year, view.month)}
          </span>
          <button
            type="button"
            onClick={() => move(1)}
            aria-label="Next month"
            className={cn(
              "flex size-8 items-center justify-center rounded-md border border-hairline text-ink-muted outline-none transition-colors hover:bg-surface-raised hover:text-ink focus-visible:ring-2 focus-visible:ring-white/20",
              atEnd && "invisible",
            )}
          >
            <ChevronRight className="size-3.5" />
          </button>
        </div>

        <p className="text-right text-[12px] tabular-nums text-ink-muted">
          <span
            className={cn(
              "font-medium",
              summary.net > 0 ? "text-profit" : summary.net < 0 ? "text-loss" : "text-ink-secondary",
            )}
          >
            {formatValue(summary.net, unit)}
          </span>
          <span className="mx-1.5 text-ink-faint">{"\u00b7"}</span>
          {summary.count} {summary.count === 1 ? "trade" : "trades"}
          <span className="mx-1.5 text-ink-faint">{"\u00b7"}</span>
          {summary.greenDays}/{summary.tradingDays} green days
        </p>
      </div>

      <div className="overflow-x-auto px-3 pb-3 pt-4 min-[900px]:px-6 min-[900px]:pb-6">
        <div className="space-y-1">
          <div className="analytics-calendar grid gap-1" style={{ gridTemplateColumns: GRID_TEMPLATE }}>
            {WEEKDAYS.map((day) => (
              <div key={day} className="pb-2 text-center text-[11px] text-ink-muted">
                {day}
              </div>
            ))}
            <div className="pb-2 text-center text-[11px] text-ink-muted">Week</div>
          </div>

          {weeks.map((week, weekIndex) => (
            <div
              key={`week-${weekIndex}`}
              className="analytics-calendar grid gap-1"
              style={{ gridTemplateColumns: GRID_TEMPLATE }}
            >
              {week.cells.map((cell) => {
                if (!cell.inMonth) {
                  return <div key={cell.key} className="min-h-[58px] min-[900px]:min-h-[76px]" />;
                }

                const entry = calendar?.[cell.key];
                if (!entry) {
                  return (
                    <div
                      key={cell.key}
                      className="min-h-[58px] min-[900px]:min-h-[76px] rounded-md border border-hairline px-1.5 py-1"
                    >
                      <span className="text-[11px] tabular-nums text-ink-muted">
                        {cell.day}
                      </span>
                    </div>
                  );
                }

                const trades = entry.trades ?? [];
                return (
                  <Popover
                    key={cell.key}
                    open={selectedDay === cell.key}
                    onOpenChange={(open) => setSelectedDay(open ? cell.key : null)}
                  >
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        aria-label={`Open trades for ${cell.key}`}
                        className={cn(
                          "flex min-h-[58px] min-[900px]:min-h-[76px] flex-col items-start justify-between rounded-md border border-white/[0.04] px-0.5 min-[900px]:px-1.5 py-1 text-left outline-none",
                          "transition-colors hover:border-hairline-strong focus-visible:ring-2 focus-visible:ring-white/20",
                        )}
                        style={{ backgroundColor: dayTone(entry.net) }}
                      >
                        <span className="text-[11px] tabular-nums text-ink-muted">{cell.day}</span>
                        <span
                          className={cn(
                            "w-full text-[10px] min-[900px]:text-[13px] font-medium tabular-nums",
                            entry.net > 0 ? "text-profit" : entry.net < 0 ? "text-loss" : "text-ink-secondary",
                          )}
                        >
                          <span className="min-[900px]:hidden">{formatValue(entry.net, unit).replace(/R$/, "")}</span><span className="hidden min-[900px]:inline">{formatValue(entry.net, unit)}</span>
                        </span>
                        <span className="trade-count hidden min-[900px]:block text-[11px] text-ink-muted">{entry.count} trades</span>
                      </button>
                    </PopoverTrigger>
                    <DayPopover cell={cell} entry={entry} trades={trades} unit={unit} onOpenTrade={onOpenTrade} />
                  </Popover>
                );
              })}

              <div className="flex min-h-[58px] min-[900px]:min-h-[76px] flex-col items-start justify-center rounded-md border border-hairline bg-surface-raised px-1.5 py-1">
                {week.count > 0 ? (
                  <>
                    <span
                      className={cn(
                        "text-[12px] font-medium tabular-nums",
                        week.net > 0 ? "text-profit" : week.net < 0 ? "text-loss" : "text-ink-secondary",
                      )}
                    >
                      {formatValue(week.net, unit)}
                    </span>
                    <span className="trade-count mt-0.5 text-[11px] text-ink-muted">
                      {week.count} {week.count === 1 ? "trade" : "trades"}
                    </span>
                  </>
                ) : (
                  <span className="text-[12px] text-ink-muted">{"\u2014"}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </AnalyticsCard>
  );
}
