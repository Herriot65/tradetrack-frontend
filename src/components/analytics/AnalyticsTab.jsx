import { useRef, useState } from "react";
import { BarChart3, Sparkles } from "lucide-react";
import { format, subMonths } from "date-fns";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useJournalAnalytics } from "@/hooks/useJournalAnalytics";
import { breakEvenThresholdR, tradesToCsv } from "@/lib/analytics";

import TradeDetailPanel from "@/components/journal/TradeDetailPanel";

import AnalyticsHeader from "./AnalyticsHeader";
import BreakdownCard from "./BreakdownCard";
import CalendarCard from "./CalendarCard";
import DonutSection from "./DonutSection";
import EquitySection from "./EquitySection";
import KpiRow from "./KpiRow";
import MonthlyCard from "./MonthlyCard";
import SequenceCards from "./SequenceCards";
import TimingCard from "./TimingCard";

function LoadingSkeleton() {
  return (
    <div className="analytics-page space-y-3">
      <div className="flex items-center gap-2">
        <Skeleton className="h-7 w-40 bg-white/[0.05]" />
        <Skeleton className="h-7 w-20 bg-white/[0.04]" />
        <Skeleton className="h-7 w-24 bg-white/[0.04]" />
        <Skeleton className="ml-auto h-7 w-24 bg-white/[0.04]" />
      </div>
      <div className="grid grid-cols-2 gap-3 min-[900px]:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-[90px] rounded-xl bg-white/[0.04]" />
        ))}
      </div>
      <Skeleton className="h-[58px] rounded-xl bg-white/[0.04]" />
      <Skeleton className="h-[530px] rounded-xl bg-white/[0.04]" />
      <div className="grid gap-3 min-[900px]:grid-cols-2">
        <Skeleton className="h-[190px] rounded-xl bg-white/[0.04]" />
        <Skeleton className="h-[190px] rounded-xl bg-white/[0.04]" />
      </div>
      <Skeleton className="h-[300px] rounded-xl bg-white/[0.04]" />
      <Skeleton className="h-[360px] rounded-xl bg-white/[0.04]" />
      <Skeleton className="h-[280px] rounded-xl bg-white/[0.04]" />
      <Skeleton className="h-[120px] rounded-xl bg-white/[0.04]" />
      <Skeleton className="h-[430px] rounded-xl bg-white/[0.04]" />
    </div>
  );
}

function NoticeCard({ title, description, action }) {
  return (
    <div className="rounded-xl border border-hairline bg-surface-card px-6 py-16 text-center">
      <div className="mx-auto flex size-10 items-center justify-center rounded-lg border border-hairline bg-surface-raised">
        <BarChart3 className="size-4 text-ink-muted" />
      </div>
      <p className="mt-4 text-[13px] font-medium text-ink">{title}</p>
      <p className="mx-auto mt-1 max-w-sm text-[11px] leading-5 text-ink-muted">
        {description}
      </p>
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

export default function AnalyticsTab({
  journal,
  jLoading,
  syntheticEnabled,
  syntheticBusy,
  syntheticError,
  onToggleSynthetic,
}) {
  const [selectedTrade, setSelectedTrade] = useState(null);
  const [range, setRange] = useState("YTD");
  const [unit, setUnit] = useState("R");
  const [filters, setFilters] = useState({ assets: [], setups: [], sessions: [] });
  const [calendarMonth, setCalendarMonth] = useState(null);
  const [customRange, setCustomRange] = useState(() => ({
    start: format(subMonths(new Date(), 3), "yyyy-MM-dd"),
    end: format(new Date(), "yyyy-MM-dd"),
  }));
  const calendarRef = useRef(null);

  const {
    analytics,
    monthBounds,
    availableOptions,
    unitOptions,
    filteredTrades,
    loading,
    error,
    refetch,
    hasData,
    hasRangeData,
  } = useJournalAnalytics({
    range,
    customRange,
    filters,
    unit,
    journal,
  });

  const isLoading = jLoading || loading;
  const selectedFilterCount =
    filters.assets.length + filters.setups.length + filters.sessions.length;

  function toggleFilter(kind, value) {
    setCalendarMonth(null);
    setFilters((current) => {
      const selected = current[kind] ?? [];
      return {
        ...current,
        [kind]: selected.includes(value)
          ? selected.filter((item) => item !== value)
          : [...selected, value],
      };
    });
  }

  function clearFilters() {
    setCalendarMonth(null);
    setFilters({ assets: [], setups: [], sessions: [] });
  }

  function handleRangeChange(nextRange) {
    setRange(nextRange);
    setCalendarMonth(null);
  }

  function openMonth(year, month) {
    setCalendarMonth({ year, month });
    requestAnimationFrame(() => {
      calendarRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function handleExport() {
    const csv = tradesToCsv(filteredTrades, {
      unit: analytics.unit,
      breakEvenThreshold: breakEvenThresholdR(journal),
      startingCapital: Number(journal?.startingCapital ?? journal?.starting_capital ?? 0),
    });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `performance-${range.toLowerCase()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <NoticeCard
        title="Failed to load analytics"
        description={error}
        action={
          <Button size="sm" variant="outline" onClick={refetch}>
            Retry
          </Button>
        }
      />
    );
  }

  const header = (
    <AnalyticsHeader
      range={range}
      onRangeChange={handleRangeChange}
      unit={analytics.unit}
      unitOptions={unitOptions}
      onUnitChange={setUnit}
      customRange={customRange}
      onCustomRangeChange={value => { setCustomRange(value); setCalendarMonth(null); }}
      availableOptions={availableOptions}
      filters={filters}
      onToggleFilter={toggleFilter}
      onClearFilters={clearFilters}
      onExport={handleExport}
      sampleEnabled={syntheticEnabled}
      sampleBusy={syntheticBusy}
      sampleError={syntheticError}
      onRemoveSample={() => onToggleSynthetic(false)}
    />
  );

  if (!hasData) {
    return (
      <div className="analytics-page space-y-3">
        {header}
        <NoticeCard
          title="No data yet"
          description="Add closed trades to this journal, or explore the board with a realistic sample dataset."
          action={
            <div className="flex flex-col items-center gap-2">
              <Button
                size="sm"
                onClick={() => onToggleSynthetic(true)}
                disabled={syntheticBusy}
              >
                <Sparkles className="size-3.5" />
                {syntheticBusy ? "Generating..." : "Use sample data"}
              </Button>
              {syntheticError && (
                <p className="max-w-xs text-[11px] text-loss">{syntheticError}</p>
              )}
            </div>
          }
        />
      </div>
    );
  }

  return (
    <div className="analytics-page space-y-3">
      {header}
      <TradeDetailPanel trade={selectedTrade ? { ...selectedTrade.original, _derivedStatus: selectedTrade.status } : null} open={!!selectedTrade} onClose={() => setSelectedTrade(null)} />

      {!hasRangeData ? (
        <NoticeCard
          title="No trades in this range"
          description="Try a longer date range or clear the active filters."
          action={
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => { handleRangeChange("ALL"); clearFilters(); }}>
                Reset filters
              </Button>
              {selectedFilterCount > 0 && (
                <Button size="sm" variant="ghost" onClick={clearFilters}>
                  Clear filters
                </Button>
              )}
            </div>
          }
        />
      ) : (
        <>
          <KpiRow summary={analytics.summary} unit={analytics.unit} />

          <EquitySection analytics={analytics} />

          <DonutSection analytics={analytics} />

          <SequenceCards analytics={analytics} onOpenTrade={setSelectedTrade} />

          <BreakdownCard
            analytics={analytics}
            filters={filters}
            onFilter={toggleFilter}
          />

          <TimingCard analytics={analytics} />


          <div ref={calendarRef} className="scroll-mt-32">
            <CalendarCard
              calendar={analytics.calendar}
              unit={analytics.unit}
              bounds={monthBounds}
              month={calendarMonth}
              onMonthChange={setCalendarMonth}
              onOpenTrade={setSelectedTrade}
            />
          </div>
          {monthBounds.minYear !== monthBounds.maxYear && <MonthlyCard analytics={analytics} bounds={monthBounds} onOpenMonth={openMonth} />}
        </>
      )}
    </div>
  );
}
