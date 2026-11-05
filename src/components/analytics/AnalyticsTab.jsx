import { translate as t } from "@/i18n/language";
import { useLanguage } from "@/i18n/useLanguage";
import "./analytics.css";
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

function LoadingSkeleton({ sampleEnabled }) {
  useLanguage();
  return (
    <div
      className="analytics-page space-y-5 min-[900px]:space-y-6"
      aria-label={t("Loading performance")}
      aria-busy="true"
    >
      <div className="space-y-2">
        <Skeleton className="h-8 w-40 bg-surface-raised" />
        <Skeleton className="h-5 w-64 max-w-full bg-surface-raised" />
      </div>
      {sampleEnabled && <Skeleton className="h-11 rounded-lg bg-surface-raised" />}
      <Skeleton className="h-[156px] rounded-xl bg-surface-raised min-[900px]:h-[110px]" />
      <div className="analytics-outcomes-grid grid gap-5">
        <Skeleton className="h-[224px] rounded-xl bg-surface-raised" />
        <Skeleton className="h-[224px] rounded-xl bg-surface-raised" />
      </div>
      <div className="space-y-4">
        <div className="analytics-hero-grid grid grid-cols-2 gap-4">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-[140px] rounded-xl bg-surface-raised" />
          ))}
        </div>
        <Skeleton className="analytics-stats-skeleton h-[148px] rounded-xl bg-surface-raised" />
      </div>
      <Skeleton className="h-[580px] rounded-xl bg-surface-raised" />
      {[370, 420, 340, 580].map((height) => (
        <Skeleton key={height} style={{ height }} className="rounded-xl bg-surface-raised" />
      ))}
    </div>
  );
}

function NoticeCard({ title, description, action }) {
  useLanguage();
  return (
    <div className="rounded-xl border border-hairline bg-surface-card px-6 py-16 text-center">
      <div className="mx-auto flex size-10 items-center justify-center rounded-lg border border-hairline bg-surface-raised">
        <BarChart3 className="size-4 text-ink-muted" />
      </div>
      <p className="mt-4 text-[13px] font-medium text-ink">{t(title)}</p>
      <p className="mx-auto mt-1 max-w-sm text-[11px] leading-5 text-ink-muted">{t(description)}</p>
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
  useLanguage();
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
      calendarRef.current?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
        block: "start",
      });
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
    return <LoadingSkeleton sampleEnabled={syntheticEnabled} />;
  }

  if (error) {
    return (
      <NoticeCard
        title={t("Failed to load analytics")}
        description={error}
        action={
          <Button size="sm" variant="outline" onClick={refetch}>{t("Retry")}</Button>
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
      onCustomRangeChange={(value) => {
        setCustomRange(value);
        setCalendarMonth(null);
      }}
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
      <div className="analytics-page space-y-5 min-[900px]:space-y-6">
        {header}
        <NoticeCard
          title={t("No data yet")}
          description={t("Add closed trades to this journal, or explore the board with a realistic sample dataset.")}
          action={
            <div className="flex flex-col items-center gap-2">
              <Button size="sm" onClick={() => onToggleSynthetic(true)} disabled={syntheticBusy}>
                <Sparkles className="size-3.5" />
                {syntheticBusy ? t("Generating...") : t("Use sample data")}
              </Button>
              {syntheticError && <p className="max-w-xs text-[11px] text-loss">{syntheticError}</p>}
            </div>
          }
        />
      </div>
    );
  }

  return (
    <div className="analytics-page space-y-5 min-[900px]:space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3 pb-1">
        <div>
          <h2 className="text-[22px] font-medium leading-8 tracking-tight text-ink">{t("Performance")}</h2>
          <p className="mt-1 text-[13px] leading-5 text-ink-secondary">{t("Returns, risk and the patterns behind your trades.")}</p>
        </div>
      </div>
      {header}
      <TradeDetailPanel
        trade={
          selectedTrade ? { ...selectedTrade.original, _derivedStatus: selectedTrade.status } : null
        }
        open={!!selectedTrade}
        onClose={() => setSelectedTrade(null)}
      />

      {!hasRangeData ? (
        <NoticeCard
          title={t("No trades in this range")}
          description={t("Try a longer date range or clear the active filters.")}
          action={
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  handleRangeChange("ALL");
                  clearFilters();
                }}
              >{t("Reset filters")}</Button>
              {selectedFilterCount > 0 && (
                <Button size="sm" variant="ghost" onClick={clearFilters}>{t("Clear filters")}</Button>
              )}
            </div>
          }
        />
      ) : (
        <>
          <DonutSection analytics={analytics} />

          <KpiRow summary={analytics.summary} unit={analytics.unit} />

          <EquitySection analytics={analytics} />

          <SequenceCards analytics={analytics} onOpenTrade={setSelectedTrade} />

          <BreakdownCard analytics={analytics} filters={filters} onFilter={toggleFilter} />

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
          {monthBounds.minYear !== monthBounds.maxYear && (
            <MonthlyCard analytics={analytics} bounds={monthBounds} onOpenMonth={openMonth} />
          )}
        </>
      )}
    </div>
  );
}
