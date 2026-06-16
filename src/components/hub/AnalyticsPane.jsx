import { useMemo } from "react";

import { useCareerData } from "@/hooks/useCareerData";

import HeatmapGrid from "./HeatmapGrid";
import HubEquityCurve from "./HubEquityCurve";
import ProfitLossDonut from "./ProfitLossDonut";
import RPerTradeChart from "./RPerTradeChart";
import WinLossDonut from "./WinLossDonut";
import YearPerformanceTable from "./YearPerformanceTable";

export default function AnalyticsPane({
  yearEquityCurve,
  yearRPerTrade,
  yearAnalytics,
  yearsLabel,
  selectedYears,
  openMonth,
  onCellClick,
  onYearToggle,
}) {
  const { data: careerData, loading: careerLoading } = useCareerData();

  // Filter career data to match selected years — so table + heatmap narrow when a year is picked
  const displayedYearSummaries = useMemo(() => {
    if (!careerData?.yearSummaries) return [];
    if (selectedYears.length === 0) return careerData.yearSummaries;
    return careerData.yearSummaries.filter((s) => selectedYears.includes(s.year));
  }, [careerData?.yearSummaries, selectedYears]);

  const displayedHeatmap = useMemo(() => {
    if (!careerData?.heatmap) return null;
    if (selectedYears.length === 0) return careerData.heatmap;
    return Object.fromEntries(
      Object.entries(careerData.heatmap).filter(([year]) => selectedYears.includes(Number(year)))
    );
  }, [careerData?.heatmap, selectedYears]);

  const { wins = 0, losses = 0, breakEven = 0 } = yearAnalytics?.winLoss ?? {};
  const { grossProfit = 0, grossLoss = 0, totalR = 0 } = yearAnalytics?.summary ?? {};

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      {/* LEFT: charts only */}
      <div className="flex flex-col gap-5">
        <HubEquityCurve
          data={yearEquityCurve}
          title={`Equity Curve${yearsLabel ? ` — ${yearsLabel}` : ""}`}
          height={240}
        />
        <RPerTradeChart
          data={yearRPerTrade}
          title={`R per Trade${yearsLabel ? ` — ${yearsLabel}` : ""}`}
          height={220}
        />
      </div>

      {/* RIGHT: table → heatmap → donuts stacked */}
      <div className="flex flex-col gap-5">
        <YearPerformanceTable
          data={displayedYearSummaries}
          loading={careerLoading}
          selectedYears={selectedYears}
          onYearClick={onYearToggle}
        />
        <HeatmapGrid
          heatmap={displayedHeatmap}
          loading={careerLoading}
          selectedYears={selectedYears}
          openMonth={openMonth}
          onCellClick={onCellClick}
        />
        <WinLossDonut wins={wins} losses={losses} breakEven={breakEven} />
        <ProfitLossDonut grossProfit={grossProfit} grossLoss={grossLoss} totalR={totalR} />
      </div>
    </div>
  );
}
