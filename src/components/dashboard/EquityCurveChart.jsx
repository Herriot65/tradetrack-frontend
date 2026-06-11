import { useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useEquityCurve } from "@/hooks/useEquityCurve";
import { formatDate, formatR } from "@/lib/formatters";

import ChartCard from "./ChartCard";
import EmptyState from "./EmptyState";
import ErrorMessage from "./ErrorMessage";

const PERIODS = [
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs shadow-xl">
      <p className="text-muted-foreground">{formatDate(label)}</p>
      <p className="font-medium text-emerald-400">
        {formatR(payload[0].value)}
      </p>
    </div>
  );
}

export default function EquityCurveChart() {
  const [period, setPeriod] = useState("weekly");
  const { data, loading, error, refetch } = useEquityCurve(period);

  const periodToggle = (
    <div className="flex gap-1">
      {PERIODS.map((p) => (
        <Button
          key={p.value}
          variant={period === p.value ? "default" : "outline"}
          size="xs"
          onClick={() => setPeriod(p.value)}
        >
          {p.label}
        </Button>
      ))}
    </div>
  );

  let content;

  if (loading) {
    content = <Skeleton className="h-[260px] w-full rounded-lg" />;
  } else if (error) {
    content = <ErrorMessage message={error} onRetry={refetch} />;
  } else if (!data?.length) {
    content = (
      <EmptyState
        title="No equity data yet"
        description="Close some trades to see your cumulative R curve."
      />
    );
  } else {
    content = (
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="hsl(0 0% 20%)"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tickFormatter={(v) => formatDate(v)}
            stroke="hsl(0 0% 40%)"
            fontSize={11}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tickFormatter={(v) => `${v}R`}
            stroke="hsl(0 0% 40%)"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            width={48}
          />
          <Tooltip content={<ChartTooltip />} />
          <Line
            type="monotone"
            dataKey="equity_r"
            stroke="hsl(142 70% 45%)"
            strokeWidth={2}
            dot={{ r: 3, fill: "hsl(142 70% 45%)" }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ChartCard
      title="Equity Curve"
      description="Cumulative R over time"
      action={periodToggle}
    >
      {content}
    </ChartCard>
  );
}
