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
import InfoTip from "@/components/ui/InfoTip";
import { formatDate } from "@/lib/formatters";

const WIN_COLOR  = "hsl(142 70% 45%)";
const LOSS_COLOR = "hsl(0 72% 51%)";
const BE_COLOR   = "hsl(0 0% 45%)";

function barColor(r) {
  if (r > 0) return WIN_COLOR;
  if (r < 0) return LOSS_COLOR;
  return BE_COLOR;
}

function RTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const { seq, r, asset, date, status } = payload[0].payload;
  const sign = r > 0 ? "+" : "";
  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs shadow-xl space-y-1">
      <p className="font-medium text-zinc-200">Trade #{seq} — {asset}</p>
      <p className="text-zinc-400">{formatDate(date)}</p>
      <p style={{ color: barColor(r) }} className="font-semibold">
        {sign}{r}R
      </p>
      <p className="text-zinc-500">{status}</p>
    </div>
  );
}

export default function RPerTradeChart({ data = [], title = "R per Trade", height = 220 }) {
  if (!data.length) {
    return (
      <Card className="border-zinc-800/60 bg-zinc-900/40">
        <CardHeader className="px-6 pt-5 pb-4">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <div className="flex h-[220px] items-center justify-center text-xs text-zinc-700">
            No closed trades
          </div>
        </CardContent>
      </Card>
    );
  }

  // Pad Y domain so the zero line sits visually in the middle-ish area
  const maxAbs = Math.max(...data.map((d) => Math.abs(d.r)), 1);
  const domain = [-(maxAbs + 0.5), maxAbs + 0.5];

  return (
    <Card className="border-zinc-800/60 bg-zinc-900/40">
      <CardHeader className="flex flex-row items-center justify-between px-6 pt-5 pb-4">
        <div className="flex items-center gap-1.5">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <InfoTip text="Individual R-multiple for each closed trade in sequence. Green bars = wins, red bars = losses." />
        </div>
        <span className="text-xs text-zinc-600">{data.length} trades</span>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <XAxis
              dataKey="seq"
              stroke="hsl(0 0% 30%)"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              label={{ value: "Trade #", position: "insideBottom", offset: -2, fontSize: 10, fill: "hsl(0 0% 35%)" }}
              height={28}
              interval={data.length > 20 ? "preserveStartEnd" : 0}
            />
            <YAxis
              domain={domain}
              tickFormatter={(v) => `${v}R`}
              stroke="hsl(0 0% 30%)"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              width={42}
            />
            <ReferenceLine
              y={0}
              stroke="hsl(0 0% 40%)"
              strokeWidth={1.5}
              strokeDasharray="0"
            />
            <Tooltip content={<RTooltip />} cursor={{ fill: "hsl(0 0% 12%)" }} />
            <Bar dataKey="r" radius={[2, 2, 0, 0]} maxBarSize={32}>
              {data.map((entry) => (
                <Cell key={entry.seq} fill={barColor(entry.r)} fillOpacity={0.9} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
