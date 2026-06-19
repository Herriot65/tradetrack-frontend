import { useState } from "react";

import AppShell from "@/components/layout/AppShell";
import AnalyticsPane from "@/components/hub/AnalyticsPane";
import HubHeader from "@/components/hub/HubHeader";
import KpiStrip from "@/components/hub/KpiStrip";
import MonthDetailDialog from "@/components/hub/MonthDetailDialog";
import { useHubAnalytics } from "@/hooks/useHubAnalytics";

function yearsLabel(selectedYears) {
  if (selectedYears.length === 0) return "All";
  if (selectedYears.length === 1) return String(selectedYears[0]);
  const sorted = [...selectedYears].sort((a, b) => a - b);
  return `${sorted[0]} – ${sorted[sorted.length - 1]}`;
}

export default function PerformanceHub() {
  const [selectedYears, setSelectedYears] = useState([]);
  const [openMonth,     setOpenMonth]     = useState(null);

  const { yearAnalytics, monthAnalytics, latestMonthAnalytics, loading } = useHubAnalytics({
    selectedYears,
    openMonth,
  });

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
        <HubHeader selectedYears={selectedYears} onYearsChange={setSelectedYears} />

        {/* Section 1 — KPI strip */}
        <KpiStrip summary={yearAnalytics?.summary} loading={loading} />

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
