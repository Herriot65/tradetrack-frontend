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
    },
    {
      id:    "win-rate",
      label: "Win Rate",
      icon:  Target,
      value: formatPercent(summary?.winRate),
      color: !summary ? "zinc" : winRate >= 50 ? "emerald" : "red",
    },
    {
      id:    "trades",
      label: "Total Trades",
      icon:  Hash,
      value: summary?.totalTrades ?? null,
      color: "zinc",
    },
    {
      id:    "avg-r",
      label: "Avg R",
      icon:  TrendingUp,
      value: formatR(summary?.avgR),
      color: !summary ? "zinc" : avgR >= 0 ? "emerald" : "red",
    },
    {
      id:    "drawdown",
      label: "Max Drawdown",
      icon:  TrendingDown,
      value: formatR(summary?.maxDrawdownR != null ? -summary.maxDrawdownR : null),
      color: "red",
    },
    {
      id:    "profit-factor",
      label: "Profit Factor",
      icon:  BarChart2,
      value: summary?.profitFactor ?? null,
      color: !summary ? "zinc" : profitFactor >= 1 ? "emerald" : "red",
    },
    {
      id:    "win-streak",
      label: "Max Win Streak",
      icon:  Zap,
      value: summary?.maxWinStreak ?? null,
      color: "emerald",
    },
    {
      id:    "loss-streak",
      label: "Max Loss Streak",
      icon:  ZapOff,
      value: summary?.maxLossStreak ?? null,
      color: "red",
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
        />
      ))}
    </div>
  );
}
