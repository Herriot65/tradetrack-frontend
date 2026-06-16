import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/formatters";

function DdTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const r = payload[0].value;
  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs shadow-xl space-y-0.5">
      <p className="text-zinc-400">{formatDate(label)}</p>
      <p className="font-semibold text-red-400">{r}R</p>
    </div>
  );
}

function computeXAxis(data) {
  if (!data.length) return { ticks: [], formatter: () => "" };
  const yearMap  = new Map();
  const monthMap = new Map();
  data.forEach((d) => {
    const dt    = new Date(d.date);
    const year  = dt.getFullYear();
    const month = dt.getMonth();
    if (!yearMap.has(year))   yearMap.set(year, d.date);
    if (!monthMap.has(month)) monthMap.set(month, d.date);
  });
  const isMultiYear = yearMap.size > 1;
  if (isMultiYear) {
    return {
      ticks:     [...yearMap.values()],
      formatter: (v) => { try { return String(new Date(v).getFullYear()); } catch { return v; } },
    };
  }
  return {
    ticks:     [...monthMap.values()],
    formatter: (v) => {
      try { return new Date(v).toLocaleDateString(undefined, { month: "short" }); } catch { return v; }
    },
  };
}

export default function DrawdownChart({ data = [], title = "Drawdown (R)", height = 160 }) {
  const { ticks, formatter } = useMemo(() => computeXAxis(data), [data]);

  const yMin = useMemo(() => {
    if (!data.length) return -2;
    const actual = Math.min(...data.map((d) => d.drawdown), 0);
    // Always show at least -2R range; extend further if actual drawdown is deeper
    return Math.min(Math.floor(actual * 1.1), -2);
  }, [data]);

  const allFlat = !data.length || data.every((d) => d.drawdown === 0);

  return (
    <Card className="border-zinc-800/60 bg-zinc-900/40">
      <CardHeader className="px-5 pt-4 pb-3">
        <CardTitle className="text-sm font-medium text-zinc-400">{title}</CardTitle>
      </CardHeader>
      <CardContent className="px-5 pb-4">
        {allFlat ? (
          <div className="flex items-center justify-center text-xs text-zinc-700" style={{ height }}>
            No drawdown
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={height}>
            <AreaChart data={data} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="ddFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="hsl(0 72% 51%)" stopOpacity={0.30} />
                  <stop offset="95%" stopColor="hsl(0 72% 51%)" stopOpacity={0.04} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 18%)" vertical={false} />
              <XAxis
                dataKey="date"
                ticks={ticks}
                tickFormatter={formatter}
                stroke="hsl(0 0% 30%)"
                fontSize={10}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                domain={[yMin, 0]}
                tickFormatter={(v) => `${v}R`}
                stroke="hsl(0 0% 30%)"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                width={38}
              />
              <ReferenceLine y={0} stroke="hsl(0 0% 35%)" strokeDasharray="4 3" />
              <Tooltip content={<DdTooltip />} isAnimationActive={false} />
              <Area
                type="monotone"
                dataKey="drawdown"
                stroke="hsl(0 72% 51%)"
                strokeWidth={1.5}
                fill="url(#ddFill)"
                dot={false}
                activeDot={{ r: 3, strokeWidth: 0, fill: "hsl(0 72% 51%)" }}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
