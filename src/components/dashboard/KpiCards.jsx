import {
  Activity,
  BarChart3,
  Percent,
  Scale,
  Target,
  TrendingDown,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardSummary } from "@/hooks/useDashboardSummary";
import { formatNumber, formatPercent, formatR } from "@/lib/formatters";
import { cn } from "@/lib/utils";

import ErrorMessage from "./ErrorMessage";

const KPI_CONFIG = [
  {
    key: "total_trades",
    label: "Total Trades",
    icon: BarChart3,
    format: (v) => String(v ?? 0),
  },
  {
    key: "win_rate",
    label: "Win Rate",
    icon: Percent,
    format: formatPercent,
  },
  {
    key: "total_r",
    label: "Total R",
    icon: Activity,
    format: formatR,
    valueClass: (v) =>
      Number(v) > 0
        ? "text-emerald-400"
        : Number(v) < 0
          ? "text-rose-400"
          : "",
  },
  {
    key: "profit_factor",
    label: "Profit Factor",
    icon: Scale,
    format: (v) => (v === null ? "—" : formatNumber(v)),
  },
  {
    key: "max_drawdown_r",
    label: "Max Drawdown",
    icon: TrendingDown,
    format: formatR,
    valueClass: () => "text-rose-400",
  },
  {
    key: "average_r",
    label: "Average R",
    icon: Target,
    format: formatR,
    valueClass: (v) =>
      Number(v) > 0
        ? "text-emerald-400"
        : Number(v) < 0
          ? "text-rose-400"
          : "",
  },
];

function KpiSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {KPI_CONFIG.map((kpi) => (
        <Card
          key={kpi.key}
          className="border-zinc-800/60 bg-zinc-950/50 ring-zinc-800/40"
        >
          <CardHeader className="pb-2">
            <Skeleton className="h-4 w-24" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-16" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function KpiCards() {
  const { data, loading, error, refetch } = useDashboardSummary();

  if (loading) return <KpiSkeleton />;

  if (error) {
    return <ErrorMessage message={error} onRetry={refetch} />;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {KPI_CONFIG.map(({ key, label, icon: Icon, format, valueClass }) => {
        const value = data?.[key];
        return (
          <Card
            key={key}
            className="border-zinc-800/60 bg-zinc-950/50 ring-zinc-800/40"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                {label}
              </CardTitle>
              <Icon className="size-4 text-muted-foreground/60" />
            </CardHeader>
            <CardContent>
              <p
                className={cn(
                  "text-2xl font-semibold tracking-tight",
                  valueClass?.(value)
                )}
              >
                {format(value)}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
