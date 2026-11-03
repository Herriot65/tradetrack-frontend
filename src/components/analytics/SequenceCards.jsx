import { useChartWidth } from "@/hooks/useChartWidth";
import { useState } from "react";
import { formatAxisTick, formatDateLabel, formatValue, niceTicks } from "@/lib/analytics";
import AnalyticsCard, { CardHeading, SegmentedControl } from "./AnalyticsCard";
const OPTIONS = [{value:"sequence",label:"Sequence"},{value:"distribution",label:"Distribution"}];
export default function SequenceCards({analytics, onOpenTrade}) {
  const [chartRef, width] = useChartWidth();
  const right = width - 22;
  const [view,setView] = useState("sequence");
  const [hover,setHover] = useState(null);
  const {rPerTrade: trades, distribution, unit, summary} = analytics;
  const sequence = view === "sequence";
  const data = sequence ? trades : distribution;
  const extent = Math.max(2, Math.ceil(Math.max(...trades.map(t => Math.abs(t.value)),0)/2)*2);
  const ticks = sequence ? Array.from({length:extent+1},(_,i)=>-extent+i*2) : niceTicks(0,Math.max(1,...distribution.map(b=>b.count)),3);
  const low = ticks[0], high=ticks.at(-1);
  const y = v => 220 - (v-low)/(high-low)*200;
  const slot = (width - 70) / Math.max(1,data.length);
  const active = hover === null ? null : data[hover];
  const readout = !sequence ? "How your R-multiples are distributed, in 0.5R buckets" : active ? `Trade #${active.seq} \u00b7 ${active.asset} \u00b7 ${formatDateLabel(active.date,"EEE MMM d")} \u00b7 ${formatValue(active.value,unit)}` : "Hover to inspect a trade";
  return <AnalyticsCard>
    <CardHeading title="R per trade" action={<SegmentedControl label="R per trade view" options={OPTIONS} value={view} onChange={v=>{setView(v);setHover(null);}}/>}/>
    <p className="min-h-9 px-4 pt-2 text-[12px] text-ink-muted" aria-live="polite">{readout}</p>
    <svg ref={chartRef} viewBox={`0 0 ${width} 255`} className="block h-[255px] w-full" role="img" aria-label={sequence ? "Trade results in sequence" : "Distribution of R multiples"}>
      {ticks.map(v=><g key={v}><line x1="48" x2={right} y1={y(v)} y2={y(v)} stroke={v===0?"var(--hairline-strong)":"var(--hairline)"} strokeDasharray={v===0?undefined:"2 4"}/><text x="40" y={y(v)+4} textAnchor="end" fontSize="11" fill="var(--ink-muted)">{sequence?formatAxisTick(v,unit):v}</text></g>)}
      {sequence && <g><line x1="48" x2={right} y1={y(summary.expectancy)} y2={y(summary.expectancy)} stroke="var(--ink-secondary)" strokeDasharray="4 3"/><text x={right} y="12" textAnchor="end" fontSize="11" fill="var(--ink-secondary)">Expectancy {formatValue(summary.expectancy,unit)}</text></g>}
      {data.map((d,i)=>{const value=sequence?d.value:d.count;const zero=sequence && d.status==="BE";const color=sequence?(zero?"ink-muted":value>0?"profit":"loss"):d.tone==="neutral"?"ink-muted":d.tone;
        return <g key={i} tabIndex={0} role="button" aria-label={sequence?`Open trade #${d.seq}: ${formatValue(value,unit)}`:`${d.label}: ${d.count} trades`} className="outline-none" onPointerEnter={()=>setHover(i)} onPointerLeave={()=>setHover(null)} onFocus={()=>setHover(i)} onBlur={()=>setHover(null)} onClick={()=>sequence&&onOpenTrade?.(d)} onKeyDown={e=>{if(e.key==="Enter"&&sequence)onOpenTrade?.(d);}}>
          <rect x={48+i*slot} y="20" width={slot} height="200" fill={hover===i?"var(--surface-raised)":"transparent"}/>
          <rect x={48+(i+0.15)*slot} y={zero?y(0)-1:Math.min(y(value),y(0))} width={slot*0.7} height={zero?2:Math.max(0.5,Math.abs(y(value)-y(0)))} rx="1" fill={`var(--${color})`}/>
          {!sequence && <text x={48+(i+0.5)*slot} y={y(value)-5} textAnchor="middle" fontSize="11" fill="var(--ink-secondary)">{d.count}</text>}
          {(!sequence || [1,25,50,75,100,trades.length].includes(d.seq)) && <text x={48+(i+0.5)*slot} y="244" textAnchor="middle" fontSize="11" fill="var(--ink-muted)">{sequence?`#${d.seq}`:d.label}</text>}
        </g>;
      })}
    </svg>
  </AnalyticsCard>;
}
