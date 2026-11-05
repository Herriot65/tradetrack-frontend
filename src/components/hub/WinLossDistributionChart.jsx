import { translate as t } from "@/i18n/language";
import { useLanguage } from "@/i18n/useLanguage";
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
  Wins:        "var(--gain)",
  Losses:      "var(--loss)",
  "Break Even": "var(--chart-neutral)",
};

function WLTooltip({ active, payload }) {
  useLanguage();
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs shadow-xl">
      <p className="font-medium">{payload[0].payload.name}</p>
      <p className="text-zinc-400">{payload[0].value}{" " + t("trades")}</p>
    </div>
  );
}

export default function WinLossDistributionChart({ data, height = 180 }) {
  useLanguage();
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
        <CardTitle className="text-sm font-medium">{t("Win / Loss")}</CardTitle>
        {total > 0 && (
          <span className="text-xs font-semibold text-emerald-400">{winRate}{t("% WR")}</span>
        )}
      </CardHeader>
      <CardContent className="px-5 pb-4">
        {total === 0 ? (
          <div className="flex h-[180px] items-center justify-center text-xs text-zinc-700">{t("No closed trades")}</div>
        ) : (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <XAxis
                dataKey="name"
                stroke="var(--text-tertiary)"
                fontSize={10}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                allowDecimals={false}
                stroke="var(--text-tertiary)"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                width={28}
              />
              <Tooltip content={<WLTooltip />} cursor={{ fill: "var(--chart-grid)" }} />
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
