import { useMemo, useState } from "react";

import AppShell from "@/components/layout/AppShell";
import AnalyticsPane from "@/components/hub/AnalyticsPane";
import HubHeader from "@/components/hub/HubHeader";
import KpiStrip from "@/components/hub/KpiStrip";
import MonthDetailDialog from "@/components/hub/MonthDetailDialog";
import { useCareerData } from "@/hooks/useCareerData";
import { useHubAnalytics } from "@/hooks/useHubAnalytics";
import { buildMergedSummary } from "@/lib/buildMergedSummary";

function yearsLabel(selectedYears) {
  if (selectedYears.length === 0) return "All";
  if (selectedYears.length === 1) return String(selectedYears[0]);
  const sorted = [...selectedYears].sort((a, b) => a - b);
  return `${sorted[0]} – ${sorted[sorted.length - 1]}`;
}

export default function PerformanceHub() {
  const [selectedYears, setSelectedYears] = useState([]);
  const [openMonth,     setOpenMonth]     = useState(null);

  const { yearAnalytics, monthAnalytics, latestMonthAnalytics, loading, availableYears } = useHubAnalytics({
    selectedYears,
    openMonth,
  });

  const { data: careerData } = useCareerData();

  const mergedSummary = useMemo(
    () => buildMergedSummary(yearAnalytics?.summary, careerData, selectedYears),
    [yearAnalytics?.summary, careerData, selectedYears]
  );

  const handleYearToggle = (year) => {
    setSelectedYears((prev) =>
      prev.includes(year)
        ? prev.filter((y) => y !== year)
        : [...prev, year].sort((a, b) => a - b)
    );
  };

  const handleCellClick = (year, month) => {
    setOpenMonth((prev) =>
      prev?.year === year && prev?.month === month ? null : { year, month }
    );
  };

  const label = yearsLabel(selectedYears);

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Year selector */}
        <HubHeader selectedYears={selectedYears} onYearsChange={setSelectedYears} availableYears={availableYears} />

        {/* Section 1 — KPI strip */}
        <KpiStrip summary={mergedSummary} loading={loading} />

        {/* Sections 2 + 3 */}
        <AnalyticsPane
          yearEquityCurve={yearAnalytics?.equityCurve ?? []}
          yearRPerTrade={yearAnalytics?.rPerTrade ?? []}
          yearAnalytics={yearAnalytics}
          latestMonthAnalytics={latestMonthAnalytics}
          yearsLabel={label}
          selectedYears={selectedYears}
          openMonth={openMonth}
          onCellClick={handleCellClick}
          onYearToggle={handleYearToggle}
        />
      </div>

      <MonthDetailDialog
        open={openMonth !== null}
        onClose={() => setOpenMonth(null)}
        year={openMonth?.year}
        month={openMonth?.month}
        monthAnalytics={monthAnalytics}
        loading={loading}
      />
    </AppShell>
  );
}
