import { Check, Download, Filter, CalendarDays, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDateLabel, getRangeBounds, RANGE_OPTIONS } from "@/lib/analytics";
import { cn } from "@/lib/utils";

import { SegmentedControl } from "./AnalyticsCard";

const FILTER_GROUPS = [
  { key: "assets", label: "Assets" },
  { key: "setups", label: "Setups" },
  { key: "sessions", label: "Sessions" },
];

function FilterChip({ children, onRemove, icon, removeLabel, disabled = false }) {
  return (
    <span className="inline-flex min-h-7 items-center gap-1.5 rounded-md border border-hairline bg-surface-page pl-2.5 pr-1 text-[12px] text-ink-secondary">
      {icon}
      {children}
      <button
        type="button"
        onClick={onRemove}
        disabled={disabled}
        className="flex size-4 items-center justify-center rounded text-ink-muted outline-none transition-colors hover:bg-white/10 hover:text-ink disabled:cursor-wait disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-white/20"
        aria-label={removeLabel ?? `Remove ${children} filter`}
      >
        <X className="size-3" />
      </button>
    </span>
  );
}

export default function AnalyticsHeader({
  range,
  onRangeChange,
  unit,
  unitOptions,
  onUnitChange,
  customRange,
  onCustomRangeChange,
  availableOptions,
  filters,
  onToggleFilter,
  onClearFilters,
  onExport,
  sampleEnabled = false,
  sampleBusy = false,
  sampleError = null,
  onRemoveSample,
}) {
  const customStart = customRange?.start ?? "";
  const customEnd = customRange?.end ?? "";
  const selectedCount = FILTER_GROUPS.reduce(
    (sum, group) => sum + (filters?.[group.key]?.length ?? 0),
    0,
  );
  const bounds = getRangeBounds(range, customRange);
  const rangeLabel = range === "ALL" ? "All time" : `${formatDateLabel(bounds.start, "MMM d, yyyy")} \u2013 ${formatDateLabel(bounds.end, "MMM d, yyyy")}`;

  return (
    <>
    {sampleEnabled && <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-400/15 bg-amber-400/5 px-4 py-2.5 text-[12px] text-amber-200/80"><span>Sample data is enabled</span><button type="button" disabled={sampleBusy} onClick={onRemoveSample} className="rounded px-2 py-1 text-ink-secondary">{sampleBusy ? "Removing sample data..." : "Remove sample data"}</button></div>}
    <div className="analytics-filters sticky top-14 z-20 rounded-xl border border-hairline bg-surface-card p-4 min-[900px]:px-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <SegmentedControl
            label="Date range"
            options={RANGE_OPTIONS}
            value={range}
            onChange={onRangeChange}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SegmentedControl
            label="Display unit"
            options={unitOptions}
            value={unit}
            onChange={onUnitChange}
          />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-9 border-hairline bg-surface-card px-3 text-[12px] text-ink-secondary hover:bg-surface-raised hover:text-ink"
              >
                <Filter className="size-3" />
                Filter
                {selectedCount > 0 && (
                  <span className="ml-0.5 rounded bg-white/10 px-1 text-[12px] text-ink">
                    {selectedCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="max-h-80 w-56 overflow-y-auto border-hairline bg-surface-card p-1"
            >
              {FILTER_GROUPS.map((group, index) => {
                const options = availableOptions?.[group.key] ?? [];
                const selected = filters?.[group.key] ?? [];
                return (
                  <div key={group.key}>
                    {index > 0 && <DropdownMenuSeparator className="bg-hairline" />}
                    <DropdownMenuLabel className="text-[12px] text-ink-muted">
                      {group.label}
                    </DropdownMenuLabel>
                    {options.length === 0 ? (
                      <p className="px-2 py-2 text-[11px] text-ink-muted">
                        No {group.label.toLowerCase()} in range.
                      </p>
                    ) : (
                      options.map((option) => {
                        const active = selected.includes(option);
                        return (
                          <DropdownMenuItem
                            key={option}
                            onSelect={(event) => event.preventDefault()}
                            onClick={() => onToggleFilter(group.key, option)}
                            className="text-[12px] text-ink-secondary focus:bg-surface-raised focus:text-ink"
                          >
                            <span className="w-3.5 text-ink">
                              {active && <Check className="size-3.5" />}
                            </span>
                            <span className="truncate">{option}</span>
                          </DropdownMenuItem>
                        );
                      })
                    )}
                  </div>
                );
              })}
              {selectedCount > 0 && (
                <>
                  <DropdownMenuSeparator className="bg-hairline" />
                  <DropdownMenuItem
                    onClick={onClearFilters}
                    className="text-[12px] text-ink-muted focus:bg-surface-raised focus:text-ink"
                  >
                    Clear filters
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="outline"
            size="sm"
            onClick={onExport}
            className="h-9 border-hairline bg-surface-card px-3 text-[12px] text-ink-secondary hover:bg-surface-raised hover:text-ink"
          >
            <Download className="size-3" />
            Export CSV
          </Button>
        </div>

        {range === "CUSTOM" && (
          <div className="flex w-full flex-wrap items-center gap-2 border-t border-hairline pt-3"><CalendarDays aria-hidden="true" className="size-4 text-ink-muted"/>
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-[11px] text-ink-muted" htmlFor="analytics-start">
              From
            </label>
            <input
              id="analytics-start"
              max={customEnd}
              type="date"
              value={customStart}
              onChange={(event) =>
                onCustomRangeChange({ ...customRange, start: event.target.value })
              }
              className="h-9 rounded-lg border border-hairline bg-surface-raised px-2 text-[11px] text-ink-secondary outline-none focus-visible:ring-2 focus-visible:ring-white/20"
            />
            <label className="text-[11px] text-ink-muted" htmlFor="analytics-end">
              to
            </label>
            <input
              id="analytics-end"
              min={customStart}
              type="date"
              value={customEnd}
              onChange={(event) =>
                onCustomRangeChange({ ...customRange, end: event.target.value })
              }
              className="h-9 rounded-lg border border-hairline bg-surface-raised px-2 text-[11px] text-ink-secondary outline-none focus-visible:ring-2 focus-visible:ring-white/20"
            />
          </div>
        </div>)}
      </div>

      {(
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-hairline pt-3">
          {sampleError && <span className="text-[11px] text-ink-secondary">{sampleError}</span>}
          <FilterChip onRemove={() => onRangeChange("ALL")}>{rangeLabel}</FilterChip>
          {!(filters?.assets?.length) && <span className="rounded-md border border-hairline px-2.5 py-1 text-[12px] text-ink-secondary">All assets</span>}
          {FILTER_GROUPS.flatMap((group) =>
            (filters?.[group.key] ?? []).map((value) => (
              <FilterChip
                key={`${group.key}-${value}`}
                onRemove={() => onToggleFilter(group.key, value)}
              >
                {value}
              </FilterChip>
            )),
          )}
          {selectedCount > 1 && (
            <button
              type="button"
              onClick={onClearFilters}
              className={cn(
                "h-6 rounded-md px-2 text-[11px] text-ink-muted outline-none transition-colors",
                "hover:bg-surface-raised hover:text-ink-secondary focus-visible:ring-2 focus-visible:ring-white/20",
              )}
            >
              Clear all
            </button>
          )}
        </div>
      )}
    </div>
    </>
  );
}
