import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { formatPercent, formatValue } from "@/lib/analytics";
import { cn } from "@/lib/utils";

import AnalyticsCard, { CardHeading } from "./AnalyticsCard";

const COLUMNS = [
  { key: "label", label: "Asset", width: "minmax(140px,1fr)", align: "left" },
  { key: "count", label: "Trades", width: "64px", align: "right" },
  { key: "winRate", label: "Win rate", width: "72px", align: "right" },
  { key: "expectancy", label: "Expectancy", width: "88px", align: "right" },
  { key: "net", label: "Net R", width: "minmax(196px,1.1fr)", align: "right" },
];

const GRID_TEMPLATE = COLUMNS.map((column) => column.width).join(" ");

function compareRows(a, b, key) {
  if (key === "label") return String(a.label).localeCompare(String(b.label));
  return (Number(a[key]) || 0) - (Number(b[key]) || 0);
}

function SortHeader({ column, sort, onSort }) {
  const active = sort.key === column.key;
  return (
    <button
      type="button"
      onClick={() => onSort(column.key)}
      className={cn(
        "inline-flex items-center gap-1 rounded text-[12px] outline-none transition-colors hover:text-ink-secondary focus-visible:ring-2 focus-visible:ring-white/20",
        column.align === "right" ? "justify-end" : "justify-start",
        active ? "text-ink-secondary" : "text-ink-muted",
      )}
    >
      {column.label}
      {active ? (
        <span className="text-[12px] leading-none">{sort.dir === "asc" ? "\u2191" : "\u2193"}</span>
      ) : (
        <ChevronsUpDown className="size-2.5 opacity-40" />
      )}
    </button>
  );
}

function NetCell({ value, maxAbs, unit, diverging = false, muted = false, barTop = false }) {
  const width = maxAbs > 0 ? Math.min(100, Math.abs(value) / maxAbs * 100) : 0;
  return (
    <div className="flex min-w-0 items-center justify-end gap-2">
      <div className="relative h-1.5 w-[110px] shrink-0 overflow-hidden rounded-full bg-surface-raised">
        {diverging && <span className="absolute left-1/2 top-0 h-full w-px bg-ink-muted"/>}
        <div
          className={cn("h-full rounded-full", value > 0 ? "bg-profit" : value < 0 ? "bg-loss" : "bg-ink-muted")}
          style={{ position: "absolute", width: `${diverging ? width/2 : width}%`, left: diverging ? (value < 0 ? `${50-width/2}%` : "50%") : 0 }}
        />
      </div>
      <span
        className={cn(
          "w-[68px] shrink-0 text-right text-[12px] tabular-nums",
          barTop ? "font-medium text-ink" : "font-medium",
          value > 0 ? "text-profit" : value < 0 ? "text-loss" : "text-ink-secondary",
          muted && "text-ink-secondary",
        )}
      >
        {formatValue(value, unit)}
      </span>
    </div>
  );
}

function BreakdownRow({ row, unit, maxAbs, diverging, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "group grid w-full items-center gap-3 rounded-lg px-3 py-3.5 text-left outline-none transition-colors",
        "hover:bg-surface-raised focus-visible:ring-2 focus-visible:ring-white/20",
        selected && "bg-surface-raised",
      )}
      style={{ gridTemplateColumns: GRID_TEMPLATE }}
    >
      <span className="flex min-w-0 items-center gap-1.5">
        <span className="flex size-3 shrink-0 items-center justify-center">
          {selected && <Check className="size-3 text-ink" />}
        </span>
        <span className="truncate text-[13px] font-medium text-ink">{row.label}</span>
      </span>
      <span className="text-right text-[12px] tabular-nums text-ink-muted">{row.count}</span>
      <span className="text-right text-[12px] tabular-nums text-ink-muted">
        {formatPercent(row.winRate)}
      </span>
      <span
        className={cn(
          "text-right text-[12px] tabular-nums",
          row.expectancy > 0 ? "text-profit" : row.expectancy < 0 ? "text-loss" : "text-ink-muted",
        )}
      >
        {formatValue(row.expectancy, unit)}
      </span>
      <NetCell value={row.net} maxAbs={maxAbs} unit={unit} diverging={diverging} />
    </button>
  );
}

export default function BreakdownCard({ analytics, filters, onFilter }) {
  const tab = "assets";
  const [sort, setSort] = useState({ key: "net", dir: "desc" });
  const [expanded, setExpanded] = useState(false);
  const { unit, summary } = analytics;
  const rows = analytics.assets;

  const sortedRows = [...rows].sort((a, b) => {
    const result = compareRows(a, b, sort.key);
    return sort.dir === "asc" ? result : -result;
  });
  const visibleRows = expanded ? sortedRows : sortedRows.slice(0, 12);
  const maxAbs = Math.max(
    0,
    ...sortedRows.map((row) => Math.abs(row.net)),

  );
  const diverging = rows.some(row => row.net < 0);
  const selectedValues = filters?.[tab] ?? [];

  function handleSort(key) {
    setSort((current) => ({
      key,
      dir: current.key === key && current.dir === "desc" ? "asc" : "desc",
    }));
  }

  return (
    <AnalyticsCard>
      <CardHeading
        title="By asset" detail="Compare your markets. Select an asset to focus the entire report."

      />

      <div className="overflow-x-auto px-3 pb-3 pt-5 min-[900px]:px-5 min-[900px]:pb-5">
        <div className="min-w-[620px]">
          <div
            className="grid items-center gap-3 border-b border-hairline px-3 pb-3"
            style={{ gridTemplateColumns: GRID_TEMPLATE }}
          >
            {COLUMNS.map((column) => (
              <div key={column.key} className={column.align === "right" ? "text-right" : ""}>
                <SortHeader column={column} sort={sort} onSort={handleSort} />
              </div>
            ))}
          </div>

          {visibleRows.length === 0 ? (
            <p className="py-10 text-center text-[12px] text-ink-muted">
              No trades in this range.
            </p>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {visibleRows.map((row) => (
                <BreakdownRow
                  key={row.label}
                  row={row}
                  unit={unit}
                  maxAbs={maxAbs}
                  diverging={diverging}
                  selected={selectedValues.includes(row.label)}
                  onClick={() => onFilter(tab, row.label)}
                />
              ))}
            </div>
          )}

          <div
            className="mt-1 grid items-center gap-3 border-t border-hairline px-3 py-4"
            style={{ gridTemplateColumns: GRID_TEMPLATE }}
          >
            <span className="text-[12px] font-medium text-ink-secondary">All assets</span>
            <span className="text-right text-[12px] tabular-nums text-ink-secondary">
              {summary?.closedCount ?? 0}
            </span>
            <span className="text-right text-[12px] tabular-nums text-ink-secondary">
              {formatPercent(summary?.winRate)}
            </span>
            <span
              className={cn(
                "text-right text-[12px] tabular-nums",
                summary?.expectancy > 0
                  ? "text-profit"
                  : summary?.expectancy < 0
                    ? "text-loss"
                    : "text-ink-secondary",
              )}
            >
              {formatValue(summary?.expectancy, unit)}
            </span>
            <NetCell value={summary?.net ?? 0} maxAbs={maxAbs} unit={unit} diverging={diverging} barTop />
          </div>
        </div>
      </div>

      {sortedRows.length > 12 && (
        <div className="border-t border-hairline px-4 py-2">
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            className="text-[12px] text-ink-muted outline-none transition-colors hover:text-ink-secondary focus-visible:ring-2 focus-visible:ring-white/20"
          >
            {expanded ? "Show top 12" : `Show all (${sortedRows.length})`}
          </button>
        </div>
      )}
    </AnalyticsCard>
  );
}
