import { translate as t } from "@/i18n/language";
import { useLanguage } from "@/i18n/useLanguage";
import { Input } from "@/components/ui/input";

export default function TradeRiskInput({value,onChange,onBlur,capital,unit}) {
  useLanguage();
  const dollars = unit==="USD" && capital>0;
  const display = value===""||value==null?"":Number(value)*(dollars?capital/100:1);
  return <div className="space-y-2">
    <Input id="trade-risk" aria-label={`Risk (${dollars?"$":"%"})`} type="number" min="0" step="any" placeholder={dollars?"100.00":"1.00"} value={display===""?"":Number(display.toFixed(6))} onBlur={onBlur} onChange={event=>{
      const raw=event.target.value;
      onChange(raw===""?null:Number((Number(raw)*(dollars?100/capital:1)).toFixed(6)));
    }} className="h-10 border-zinc-800 bg-zinc-900/60 text-sm focus-visible:ring-zinc-400/40"/>
    {!(capital>0)&&<p className="text-[11px] text-zinc-500">{t("Set starting capital in journal settings to enter risk in $.")}</p>}
  </div>;
}
