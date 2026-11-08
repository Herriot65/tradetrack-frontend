import { translate as t } from "@/i18n/language";
import { useLanguage } from "@/i18n/useLanguage";
import { useChartWidth } from "@/hooks/useChartWidth";
import { useState } from "react";
import { formatAxisTick, formatDateLabel, formatValue, niceTicks } from "@/lib/analytics";
import AnalyticsCard, { CardHeading } from "./AnalyticsCard";

export default function EquitySection({ analytics, compact = false }) {
  useLanguage();
  const [chartRef, width] = useChartWidth();
  const right = width - 16;
  const plotHeight = compact ? 220 : 320;
  const drawdownTop = compact ? 260 : 370;
  const height = drawdownTop + 92;
  const { equityCurve: points, unit } = analytics;
  const [index, setIndex] = useState(null);
  const point = index === null ? null : points[index];
  const ticks = niceTicks(Math.min(0, ...points.map(p => p.equity)), Math.max(0, ...points.map(p => p.equity)), 5);
  const ddTicks = niceTicks(Math.min(0, ...points.map(p => p.drawdown)), 0, 3);
  const x = i => 48 + i / Math.max(1, points.length - 1) * (width - 64);
  const y = v => 10 + plotHeight - (v - ticks[0]) / (ticks.at(-1) - ticks[0]) * plotHeight;
  const dy = v => drawdownTop + v / (ddTicks[0] || -1) * 60;
  const path = (fn, key) => points.map((p, i) => `${i ? "L" : "M"}${x(i)},${fn(p[key])}`).join(" ");
  const select = event => {
    const box = event.currentTarget.getBoundingClientRect();
    setIndex(Math.max(0, Math.min(points.length - 1, Math.round(((event.clientX - box.left) / box.width * width - 48) / (width - 64) * (points.length - 1)))));
  };
  const readout = point ? `Trade #${point.seq} \u00b7 ${formatValue(point.tradeValue ?? 0, unit)} \u00b7 Equity ${formatValue(point.equity, unit)} \u00b7 DD ${formatValue(point.drawdown, unit)}` : "Hover to inspect a trade";
  return <AnalyticsCard>
    <CardHeading title={t("Equity and drawdown")} detail={t("Your cumulative return and the declines from each peak.")} />
    <p className="min-h-10 px-5 pt-3 min-[900px]:px-6 text-[12px] text-ink-muted" aria-live="polite">{readout}</p>
    <svg ref={chartRef} viewBox={`0 0 ${width} ${height}`} style={{height}} className="block mb-3 w-full outline-none focus-visible:ring-1 focus-visible:ring-ink-muted" role="img" aria-label={`Equity and drawdown across ${points.length - 1} trades. Use arrow keys to inspect.`} tabIndex={0}
      onPointerMove={select} onPointerDown={select} onPointerLeave={() => setIndex(null)} onFocus={() => setIndex(0)} onBlur={() => setIndex(null)}
      onKeyDown={e => { if (["ArrowLeft", "ArrowRight"].includes(e.key)) { e.preventDefault(); setIndex(i => Math.max(0, Math.min(points.length - 1, (i ?? 0) + (e.key === "ArrowRight" ? 1 : -1)))); } }}>
      {ticks.map(v => <g key={v}><line x1="48" x2={right} y1={y(v)} y2={y(v)} stroke={v === 0 ? "var(--hairline-strong)" : "var(--hairline)"} strokeDasharray={v === 0 ? undefined : "2 4"}/><text x="40" y={y(v)+4} textAnchor="end" fontSize="11" fill="var(--ink-muted)">{formatAxisTick(v, unit)}</text></g>)}
      <path d={`${path(y, "equity")} L${right},${y(0)} L48,${y(0)} Z`} fill="var(--profit)" fillOpacity="0.1"/>
      <path d={path(y, "equity")} fill="none" stroke="var(--profit)" strokeWidth="1.5"/>
      <text x="48" y={drawdownTop - 12} fontSize="11" fill="var(--ink-muted)">{t("Drawdown")}</text>
      {ddTicks.map(v => <g key={v}><line x1="48" x2={right} y1={dy(v)} y2={dy(v)} stroke="var(--hairline)" strokeDasharray={v === 0 ? undefined : "2 4"}/><text x="40" y={dy(v)+4} textAnchor="end" fontSize="11" fill="var(--ink-muted)">{formatAxisTick(v,unit)}</text></g>)}
      <path d={`${path(dy, "drawdown")} L${right},${drawdownTop} L48,${drawdownTop} Z`} fill="var(--loss)" fillOpacity="0.15"/>
      <path d={path(dy,"drawdown")} fill="none" stroke="var(--loss)" strokeWidth="1.2"/>
      {Array.from({length: 6}, (_, i) => Math.round(i / 5 * (points.length - 1))).map((n,i) => <text key={i} x={x(n)} y={height - 7} textAnchor={i === 5 ? "end" : i === 0 ? "start" : "middle"} fontSize="11" fill="var(--ink-muted)">{formatDateLabel(points[n]?.date,"MMM")}</text>)}
      {point && <g><line x1={x(index)} x2={x(index)} y1="10" y2={drawdownTop + 60} stroke="var(--ink-muted)"/><circle cx={x(index)} cy={y(point.equity)} r="3" fill="var(--profit)"/><circle cx={x(index)} cy={dy(point.drawdown)} r="3" fill="var(--loss)"/></g>}
    </svg>
  </AnalyticsCard>;
}
