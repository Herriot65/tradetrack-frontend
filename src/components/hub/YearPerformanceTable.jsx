import { Skeleton } from "@/components/ui/skeleton";
import { formatPercent, formatR } from "@/lib/formatters";

function Row({ summary, isSelected, isAll, onClick }) {
  // When "All" is active, every row is softly highlighted
  const highlighted = isAll || isSelected;
  const { year, trades, winRate, profitFactor, totalR } = summary;
  const rPositive = totalR > 0;

  return (
    <tr
      onClick={onClick}
      className={`cursor-pointer border-b border-zinc-800/60 text-xs transition-colors hover:bg-zinc-800/40 ${
        isSelected ? "bg-zinc-800/60" : ""
      }`}
    >
      <td className={`py-2 pl-4 pr-3 font-semibold ${highlighted ? "text-emerald-400" : "text-zinc-400"}`}>
        {year}
      </td>
      <td className="px-3 py-2 text-right text-zinc-400">{trades}</td>
      <td className="px-3 py-2 text-right text-zinc-400">{formatPercent(winRate)}</td>
      <td className="px-3 py-2 text-right text-zinc-400">{profitFactor}</td>
      <td className={`py-2 pl-3 pr-4 text-right font-semibold ${rPositive ? "text-emerald-400" : "text-red-400"}`}>
        {formatR(totalR)}
      </td>
    </tr>
  );
}

export default function YearPerformanceTable({ data, loading, selectedYears = [], onYearClick }) {
  const isAll = selectedYears.length === 0;
  return (
    <div className="rounded-lg border border-zinc-800/60 bg-zinc-900/40 overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-800/60">
        <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
          Annual Performance
        </p>
      </div>

      {loading ? (
        <div className="space-y-2 p-4">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-7 w-full" />)}
        </div>
      ) : !data?.length ? (
        <p className="px-4 py-6 text-center text-xs text-zinc-700">No data</p>
      ) : (
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-800/60 text-left">
              <th className="py-2 pl-4 pr-3 text-xs font-medium text-zinc-600">Year</th>
              <th className="px-3 py-2 text-right text-xs font-medium text-zinc-600">Trades</th>
              <th className="px-3 py-2 text-right text-xs font-medium text-zinc-600">WR</th>
              <th className="px-3 py-2 text-right text-xs font-medium text-zinc-600">PF</th>
              <th className="py-2 pl-3 pr-4 text-right text-xs font-medium text-zinc-600">Net R</th>
            </tr>
          </thead>
          <tbody>
            {data.map((s) => (
              <Row
                key={s.year}
                summary={s}
                isAll={isAll}
                isSelected={selectedYears.includes(s.year)}
                onClick={() => onYearClick?.(s.year)}
              />
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
