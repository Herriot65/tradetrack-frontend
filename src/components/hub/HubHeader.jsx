import { Filter, Share2 } from "lucide-react";

const YEARS = [2022, 2023, 2024, 2025, 2026];

export default function HubHeader({ selectedYears, onYearsChange }) {
  const isAll = selectedYears.length === 0;

  const toggleYear = (year) => {
    if (selectedYears.includes(year)) {
      // Deselect — if this was the last one, go back to "All"
      onYearsChange(selectedYears.filter((y) => y !== year));
    } else {
      onYearsChange([...selectedYears, year].sort((a, b) => a - b));
    }
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      {/* Title block */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Performance Hub</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Drill down from career overview to individual trades — all in one place.
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-col items-start gap-2 sm:items-end">
        {/* Year selector — multi-select */}
        <div className="flex items-center gap-1">
          {/* All button */}
          <button
            onClick={() => onYearsChange([])}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              isAll
                ? "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30"
                : "text-zinc-500 hover:bg-zinc-800/80 hover:text-zinc-300"
            }`}
          >
            All
          </button>

          <span className="mx-0.5 h-4 w-px bg-zinc-800" />

          {YEARS.map((year) => {
            const active = selectedYears.includes(year);
            return (
              <button
                key={year}
                onClick={() => toggleYear(year)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  active
                    ? "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30"
                    : "text-zinc-500 hover:bg-zinc-800/80 hover:text-zinc-300"
                }`}
              >
                {year}
              </button>
            );
          })}
        </div>

        {/* Multi-select hint */}
        {!isAll && selectedYears.length > 0 && (
          <p className="text-[10px] text-zinc-600">
            {selectedYears.length} year{selectedYears.length > 1 ? "s" : ""} selected — click to toggle
          </p>
        )}

        {/* Action placeholders */}
        <div className="flex items-center gap-2">
          <button
            disabled
            className="flex h-7 items-center gap-1.5 rounded-md border border-dashed border-zinc-800 bg-zinc-900/40 px-3 text-xs text-zinc-700 cursor-not-allowed"
          >
            <Filter className="size-3" />
            Filter
          </button>
          <button
            disabled
            className="flex h-7 items-center gap-1.5 rounded-md border border-dashed border-zinc-800 bg-zinc-900/40 px-3 text-xs text-zinc-700 cursor-not-allowed"
          >
            <Share2 className="size-3" />
            Export
          </button>
        </div>
      </div>
    </div>
  );
}
