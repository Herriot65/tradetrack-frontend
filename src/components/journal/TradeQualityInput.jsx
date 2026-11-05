import { translate as t } from "@/i18n/language";
import { useLanguage } from "@/i18n/useLanguage";
import { Star } from "lucide-react";

export default function TradeQualityInput({value,onChange,onBlur,id,style="score"}) {
  useLanguage();
  const rated = value !== "" && value != null;
  const score = rated ? Number(value) : 0;
  return <div className="space-y-2">
    <input id={id} type="range" aria-label={style==="stars"?t("Trade quality stars"):t("Trade score")} min="0" max={style==="stars"?5:10} step={style==="stars"?0.05:0.1} value={style==="stars"?score/2:score} onChange={event=>onChange(Number((Number(event.target.value)*(style==="stars"?2:1)).toFixed(2)))} onBlur={onBlur} className="block w-full cursor-pointer accent-zinc-300"/>
    <div className="flex h-6 items-center justify-between gap-2 text-xs text-zinc-400">
      <div className="flex min-w-0 items-center gap-2">
        {style==="stars"&&<div className="flex" role="group" aria-label={t("Star rating")}>{[1,2,3,4,5].map(star=><button key={star} type="button" aria-label={`${star} stars`} aria-pressed={rated&&score===star*2} onClick={()=>onChange(star*2)} className="relative rounded p-0.5 text-zinc-600 focus-visible:ring-1 focus-visible:ring-zinc-400"><Star className="size-3.5"/><span className="pointer-events-none absolute inset-y-0.5 left-0.5 overflow-hidden text-amber-400" style={{width:`${14*Math.max(0,Math.min(1,score/2-star+1))}px`}}><Star className="size-3.5 fill-current"/></span></button>)}</div>}
        <output className="whitespace-nowrap tabular-nums">{rated?`${style==="stars"?score/2:score} / ${style==="stars"?5:10}`:t("Not rated")}</output>
      </div>
      <button type="button" aria-label={t("Clear trade rating")} onClick={()=>onChange(null)} className="shrink-0 hover:text-zinc-100">{t("Clear")}</button>
    </div>
  </div>;
}
