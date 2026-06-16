import { Skeleton } from "@/components/ui/skeleton";

const MONTH_LABELS = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];
const MONTH_NAMES  = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function cellStyle(r) {
  if (r === null || r === undefined) {
    return "bg-zinc-800/40 text-zinc-700 cursor-default";
  }
  if (r >= 4)   return "bg-emerald-500    text-emerald-950 font-semibold hover:brightness-110";
  if (r >= 2)   return "bg-emerald-600/80 text-emerald-100 hover:brightness-110";
  if (r > 0)    return "bg-emerald-800/70 text-emerald-300 hover:brightness-110";
  if (r === 0)  return "bg-zinc-700/60    text-zinc-400    hover:brightness-110";
  if (r > -2)   return "bg-red-800/70     text-red-300     hover:brightness-110";
  if (r >= -4)  return "bg-red-600/80     text-red-100     hover:brightness-110";
  return              "bg-red-500         text-red-950 font-semibold hover:brightness-110";
}

function Cell({ year, month, r, isSelected, onClick }) {
  const hasData = r !== null && r !== undefined;
  const isActive = isSelected;

  return (
    <div className="relative group">
      <button
        onClick={() => hasData && onClick(year, month)}
        className={`w-full aspect-square rounded-sm text-[9px] transition-all ${cellStyle(r)} ${
          isActive ? "ring-2 ring-emerald-400 ring-offset-1 ring-offset-zinc-950" : ""
        } ${!hasData ? "cursor-default" : "cursor-pointer"}`}
      />
      {/* Tooltip */}
      <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 z-20 hidden group-hover:block">
        <div className="rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs shadow-xl whitespace-nowrap">
          <span className="text-zinc-400">{MONTH_NAMES[month]} {year}</span>
          {hasData && (
            <span className={`ml-1.5 font-semibold ${r > 0 ? "text-emerald-400" : r < 0 ? "text-red-400" : "text-zinc-400"}`}>
              {r > 0 ? "+" : ""}{r}R
            </span>
          )}
          {!hasData && <span className="ml-1.5 text-zinc-600">—</span>}
        </div>
        <div className="mx-auto mt-0.5 h-1.5 w-1.5 rotate-45 border-b border-r border-zinc-700 bg-zinc-900" />
      </div>
    </div>
  );
}

export default function HeatmapGrid({ heatmap, loading, selectedYears = [], openMonth, onCellClick }) {
  if (loading) {
    return (
      <div className="rounded-lg border border-zinc-800/60 bg-zinc-900/40 p-4">
        <Skeleton className="h-4 w-40 mb-3" />
        <div className="space-y-1.5">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-6 w-full" />)}
        </div>
      </div>
    );
  }

  if (!heatmap) return null;

  const years = Object.keys(heatmap).map(Number).sort((a, b) => b - a);

  if (years.length === 0) {
    return (
      <div className="rounded-lg border border-zinc-800/60 bg-zinc-900/40 overflow-hidden">
        <div className="px-4 py-3 border-b border-zinc-800/60">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Monthly Heatmap (R)</p>
        </div>
        <p className="px-4 py-8 text-center text-xs text-zinc-700">No data for selected period.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-zinc-800/60 bg-zinc-900/40 overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-800/60">
        <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
          Monthly Heatmap (R)
        </p>
      </div>
      <div className="p-3">
        {/* Month header */}
        <div className="grid gap-0.5 mb-1" style={{ gridTemplateColumns: "32px repeat(12, 1fr)" }}>
          <div />
          {MONTH_LABELS.map((m) => (
            <div key={m} className="text-center text-[9px] font-medium text-zinc-600">{m}</div>
          ))}
        </div>

        {/* Year rows */}
        <div className="space-y-0.5">
          {years.map((year) => {
            const isYearActive = selectedYears.length === 0 || selectedYears.includes(year);
            return (
            <div
              key={year}
              className="grid gap-0.5 items-center"
              style={{ gridTemplateColumns: "32px repeat(12, 1fr)" }}
            >
              <span className={`text-[10px] font-medium pr-1 text-right ${isYearActive ? "text-emerald-400" : "text-zinc-600"}`}>
                {year}
              </span>
              {Array.from({ length: 12 }, (_, m) => (
                <Cell
                  key={m}
                  year={year}
                  month={m}
                  r={heatmap[year]?.[m] ?? null}
                  isSelected={openMonth?.year === year && openMonth?.month === m}
                  onClick={onCellClick}
                />
              ))}
            </div>
          );})}
        </div>

        {/* Legend */}
        <div className="mt-3 flex items-center justify-end gap-1.5">
          <span className="text-[9px] text-zinc-600">Loss</span>
          {["bg-red-500/80","bg-red-800/60","bg-zinc-700/50","bg-emerald-800/60","bg-emerald-500/80"].map((cls, i) => (
            <div key={i} className={`h-2.5 w-2.5 rounded-sm ${cls}`} />
          ))}
          <span className="text-[9px] text-zinc-600">Profit</span>
        </div>
      </div>
    </div>
  );
}
