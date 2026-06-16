import {
  Bar,
  BarChart,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/formatters";

function PnlTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const { date, r } = payload[0].payload;
  const sign = r > 0 ? "+" : "";
  const color = r > 0 ? "hsl(142 70% 45%)" : r < 0 ? "hsl(0 72% 51%)" : "hsl(0 0% 45%)";
  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs shadow-xl space-y-0.5">
      <p className="text-zinc-400">{formatDate(date)}</p>
      <p style={{ color }} className="font-semibold">{sign}{r}R</p>
    </div>
  );
}

export default function PnlByDayChart({ data = [], height = 180 }) {
  const maxAbs = Math.max(...data.map((d) => Math.abs(d.r)), 1);
  const domain = [-(maxAbs + 0.5), maxAbs + 0.5];

  return (
    <Card className="border-zinc-800/60 bg-zinc-900/40">
      <CardHeader className="px-5 pt-4 pb-3">
        <CardTitle className="text-sm font-medium">P&amp;L by Day</CardTitle>
      </CardHeader>
      <CardContent className="px-5 pb-4">
        {!data.length ? (
          <div className="flex h-[180px] items-center justify-center text-xs text-zinc-700">
            No data
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <XAxis
                dataKey="date"
                tickFormatter={(v) => {
                  try { return new Date(v).toLocaleDateString(undefined, { day: "numeric", month: "short" }); }
                  catch { return v; }
                }}
                stroke="hsl(0 0% 30%)"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={domain}
                tickFormatter={(v) => `${v}R`}
                stroke="hsl(0 0% 30%)"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                width={38}
              />
              <ReferenceLine y={0} stroke="hsl(0 0% 40%)" strokeWidth={1.5} />
              <Tooltip content={<PnlTooltip />} cursor={{ fill: "hsl(0 0% 12%)" }} />
              <Bar dataKey="r" radius={[3, 3, 0, 0]} maxBarSize={40}>
                {data.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={
                      entry.r > 0
                        ? "hsl(142 70% 45%)"
                        : entry.r < 0
                        ? "hsl(0 72% 51%)"
                        : "hsl(0 0% 45%)"
                    }
                    fillOpacity={0.9}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
