import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import InfoTip from "@/components/ui/InfoTip";

function AssetTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const r = payload[0].value;
  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs shadow-xl">
      <p className="text-zinc-400">{payload[0].payload.asset}</p>
      <p className={`font-semibold ${r >= 0 ? "text-emerald-400" : "text-red-400"}`}>
        {r >= 0 ? "+" : ""}{r}R
      </p>
    </div>
  );
}

export default function AssetBreakdownChart({ data = [], title = "R by Asset" }) {
  if (!data.length) return null;

  // 32px per bar row, min 120px
  const chartHeight = Math.max(120, data.length * 36);

  return (
    <Card className="border-zinc-800/60 bg-zinc-900/40">
      <CardHeader className="px-5 pt-4 pb-3">
        <div className="flex items-center gap-1.5">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <InfoTip text="Total R grouped by traded instrument. Shows which assets are contributing most to your P&L." />
        </div>
      </CardHeader>
      <CardContent className="px-3 pb-4">
        <ResponsiveContainer width="100%" height={chartHeight}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
          >
            <XAxis
              type="number"
              tickFormatter={(v) => `${v}R`}
              stroke="hsl(0 0% 30%)"
              fontSize={10}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              type="category"
              dataKey="asset"
              stroke="hsl(0 0% 30%)"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              width={62}
            />
            <Tooltip
              content={<AssetTooltip />}
              isAnimationActive={false}
              cursor={{ fill: "hsl(0 0% 100% / 0.04)" }}
            />
            <Bar dataKey="totalR" radius={[0, 3, 3, 0]} isAnimationActive={false}>
              {data.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.totalR >= 0 ? "hsl(142 70% 45%)" : "hsl(0 72% 51%)"}
                  opacity={0.85}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
