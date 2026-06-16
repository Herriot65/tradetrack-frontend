import { useState } from "react";

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import AnalyticsPane from "@/components/hub/AnalyticsPane";
import HubHeader from "@/components/hub/HubHeader";
import KpiStrip from "@/components/hub/KpiStrip";
import MonthDetailDialog from "@/components/hub/MonthDetailDialog";
import { useHubAnalytics } from "@/hooks/useHubAnalytics";

// Derive a display label from the selected-years array.
function yearsLabel(selectedYears) {
  if (selectedYears.length === 0) return "All";
  if (selectedYears.length === 1) return String(selectedYears[0]);
  const sorted = [...selectedYears].sort((a, b) => a - b);
  return `${sorted[0]} – ${sorted[sorted.length - 1]}`;
}

export default function PerformanceHub() {
  // selectedYears: [] = "All", [2025] = single, [2024, 2025] = multi
  const [selectedYears, setSelectedYears] = useState([]);

  // openMonth: null = dialog closed, { year, month } = dialog open
  const [openMonth, setOpenMonth] = useState(null);

  const { yearAnalytics, monthAnalytics, loading } = useHubAnalytics({
    selectedYears,
    openMonth,
  });

  // Toggle a year — clicking the same year twice deselects it (back to "All" if last one)
  const handleYearToggle = (year) => {
    setSelectedYears((prev) => {
      if (prev.includes(year)) return prev.filter((y) => y !== year);
      return [...prev, year].sort((a, b) => a - b);
    });
  };

  // Clicking a heatmap cell opens the dialog for that specific year+month
  const handleCellClick = (year, month) => {
    setOpenMonth((prev) =>
      prev?.year === year && prev?.month === month ? null : { year, month }
    );
  };

  const label = yearsLabel(selectedYears);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <HubHeader
          selectedYears={selectedYears}
          onYearsChange={setSelectedYears}
        />

        <KpiStrip summary={yearAnalytics?.summary} loading={loading} />

        <AnalyticsPane
          yearEquityCurve={yearAnalytics?.equityCurve ?? []}
          yearRPerTrade={yearAnalytics?.rPerTrade ?? []}
          yearAnalytics={yearAnalytics}
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
    </DashboardLayout>
  );
}
