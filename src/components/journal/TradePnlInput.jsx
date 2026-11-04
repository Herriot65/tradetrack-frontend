import { Input } from "@/components/ui/input";
import { tradeAmount, riskAmount } from "@/lib/analytics";

export default function TradePnlInput({value,onChange,onBlur,risk,capital,unit="R",knownProfit=null}) {
  const trade = {pnl_r:value,risk_percent:risk};
  const canConvert = riskAmount(trade,capital)!==null;
  const fixedProfit = !canConvert && knownProfit!==null;
  const effectiveUnit = fixedProfit?"USD":canConvert ? unit : "R";
  const display = fixedProfit ? knownProfit : value==null||value===""?"":tradeAmount(trade,effectiveUnit,capital);
  function change(raw) {
    if(raw==="") return onChange(null);
    const number=Number(raw);
    const r=effectiveUnit==="R"?number:effectiveUnit==="PCT"?number/Number(risk):number/riskAmount(trade,capital);
    onChange(Number(r.toFixed(6)));
  }
  return <div className="space-y-2">
    <Input aria-label={`PnL (${effectiveUnit})`} type="number" step="any" readOnly={fixedProfit} value={display===""?"":Number(Number(display).toFixed(6))} onChange={event=>change(event.target.value)} onBlur={onBlur} placeholder="e.g. 2.00" className="h-10 border-zinc-800 bg-zinc-900/60"/>
    {!canConvert&&<p className="text-[11px] text-zinc-500">Set Risk % and journal starting capital to enter $ or %.</p>}
  </div>;
}
