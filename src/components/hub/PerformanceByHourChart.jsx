import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import InfoTip from "@/components/ui/InfoTip";

function formatHour(h) {
  if (h === 0)  return "12am";
  if (h < 12)  return `${h}am`;
  if (h === 12) return "12pm";
  return `${h - 12}pm`;
}

function HourTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const { hour, total_r, trade_count, win_rate } = payload[0].payload;
  const r = total_r;
  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs shadow-xl space-y-0.5">
      <p className="font-medium text-zinc-200">{formatHour(hour)}</p>
      <p className={`font-semibold ${r >= 0 ? "text-emerald-400" : "text-red-400"}`}>
        {r >= 0 ? "+" : ""}{r}R
      </p>
      <p className="text-zinc-500">{trade_count} trade{trade_count !== 1 ? "s" : ""} · {win_rate}% win</p>
    </div>
  );
}

export default function PerformanceByHourChart({ data = [], loading = false }) {
  return (
    <Card className="border-zinc-800/60 bg-zinc-900/40">
      <CardHeader className="px-5 pt-4 pb-3">
        <div className="flex items-center gap-1.5">
          <CardTitle className="text-sm font-medium">Performance by Hour</CardTitle>
          <InfoTip text="Total R grouped by the hour your trade was opened. Identifies your highest and lowest-performing trading sessions." />
        </div>
      </CardHeader>
      <CardContent className="px-5 pb-4">
        {loading || !data.length ? (
          <div className="flex h-[160px] items-center justify-center text-xs text-zinc-700">
            {loading ? "Loading…" : "No data"}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 18%)" vertical={false} />
              <XAxis
                dataKey="hour"
                tickFormatter={formatHour}
                stroke="hsl(0 0% 30%)"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tickFormatter={(v) => `${v}R`}
                stroke="hsl(0 0% 30%)"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                width={38}
              />
              <ReferenceLine y={0} stroke="hsl(0 0% 35%)" strokeDasharray="4 3" />
              <Tooltip
                content={<HourTooltip />}
                isAnimationActive={false}
                cursor={{ fill: "hsl(0 0% 100% / 0.04)" }}
              />
              <Bar dataKey="total_r" radius={[3, 3, 0, 0]} maxBarSize={28} isAnimationActive={false}>
                {data.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry.total_r >= 0 ? "hsl(142 70% 45%)" : "hsl(0 72% 51%)"}
                    fillOpacity={0.85}
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
