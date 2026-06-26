import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import InfoTip from "@/components/ui/InfoTip";

// Backend returns full day name ("Monday"); shorten it for the axis.
const SHORT_DAY = { Monday: "Mon", Tuesday: "Tue", Wednesday: "Wed", Thursday: "Thu", Friday: "Fri", Saturday: "Sat", Sunday: "Sun" };

function DayTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const { day, trade_count, win_rate, total_r } = payload[0].payload;
  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs shadow-xl space-y-0.5">
      <p className="font-medium text-zinc-200">{day}</p>
      <p className={`font-semibold ${total_r >= 0 ? "text-emerald-400" : "text-red-400"}`}>
        {total_r >= 0 ? "+" : ""}{total_r}R
      </p>
      <p className="text-zinc-500">{trade_count} trade{trade_count !== 1 ? "s" : ""} · {win_rate}% win</p>
    </div>
  );
}

export default function PerformanceByDayChart({ data = [], loading = false }) {
  return (
    <Card className="border-zinc-800/60 bg-zinc-900/40">
      <CardHeader className="px-5 pt-4 pb-3">
        <div className="flex items-center gap-1.5">
          <CardTitle className="text-sm font-medium">Performance by Day</CardTitle>
          <InfoTip text="Total R grouped by day of the week. Reveals which days of the week you trade best (or worst)." />
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
                dataKey="day"
                tickFormatter={(v) => SHORT_DAY[v] ?? v.slice(0, 3)}
                stroke="hsl(0 0% 30%)"
                fontSize={10}
                tickLine={false}
                axisLine={false}
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
                content={<DayTooltip />}
                isAnimationActive={false}
                cursor={{ fill: "hsl(0 0% 100% / 0.04)" }}
              />
              <Bar dataKey="total_r" radius={[3, 3, 0, 0]} maxBarSize={40} isAnimationActive={false}>
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
