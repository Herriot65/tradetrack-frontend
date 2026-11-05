import { translate as t } from "@/i18n/language";
import { useLanguage } from "@/i18n/useLanguage";
import { useState } from "react";
import { getUserTimezone } from "@/lib/timezone";
import { formatDateLabel, formatPercent, formatValue, heatmapTone, sessionBands } from "@/lib/analytics";
import AnalyticsCard, { CardHeading, SegmentedControl } from "./AnalyticsCard";
const DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const HOURS = Array.from({length:24},(_,i)=>i);
const OPTIONS = [{value:"netR",label:"Net R"},{value:"winRate",label:"Win rate"},{value:"trades",label:"Trades"}];
const GRID = {gridTemplateColumns:"34px repeat(24,minmax(24px,1fr)) 62px"};
const LABEL = "sticky left-0 z-10 flex h-[28px] items-center bg-surface-card text-[11px] text-ink-muted";
function scale(buckets) { return {net:Math.max(0,...buckets.map(b=>Math.abs(b.totalR))), count:Math.max(1,...buckets.map(b=>b.count))}; }
function Cell({bucket,metric,scales,title,onHover,total=false}) {
  useLanguage();
  const tone = metric === "trades" ? heatmapTone(0,scales.count,bucket.count,"trades") : metric === "winRate" ? heatmapTone(bucket.winRate-50,50,bucket.count) : heatmapTone(bucket.totalR,scales.net,bucket.count);
  const text = !bucket.count ? "" : metric === "trades" ? bucket.count : metric === "winRate" ? formatPercent(bucket.winRate) : formatValue(bucket.totalR,"R");
  return <button type="button" aria-label={`${title}: ${bucket.count ? `${bucket.count} trades, ${formatValue(bucket.totalR,"R")}, win ${formatPercent(bucket.winRate)}` : "no trades"}`}
    className="relative h-[28px] min-w-0 rounded-[4px] text-[11px] outline-none" style={{backgroundColor:tone.background,color:tone.color}}
    onPointerEnter={()=>onHover({bucket,title})} onPointerLeave={()=>onHover(null)} onFocus={()=>onHover({bucket,title})} onBlur={()=>onHover(null)} onPointerDown={()=>onHover({bucket,title})}>
    {total ? text : <span className="sr-only">{t(text)}</span>}
  </button>;
}
export default function TimingCard({analytics}) {
  useLanguage();
  const [metric,setMetric] = useState("netR");
  const [hover,setHover] = useState(null);
  const {dayHour,byDay,byHour,summary,rows} = analytics;
  const timezone = getUserTimezone();
  const reference = rows.at(-1)?.date ?? new Date();
  const bands = sessionBands(reference,timezone);
  const scales = scale(dayHour.flat());
  const hourScales = scale(byHour);
  const dayScales = scale(byDay);
  const total = {count:summary.closedCount,totalR:summary.totalR,winRate:summary.winRate};
  const readout = hover ? `${hover.title} \u00b7 ${hover.bucket.count ? `${hover.bucket.count} trades \u00b7 ${formatValue(hover.bucket.totalR,"R")} \u00b7 win ${formatPercent(hover.bucket.winRate)}` : "no trades"}` : "Hover to inspect entry times";
  return <AnalyticsCard>
    <CardHeading title={t("Day and hour heatmap")} detail={t("Find the entry times that work best for you.")} action={<SegmentedControl label={t("Day and hour metric")} options={OPTIONS} value={metric} onChange={setMetric}/>}/>
    <p className="px-5 pt-3 min-[900px]:px-6 text-[11px] text-ink-muted">{timezone} {"\u00b7"}{" " + t("Sessions as of") + " "}{formatDateLabel(reference,"MMM d, yyyy")}</p>
    <p className="min-h-10 px-5 pt-2 min-[900px]:px-6 text-[12px] text-ink-muted" aria-live="polite">{t(readout)}</p>
    <div className="overflow-x-auto px-5 pb-5 pt-2 min-[900px]:px-6 min-[900px]:pb-6" role="group" aria-label={t("Trade performance by day and hour")}>
      <div className="min-w-[760px] space-y-[3px]">
        <div className="grid gap-[3px]" style={GRID}><span/>{bands.map(b=><span key={b.start} className="h-5 truncate border-t text-center text-[11px] text-ink-secondary" style={{gridColumn:`${b.start+2} / span ${b.end-b.start}`,borderColor:"var(--hairline-strong)"}}>{b.label}</span>)}</div>
        <div className="grid gap-[3px]" style={GRID}><span className={LABEL}/>{HOURS.map(h=><span key={h} className="text-center text-[11px] text-ink-muted">{h%3===0?String(h).padStart(2,"0"):""}</span>)}<span className="text-center text-[11px] text-ink-muted">{t("Total")}</span></div>
        {dayHour.map((row,d)=>d>4&&!byDay[d].count?null:<div key={d} className="grid gap-[3px]" style={GRID}><span className={LABEL}>{t(DAYS[d])}</span>{row.map((bucket,h)=><Cell key={h} bucket={bucket} metric={metric} scales={scales} title={`${t(DAYS[d])}, ${String(h).padStart(2,"0")}:00-${String((h+1)%24).padStart(2,"0")}:00`} onHover={setHover}/>)}<Cell total bucket={byDay[d]} metric={metric} scales={dayScales} title={t(DAYS[d])} onHover={setHover}/></div>)}
        <div className="grid gap-[3px] border-t border-hairline pt-1" style={GRID}><span className={LABEL}>{t("All")}</span>{byHour.map((bucket,h)=><Cell key={h} bucket={bucket} metric={metric} scales={hourScales} title={`All days, ${String(h).padStart(2,"0")}:00`} onHover={setHover}/>)}<Cell total bucket={total} metric={metric} scales={{net:Math.abs(total.totalR),count:total.count}} title={t("All days, all hours")} onHover={setHover}/></div>
      </div>
    </div>
  </AnalyticsCard>;
}
