import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const COLORS = {
  Wins:        "hsl(142 70% 45%)",
  Losses:      "hsl(0 72% 51%)",
  "Break Even": "hsl(0 0% 45%)",
};

function WLTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs shadow-xl">
      <p className="font-medium">{payload[0].payload.name}</p>
      <p className="text-zinc-400">{payload[0].value} trades</p>
    </div>
  );
}

export default function WinLossDistributionChart({ data, height = 180 }) {
  const { wins = 0, losses = 0, breakEven = 0 } = data ?? {};
  const total = wins + losses + breakEven;

  const chartData = [
    { name: "Wins",        value: wins },
    { name: "Losses",      value: losses },
    { name: "Break Even",  value: breakEven },
  ];

  const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;

  return (
    <Card className="border-zinc-800/60 bg-zinc-900/40">
      <CardHeader className="flex flex-row items-center justify-between px-5 pt-4 pb-3">
        <CardTitle className="text-sm font-medium">Win / Loss</CardTitle>
        {total > 0 && (
          <span className="text-xs font-semibold text-emerald-400">{winRate}% WR</span>
        )}
      </CardHeader>
      <CardContent className="px-5 pb-4">
        {total === 0 ? (
          <div className="flex h-[180px] items-center justify-center text-xs text-zinc-700">
            No closed trades
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <XAxis
                dataKey="name"
                stroke="hsl(0 0% 30%)"
                fontSize={10}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                allowDecimals={false}
                stroke="hsl(0 0% 30%)"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                width={28}
              />
              <Tooltip content={<WLTooltip />} cursor={{ fill: "hsl(0 0% 12%)" }} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={56}>
                {chartData.map((entry) => (
                  <Cell key={entry.name} fill={COLORS[entry.name]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
