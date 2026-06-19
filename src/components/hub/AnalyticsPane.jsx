import { useMemo } from "react";

import { useCareerData } from "@/hooks/useCareerData";

import AssetBreakdownChart from "./AssetBreakdownChart";
import DrawdownChart from "./DrawdownChart";
import HeatmapGrid from "./HeatmapGrid";
import HubEquityCurve from "./HubEquityCurve";
import PerformanceCalendar from "./PerformanceCalendar";
import ProfitLossDonut from "./ProfitLossDonut";
import RPerTradeChart from "./RPerTradeChart";
import WinLossDonut from "./WinLossDonut";

export default function AnalyticsPane({
  yearEquityCurve,
  yearRPerTrade,
  yearAnalytics,
  latestMonthAnalytics,
  yearsLabel,
  selectedYears,
  openMonth,
  onCellClick,
}) {
  const { data: careerData, loading: careerLoading } = useCareerData();

  const displayedHeatmap = useMemo(() => {
    if (!careerData?.heatmap) return null;
    if (selectedYears.length === 0) return careerData.heatmap;
    return Object.fromEntries(
      Object.entries(careerData.heatmap).filter(([year]) =>
        selectedYears.includes(Number(year))
      )
    );
  }, [careerData?.heatmap, selectedYears]);

  const { wins = 0, losses = 0, breakEven = 0 } = yearAnalytics?.winLoss ?? {};
  const { grossProfit = 0, grossLoss = 0, totalR = 0 } = yearAnalytics?.summary ?? {};

  const titleSuffix = yearsLabel ? ` — ${yearsLabel}` : "";

  return (
    <div className="space-y-6">

      {/* ── Section 2: Core Performance ── */}
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">

        {/* Left column: time-series charts */}
        <div className="flex flex-col gap-5">
          <HubEquityCurve
            data={yearEquityCurve}
            title={`Equity Curve${titleSuffix}`}
            height={240}
          />
          <DrawdownChart
            data={yearAnalytics?.drawdownCurve ?? []}
            title={`Drawdown${titleSuffix}`}
            height={160}
          />
          <RPerTradeChart
            data={yearRPerTrade}
            title={`R per Trade${titleSuffix}`}
            height={200}
          />
        </div>

        {/* Right column: donuts + latest-month calendar */}
        <div className="flex flex-col gap-5">
          <WinLossDonut wins={wins} losses={losses} breakEven={breakEven} />
          <ProfitLossDonut grossProfit={grossProfit} grossLoss={grossLoss} totalR={totalR} />
          {latestMonthAnalytics && (
            <PerformanceCalendar
              year={latestMonthAnalytics.year}
              month={latestMonthAnalytics.month}
              calendarData={latestMonthAnalytics.calendarData}
            />
          )}
        </div>
      </div>

      {/* ── Section 3: Breakdowns ── */}
      <div className="grid gap-6 lg:grid-cols-2">
        <AssetBreakdownChart
          data={yearAnalytics?.pnlByAsset ?? []}
          title={`R by Asset${titleSuffix}`}
        />
        <HeatmapGrid
          heatmap={displayedHeatmap}
          loading={careerLoading}
          selectedYears={selectedYears}
          openMonth={openMonth}
          onCellClick={onCellClick}
        />
      </div>

    </div>
  );
}
