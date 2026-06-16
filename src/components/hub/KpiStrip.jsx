import {
  BarChart2,
  DollarSign,
  Hash,
  Target,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import { formatR, formatPercent } from "@/lib/formatters";

import KpiCard from "./KpiCard";

export default function KpiStrip({ summary, loading }) {
  const kpis = [
    { id: "pnl",           label: "Total R",       icon: DollarSign,  value: formatR(summary?.totalR)            },
    { id: "win-rate",      label: "Win Rate",       icon: Target,      value: formatPercent(summary?.winRate)     },
    { id: "trades",        label: "Total Trades",   icon: Hash,        value: summary?.totalTrades ?? null        },
    { id: "avg-r",         label: "Avg R",          icon: TrendingUp,  value: formatR(summary?.avgR)              },
    { id: "drawdown",      label: "Max Drawdown",   icon: TrendingDown,value: formatR(summary?.maxDrawdownR != null ? -summary.maxDrawdownR : null) },
    { id: "profit-factor", label: "Profit Factor",  icon: BarChart2,   value: summary?.profitFactor ?? null       },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {kpis.map((item) => (
        <KpiCard
          key={item.id}
          label={item.label}
          icon={item.icon}
          value={item.value}
          loading={loading}
        />
      ))}
    </div>
  );
}
