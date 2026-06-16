import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/formatters";

function EqTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const r = payload[0].value;
  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs shadow-xl space-y-0.5">
      <p className="text-zinc-400">{formatDate(label)}</p>
      <p className="font-semibold text-emerald-400">
        {r >= 0 ? "+" : ""}{r}R
      </p>
    </div>
  );
}

export default function HubEquityCurve({ data = [], title = "Equity Curve", height = 180 }) {
  return (
    <Card className="border-zinc-800/60 bg-zinc-900/40">
      <CardHeader className="px-5 pt-4 pb-3">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="px-5 pb-4">
        {!data.length ? (
          <div className="flex h-[180px] items-center justify-center text-xs text-zinc-700">
            No trades
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={height}>
            <LineChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 18%)" vertical={false} />
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
                tickFormatter={(v) => `${v}R`}
                stroke="hsl(0 0% 30%)"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                width={42}
              />
              <ReferenceLine y={0} stroke="hsl(0 0% 35%)" strokeDasharray="4 3" />
              <Tooltip content={<EqTooltip />} />
              <Line
                type="monotone"
                dataKey="equity_r"
                stroke="hsl(142 70% 45%)"
                strokeWidth={2}
                dot={{ r: 3, fill: "hsl(142 70% 45%)", strokeWidth: 0 }}
                activeDot={{ r: 5, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
