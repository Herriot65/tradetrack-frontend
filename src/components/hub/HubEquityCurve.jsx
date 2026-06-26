import { useMemo, useState } from "react";
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
import { Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import InfoTip from "@/components/ui/InfoTip";
import { formatDate } from "@/lib/formatters";

// ─── Tooltip ──────────────────────────────────────────────────────────────────

function EqTooltip({ active, payload, label, masked }) {
  if (!active || !payload?.length) return null;
  const r = payload[0].value;
  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs shadow-xl space-y-0.5">
      <p className="text-zinc-400">{formatDate(label)}</p>
      <p className={`font-semibold ${r >= 0 ? "text-emerald-400" : "text-red-400"}`}>
        {masked ? "● ● ●" : `${r >= 0 ? "+" : ""}${r}R`}
      </p>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function computeDomain(data) {
  if (!data.length) return { yMin: -5, yMax: 10 };
  const values = data.map((d) => d.equity_r);
  const rawMin = Math.min(0, ...values);
  const rawMax = Math.max(0, ...values);
  const range  = Math.max(rawMax - rawMin, 1);
  const pad    = Math.max(range * 0.08, 1);
  return {
    yMin: Math.floor((rawMin - pad) / 5) * 5,
    yMax: Math.ceil((rawMax + pad) / 5) * 5,
  };
}

// Returns the dates to use as X-axis tick positions, plus a tick label formatter.
// Multi-year → one tick per year (e.g. "2024", "2025").
// Single-year → one tick per month that has at least one trade (e.g. "Jan", "Mar").
function computeXAxis(data) {
  if (!data.length) return { ticks: [], formatter: () => "" };

  const yearMap  = new Map(); // year  → first date string for that year
  const monthMap = new Map(); // month → first date string for that month

  data.forEach((d) => {
    const dt    = new Date(d.date);
    const year  = dt.getFullYear();
    const month = dt.getMonth();
    if (!yearMap.has(year))  yearMap.set(year, d.date);
    if (!monthMap.has(month)) monthMap.set(month, d.date);
  });

  const isMultiYear = yearMap.size > 1;

  if (isMultiYear) {
    return {
      ticks: [...yearMap.values()],
      formatter: (v) => {
        try { return String(new Date(v).getFullYear()); } catch { return v; }
      },
    };
  }

  return {
    ticks: [...monthMap.values()],
    formatter: (v) => {
      try {
        return new Date(v).toLocaleDateString(undefined, { month: "short" });
      } catch { return v; }
    },
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function HubEquityCurve({ data = [], title = "Equity Curve", height = 180 }) {
  const [masked, setMasked] = useState(false);

  const { yMin, yMax }          = useMemo(() => computeDomain(data), [data]);
  const { ticks, formatter }    = useMemo(() => computeXAxis(data),  [data]);

  const lastEquityR  = data.length > 0 ? data[data.length - 1].equity_r : 0;
  const isNegative   = lastEquityR < 0;
  const lineColor    = isNegative ? "hsl(0 70% 55%)"   : "hsl(142 70% 45%)";
  const fillColor    = isNegative ? "hsl(0 70% 50%)"   : "hsl(142 70% 45%)";
  // For negative equity the fill area is below 0 so the gradient should intensify downward.
  const fillStops    = isNegative
    ? [{ offset: "5%", opacity: 0 }, { offset: "95%", opacity: 0.28 }]
    : [{ offset: "5%", opacity: 0.28 }, { offset: "95%", opacity: 0 }];

  return (
    <Card className="border-zinc-800/60 bg-zinc-900/40">
      <CardHeader className="flex flex-row items-center justify-between px-5 pt-4 pb-3">
        <div className="flex items-center gap-1.5">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <InfoTip text="Cumulative R over time. Each point is the running total of R after that trade. Green = above breakeven, red = below." />
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMasked((v) => !v)}
          title={masked ? "Show scale" : "Hide scale"}
          className="size-6 shrink-0 text-zinc-600 hover:text-zinc-300"
        >
          {masked ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
        </Button>
      </CardHeader>

      <CardContent className="px-5 pb-4">
        {!data.length ? (
          <div
            className="flex items-center justify-center text-xs text-zinc-700"
            style={{ height }}
          >
            No trades
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={height}>
            <AreaChart data={data} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="equityFill" x1="0" y1="0" x2="0" y2="1">
                  {fillStops.map((s) => (
                    <stop key={s.offset} offset={s.offset} stopColor={fillColor} stopOpacity={s.opacity} />
                  ))}
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
                domain={[yMin, yMax]}
                tickFormatter={masked ? () => "" : (v) => `${v}R`}
                stroke="hsl(0 0% 30%)"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                width={masked ? 8 : 38}
              />

              <ReferenceLine y={0} stroke="hsl(0 0% 35%)" strokeDasharray="4 3" />

              <Tooltip
                content={<EqTooltip masked={masked} />}
                isAnimationActive={false}
              />

              <Area
                type="monotone"
                dataKey="equity_r"
                stroke={lineColor}
                strokeWidth={2}
                fill="url(#equityFill)"
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0, fill: lineColor }}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
