import { BarChart3, MousePointerClick } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPercent, formatR } from "@/lib/formatters";

import HubEquityCurve from "./HubEquityCurve";
import ProfitLossDonut from "./ProfitLossDonut";
import RPerTradeChart from "./RPerTradeChart";
import WinLossDonut from "./WinLossDonut";

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <div className="flex size-12 items-center justify-center rounded-xl bg-zinc-900 ring-1 ring-zinc-800">
        <MousePointerClick className="size-5 text-zinc-600" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-zinc-500">No month selected</p>
        <p className="text-xs text-zinc-700">
          Click any cell in the heatmap or any month above to drill into its performance.
        </p>
      </div>
    </div>
  );
}

function StatRow({ label, value, valueClass = "text-zinc-200" }) {
  return (
    <div className="flex items-baseline justify-between gap-2 py-1.5 border-b border-zinc-800/50 last:border-0">
      <span className="text-xs text-zinc-500">{label}</span>
      <span className={`text-xs font-semibold tabular-nums ${valueClass}`}>{value}</span>
    </div>
  );
}

function MonthStatsBlock({ summary, monthName, year }) {
  const { totalTrades, wins, losses, breakEven, avgR, maxDrawdownR, totalR } = summary;

  const avgWinR = wins > 0
    ? formatR(Math.round((summary.grossProfit / wins) * 100) / 100)
    : "—";
  const avgLossR = losses > 0
    ? formatR(-Math.round((summary.grossLoss / losses) * 100) / 100)
    : "—";

  return (
    <div className="flex flex-col gap-4">
      {/* Month heading */}
      <div>
        <p className="text-xs text-zinc-600 uppercase tracking-widest">{year}</p>
        <h2 className="text-2xl font-bold tracking-tight text-zinc-100">{monthName}</h2>
      </div>

      {/* Stats */}
      <div className="rounded-lg border border-zinc-800/60 bg-zinc-900/60 px-4 py-1">
        <StatRow label="Total Trades"   value={totalTrades} />
        <StatRow label="Wins"           value={wins}     valueClass="text-emerald-400" />
        <StatRow label="Losses"         value={losses}   valueClass="text-red-400" />
        {breakEven > 0 && <StatRow label="Break Even" value={breakEven} valueClass="text-zinc-400" />}
        <StatRow label="Avg Win (R)"    value={avgWinR}  valueClass="text-emerald-400" />
        <StatRow label="Avg Loss (R)"   value={avgLossR} valueClass="text-red-400" />
        <StatRow
          label="Max Drawdown"
          value={formatR(-maxDrawdownR)}
          valueClass="text-red-400"
        />
        <StatRow
          label="Net R"
          value={formatR(totalR)}
          valueClass={totalR >= 0 ? "text-emerald-400" : "text-red-400"}
        />
      </div>

      {/* Donut charts */}
      <div className="grid grid-cols-2 gap-4">
        <WinLossDonut wins={wins} losses={losses} breakEven={breakEven} />
        <ProfitLossDonut
          grossProfit={summary.grossProfit}
          grossLoss={summary.grossLoss}
          totalR={totalR}
        />
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
      <div className="flex flex-col gap-4">
        <Skeleton className="h-52 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-52 rounded-xl" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-36 rounded-xl" />
          <Skeleton className="h-36 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export default function DrillDownPane({ selectedMonth, selectedYear, monthAnalytics, loading }) {
  const monthName = selectedMonth != null ? MONTHS[selectedMonth] : null;

  return (
    <Card className="border-zinc-800/60 bg-zinc-900/40">
      <CardHeader className="flex flex-row items-center justify-between border-b border-zinc-800/60 px-6 pb-4 pt-5">
        <div className="flex items-center gap-2">
          <BarChart3 className="size-4 text-zinc-600" />
          <CardTitle className="text-sm font-medium">
            {monthName ? `${monthName} ${selectedYear}` : "Month Details"}
          </CardTitle>
        </div>
        {monthName && (
          <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400 ring-1 ring-emerald-500/20">
            {monthName}
          </span>
        )}
      </CardHeader>

      <CardContent className="px-6 pb-6">
        {!monthName ? (
          <EmptyState />
        ) : loading ? (
          <LoadingSkeleton />
        ) : !monthAnalytics ? null : (
          <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_268px]">
            {/* LEFT: charts */}
            <div className="flex flex-col gap-4">
              <HubEquityCurve
                data={monthAnalytics.equityCurve}
                title={`Equity — ${monthName}`}
                height={200}
              />
              <RPerTradeChart
                data={monthAnalytics.rPerTrade}
                title={`R per Trade — ${monthName}`}
                height={188}
              />
            </div>

            {/* RIGHT: stats + donuts */}
            <MonthStatsBlock
              summary={monthAnalytics.summary}
              monthName={monthName}
              year={selectedYear}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
