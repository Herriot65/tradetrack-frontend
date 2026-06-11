import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Skeleton } from "@/components/ui/skeleton";
import { useWinLossDistribution } from "@/hooks/useWinLossDistribution";

import ChartCard from "./ChartCard";
import EmptyState from "./EmptyState";
import ErrorMessage from "./ErrorMessage";

const COLORS = {
  Wins: "hsl(142 70% 45%)",
  Losses: "hsl(0 72% 51%)",
  "Break even": "hsl(0 0% 45%)",
};

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs shadow-xl">
      <p className="font-medium">{payload[0].payload.name}</p>
      <p className="text-muted-foreground">{payload[0].value} trades</p>
    </div>
  );
}

export default function WinLossChart() {
  const { data, loading, error, refetch } = useWinLossDistribution();

  let content;

  if (loading) {
    content = <Skeleton className="h-[260px] w-full rounded-lg" />;
  } else if (error) {
    content = <ErrorMessage message={error} onRetry={refetch} />;
  } else {
    const chartData = [
      { name: "Wins", value: data?.wins ?? 0 },
      { name: "Losses", value: data?.losses ?? 0 },
      { name: "Break even", value: data?.break_even ?? 0 },
    ];

    const total = chartData.reduce((sum, item) => sum + item.value, 0);

    if (total === 0) {
      content = (
        <EmptyState
          title="No closed trades"
          description="Win/loss distribution appears once you have completed trades."
        />
      );
    } else {
      content = (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <XAxis
              dataKey="name"
              stroke="hsl(0 0% 40%)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              allowDecimals={false}
              stroke="hsl(0 0% 40%)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              width={32}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: "hsl(0 0% 14%)" }} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={64}>
              {chartData.map((entry) => (
                <Cell key={entry.name} fill={COLORS[entry.name]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      );
    }
  }

  return (
    <ChartCard
      title="Win / Loss Distribution"
      description="Breakdown of closed trades"
    >
      {content}
    </ChartCard>
  );
}
