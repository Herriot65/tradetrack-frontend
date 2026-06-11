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
import { usePnlBySetup } from "@/hooks/usePnlBySetup";
import { formatR } from "@/lib/formatters";

import ChartCard from "./ChartCard";
import EmptyState from "./EmptyState";
import ErrorMessage from "./ErrorMessage";

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;

  const item = payload[0].payload;
  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs shadow-xl">
      <p className="font-medium">{item.setup}</p>
      <p
        className={
          item.total_r >= 0 ? "text-emerald-400" : "text-rose-400"
        }
      >
        {formatR(item.total_r)}
      </p>
    </div>
  );
}

export default function PnlBySetupChart() {
  const { data, loading, error, refetch } = usePnlBySetup();

  let content;

  if (loading) {
    content = <Skeleton className="h-[260px] w-full rounded-lg" />;
  } else if (error) {
    content = <ErrorMessage message={error} onRetry={refetch} />;
  } else if (!data?.length) {
    content = (
      <EmptyState
        title="No setup data"
        description="Tag trades with setups to compare performance."
      />
    );
  } else {
    const chartHeight = Math.max(260, data.length * 36);

    content = (
      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 8, right: 16, left: 8, bottom: 0 }}
        >
          <XAxis
            type="number"
            tickFormatter={(v) => `${v}R`}
            stroke="hsl(0 0% 40%)"
            fontSize={11}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            type="category"
            dataKey="setup"
            stroke="hsl(0 0% 40%)"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            width={100}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: "hsl(0 0% 14%)" }} />
          <Bar dataKey="total_r" radius={[0, 4, 4, 0]} maxBarSize={20}>
            {data.map((entry) => (
              <Cell
                key={entry.setup}
                fill={
                  entry.total_r >= 0
                    ? "hsl(142 70% 45%)"
                    : "hsl(0 72% 51%)"
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ChartCard
      title="PnL by Setup"
      description="Total R per setup, highest to lowest"
      contentClassName="min-h-[280px] overflow-y-auto"
    >
      {content}
    </ChartCard>
  );
}
