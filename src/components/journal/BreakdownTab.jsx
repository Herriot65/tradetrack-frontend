import SelectField from "@/components/ui/select-field";
import { translate as t } from "@/i18n/language";
import { useLanguage } from "@/i18n/useLanguage";
import { useCallback, useMemo, useState } from 'react';
import { fetchHubTrades } from '@/api/hub.api';
import { useAsyncQuery } from '@/hooks/useAsyncQuery';
import { useJournal } from '@/journals/useJournal';
import { filterTrades, formatValue } from '@/lib/analytics';
import { BREAKDOWN_FIELDS, buildBreakdown } from '@/lib/breakdown';
import { Button } from '@/components/ui/button';

const r = value => value === null ? '—' : formatValue(value, 'R');
const percent = value => `${value.toFixed(1)}%`;
const selectClass = 'min-w-0 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-200';
export default function BreakdownTab({journal, active, syntheticEnabled}) {
  useLanguage();
  const {analyticsVersion} = useJournal();
  const [field, setField] = useState('setup');
  const [range, setRange] = useState('ALL');
  const query = useCallback(() => fetchHubTrades(journal.id, {years:[]}), [journal.id]);
  const {data, loading, error, refetch} = useAsyncQuery(query, [journal.id, analyticsVersion], {enabled:active && !!journal.id, retainOnDisable:true});
  const filtered = useMemo(()=>filterTrades(data ?? [], {range}),[data,range]);
  const {rows,excluded,unassigned} = useMemo(()=>buildBreakdown(filtered,field,journal),[filtered,field,journal]);
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? rows : rows.slice(0,12);
  const scale = Math.max(...rows.map(row=>Math.abs(row.mean)),.1);
  const multi = field === 'emotions' || field === 'mistakes';
  return <div className="space-y-6" data-testid="breakdown">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><h2 className="text-2xl font-semibold tracking-tight">{t("Breakdown")}</h2><p className="mt-2 max-w-2xl text-sm text-zinc-500">{t("Compare average return and outcomes across your trade conditions.")}</p></div>
      {syntheticEnabled && <span className="rounded-full border border-amber-400/20 bg-amber-400/5 px-3 py-1.5 text-xs text-amber-300">{t("Includes synthetic trades")}</span>}
    </div>
    <div className="flex flex-wrap gap-3 rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
      <label className="flex min-w-0 flex-col gap-1.5 text-xs text-zinc-500">{t("Compare by")}<SelectField label={t("Breakdown attribute")} className={selectClass} value={field} onValueChange={next=>{setField(next);setExpanded(false);}} allowClear={false} options={BREAKDOWN_FIELDS.map(([value,label])=>({value,label:t(label)}))} /></label>
      <label className="flex flex-col gap-1.5 text-xs text-zinc-500">{t("Period")}<SelectField label={t("Breakdown period")} className={selectClass} value={range} onValueChange={setRange} allowClear={false} options={[{value:"ALL",label:t("All time")},{value:"YTD",label:t("This year")},{value:"12M",label:t("Last 12 months")},{value:"3M",label:t("Last 3 months")}]} /></label>
      <p className="self-end pb-2 text-xs text-zinc-500">{t("Closed trades only.") + " "}{excluded}{" " + t("open or missing risk data excluded.")}{unassigned > 0 && ` ${unassigned} without this attribute omitted.`}</p>
    </div>
    {loading ? <p role="status" className="py-12 text-center text-zinc-500">{t("Loading trade breakdown…")}</p> : error ? <div role="alert" className="space-y-3 text-sm text-red-400"><p>{error}</p><Button variant="outline" onClick={refetch}>{t("Retry")}</Button></div> : !rows.length ? <div className="rounded-xl border border-dashed border-zinc-800 p-12 text-center"><h3 className="text-lg">{t("No comparable trades yet")}</h3><p className="mt-2 text-sm text-zinc-500">{t("Log closed trades with this attribute, or enable synthetic data in Analytics to explore sample results.")}</p></div> : <>
      <div className="grid min-w-0 gap-5 xl:grid-cols-2">
        <section className="min-w-0 rounded-xl border border-zinc-800 bg-card p-5">
          <div className="mb-6"><h3 className="font-medium">{t("Average return by") + " "}{BREAKDOWN_FIELDS.find(([id])=>id===field)[1].toLowerCase()}</h3><p className="mt-1 text-xs text-zinc-500">{t("R per trade · highest to lowest. 1R equals the amount risked.")}</p></div>
          <div className="mb-4 flex justify-between text-[10px] font-mono text-zinc-500" aria-hidden="true"><span>{r(-scale)}</span><span>0R</span><span>{r(scale)}</span></div>
          <div className="space-y-5">{visible.map(row=><div key={row.name}><div className="mb-2 flex items-center justify-between gap-3 text-xs"><span className="min-w-0 break-words text-zinc-200">{row.name} <span className="text-zinc-500">· {row.n}{" " + t("trades")}{row.n<20?' · Limited data':''}</span></span><span className={`shrink-0 font-mono ${row.mean<0?'text-rose-400':'text-emerald-400'}`}>{r(row.mean)}</span></div><div className="relative h-5 overflow-hidden rounded bg-zinc-900" role="img" aria-label={`${row.name}: ${r(row.mean)}, ${row.n} trades`}><div className="absolute inset-y-0 left-1/2 border-l border-zinc-600"/><div className={`absolute inset-y-1 rounded-sm ${row.mean<0?'bg-rose-400':'bg-emerald-400'}`} style={{left:`${row.mean<0?50-Math.abs(row.mean)/scale*50:50}%`,width:`${Math.abs(row.mean)/scale*50}%`}}/></div></div>)}</div>
          <p className="mt-5 text-xs leading-5 text-zinc-500">{t("Bars share the same scale. Below zero means an average loss per trade.")}</p>
        </section>
        <section className="min-w-0 rounded-xl border border-zinc-800 bg-card p-5"><h3 className="font-medium">{t("Outcome mix")}</h3><p className="mt-1 text-xs text-zinc-500">{t("Share of closed trades: wins, losses, and break even.")}</p><div className="mt-5 flex flex-wrap gap-4 text-xs text-zinc-400"><span className="text-emerald-400">{t("● Wins")}</span><span className="text-rose-400">{t("● Losses")}</span><span>{t("● Break even")}</span></div><div className="mt-6 space-y-5">{visible.map(row=><div key={row.name}><div className="mb-2 flex justify-between gap-3 text-xs"><span className="min-w-0 break-words">{row.name}</span><span className="shrink-0 text-zinc-400">{percent(row.winRate)}{" " + t("wins")}</span></div><div className="flex h-5 overflow-hidden rounded bg-zinc-900" role="img" aria-label={`${row.name}: ${row.wins} wins, ${row.losses} losses, ${row.be} break even`}>{[['wins','bg-emerald-400'],['losses','bg-rose-400'],['be','bg-zinc-600']].map(([key,color])=><div key={key} className={color} style={{width:`${row[key]/row.n*100}%`}}/>)}</div></div>)}</div></section>
      </div>
      <details className="overflow-hidden rounded-xl border border-zinc-800 bg-card">
        <summary className="cursor-pointer px-5 py-4 text-sm font-medium">{t("Payoff details") + " "}<span className="ml-2 text-xs font-normal text-zinc-500">{t("Average winning and losing trade")}</span></summary>
        <p className="px-5 pb-4 text-xs text-zinc-500">{t("Use payoff alongside win rate: frequent wins can still be outweighed by larger losses.")}</p>
        <div className="overflow-x-auto"><table className="w-full whitespace-nowrap text-left text-xs"><thead className="border-y border-zinc-800 text-zinc-500"><tr>{['Category','Closed trades','Average win','Average loss'].map(label=><th key={label} scope="col" className="px-5 py-3 font-normal">{t(label)}</th>)}</tr></thead><tbody>{visible.map(row=><tr key={row.name} className="border-b border-zinc-800/50"><th scope="row" className="px-5 py-4 font-normal">{row.name}</th>{[row.n,r(row.avgWin),r(row.avgLoss)].map((value,i)=><td key={i} className="px-5 py-4 font-mono text-zinc-400">{value}</td>)}</tr>)}</tbody></table></div>
      </details>
      {rows.length>12&&<Button variant="outline" onClick={()=>setExpanded(!expanded)}>{expanded?t("Show top 12"):`Show all ${rows.length} categories`}</Button>}
      <p className="text-xs leading-5 text-zinc-500">{multi?'A trade can have multiple tags and appears once in each tagged category. Group totals overlap and should not be added together. ':''}{t("Limited data = fewer than 20 closed trades; avoid drawing conclusions from small groups. Patterns are associations, not proof of cause.")}</p>
    </>}
  </div>;
}
