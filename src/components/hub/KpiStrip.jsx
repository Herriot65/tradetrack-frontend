import {
  BarChart2,
  DollarSign,
  Hash,
  Target,
  TrendingDown,
  TrendingUp,
  Zap,
  ZapOff,
} from "lucide-react";

import { formatR, formatPercent } from "@/lib/formatters";

import KpiCard from "./KpiCard";

export default function KpiStrip({ summary, loading }) {
  const totalR       = summary?.totalR       ?? 0;
  const winRate      = summary?.winRate      ?? 0;
  const avgR         = summary?.avgR         ?? 0;
  const profitFactor = summary?.profitFactor ?? 0;

  const kpis = [
    {
      id:    "pnl",
      label: "Total R",
      icon:  DollarSign,
      value: formatR(summary?.totalR),
      color: !summary ? "zinc" : totalR >= 0 ? "emerald" : "red",
      info:  "Net R-multiple across all closed trades. Each unit of R equals your initial risk per trade.",
    },
    {
      id:    "win-rate",
      label: "Win Rate",
      icon:  Target,
      value: formatPercent(summary?.winRate),
      color: !summary ? "zinc" : winRate >= 50 ? "emerald" : "red",
      info:  "Percentage of closed trades that closed in profit.",
    },
    {
      id:    "trades",
      label: "Total Trades",
      icon:  Hash,
      value: summary?.totalTrades ?? null,
      color: "zinc",
      info:  "Total number of trades recorded in this journal.",
    },
    {
      id:    "avg-r",
      label: "Avg R",
      icon:  TrendingUp,
      value: formatR(summary?.avgR),
      color: !summary ? "zinc" : avgR >= 0 ? "emerald" : "red",
      info:  "Average R-multiple per closed trade (Total R ÷ closed trades).",
    },
    {
      id:    "drawdown",
      label: "Max Drawdown",
      icon:  TrendingDown,
      value: formatR(summary?.maxDrawdownR != null ? -summary.maxDrawdownR : null),
      color: "red",
      info:  "Deepest peak-to-trough decline in cumulative R. Measures worst-case loss from an equity high.",
    },
    {
      id:    "profit-factor",
      label: "Profit Factor",
      icon:  BarChart2,
      value: summary?.profitFactor ?? null,
      color: !summary ? "zinc" : profitFactor >= 1 ? "emerald" : "red",
      info:  "Gross profit divided by gross loss. Above 1 means the system is net profitable.",
    },
    {
      id:    "win-streak",
      label: "Max Win Streak",
      icon:  Zap,
      value: summary?.maxWinStreak ?? null,
      color: (summary?.maxWinStreak ?? 0) > 0 ? "emerald" : "zinc",
      info:  "Longest consecutive run of winning trades.",
    },
    {
      id:    "loss-streak",
      label: "Max Loss Streak",
      icon:  ZapOff,
      value: summary?.maxLossStreak ?? null,
      color: (summary?.maxLossStreak ?? 0) > 0 ? "red" : "emerald",
      info:  "Longest consecutive run of losing trades. A key measure of psychological pressure.",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-8">
      {kpis.map((item) => (
        <KpiCard
          key={item.id}
          label={item.label}
          icon={item.icon}
          value={item.value}
          loading={loading}
          color={item.color}
          info={item.info}
        />
      ))}
    </div>
  );
}
