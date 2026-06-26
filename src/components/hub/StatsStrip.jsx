import { TrendingUp, TrendingDown, Flame, AlertTriangle, Activity } from "lucide-react";

import { formatR } from "@/lib/formatters";
import { Skeleton } from "@/components/ui/skeleton";
import InfoTip from "@/components/ui/InfoTip";

const COLOR = {
  emerald: "text-emerald-400",
  red:     "text-red-400",
  zinc:    "text-zinc-300",
};

function StatCell({ icon: Icon, label, value, color = "zinc", loading, info }) {
  return (
    <div className="flex flex-col gap-1.5 px-4 py-3">
      <div className="flex items-center gap-1.5">
        {Icon && <Icon className="size-3 shrink-0 text-zinc-600" />}
        <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
          {label}
        </span>
        <InfoTip text={info} />
      </div>
      {loading ? (
        <Skeleton className="h-5 w-14" />
      ) : (
        <span className={`text-lg font-bold leading-none ${COLOR[color] ?? COLOR.zinc}`}>
          {value ?? "—"}
        </span>
      )}
    </div>
  );
}

export default function StatsStrip({ summary, loading }) {
  const s = summary;

  const expectancy           = s?.expectancy           ?? null;
  const avgConsecutiveWins   = s?.avgConsecutiveWins   ?? null;
  const avgConsecutiveLosses = s?.avgConsecutiveLosses ?? null;
  const avgWinR              = s?.avgWinR              ?? null;
  const avgLossR             = s?.avgLossR             ?? null;

  // Hide entirely if the backend hasn't provided any secondary fields yet
  // (e.g. when a year filter is active and backend-only fields aren't available).
  if (!loading && [expectancy, avgConsecutiveWins, avgConsecutiveLosses, avgWinR, avgLossR].every(v => v === null)) {
    return null;
  }

  const stats = [
    {
      icon:  Activity,
      label: "Expectancy",
      value: expectancy != null ? formatR(expectancy) : null,
      color: expectancy == null ? "zinc" : expectancy >= 0 ? "emerald" : "red",
      info:  "Average R you can expect per trade: (Win Rate × Avg Win R) + (Loss Rate × Avg Loss R). Positive = edge.",
    },
    {
      icon:  TrendingUp,
      label: "Avg Win R",
      value: avgWinR != null ? formatR(avgWinR) : null,
      color: (avgWinR ?? 0) >= 0 ? "emerald" : "red",
      info:  "Average R-multiple on trades that closed as wins.",
    },
    {
      icon:  TrendingDown,
      label: "Avg Loss R",
      value: avgLossR != null ? formatR(avgLossR) : null,
      color: "red",
      info:  "Average R-multiple on trades that closed as losses (always negative).",
    },
    {
      icon:  Flame,
      label: "Avg Win Streak",
      value: avgConsecutiveWins != null ? Number(avgConsecutiveWins).toFixed(1) : null,
      color: "emerald",
      info:  "Average length of consecutive winning sequences across the journal.",
    },
    {
      icon:  AlertTriangle,
      label: "Avg Loss Streak",
      value: avgConsecutiveLosses != null ? Number(avgConsecutiveLosses).toFixed(1) : null,
      color: (avgConsecutiveLosses ?? 0) > 2 ? "red" : "zinc",
      info:  "Average length of consecutive losing sequences. Helps estimate drawdown frequency.",
    },
  ];

  return (
    <div className="grid grid-cols-2 divide-x-0 divide-y divide-zinc-800/60 rounded-lg border border-zinc-800/60 bg-zinc-900/20 sm:grid-cols-3 sm:divide-y-0 sm:divide-x lg:grid-cols-5">
      {stats.map((stat, i) => (
        <div
          key={stat.label}
          className={[
            i > 0 && i % 2 === 0 ? "sm:border-t-0" : "",
            "border-zinc-800/60",
            i > 0 ? "border-t sm:border-t-0 sm:border-l" : "",
          ].join(" ")}
        >
          <StatCell {...stat} loading={loading} />
        </div>
      ))}
    </div>
  );
}
