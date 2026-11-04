import { useCallback, useMemo, useState } from "react";
import { BookOpen, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { createTrade, updateTrade, deleteTrade } from "@/api/trades.api";
import { useTrades } from "@/hooks/useTrades";
import { useJournalCatalog } from "@/journals/useJournalCatalog";
import TradeTable from "./TradeTable";
import TradePanel from "./TradePanel";
import TradeSearchInput from "./TradeSearchInput";
import FieldModeToggle from "./FieldModeToggle";
import { UNIT_OPTIONS } from "@/lib/analytics";
import { useJournal } from "@/journals/useJournal";

const STATUS_FILTERS = [{value:"",label:"All"},{value:"OPEN",label:"Open"},{value:"WIN",label:"Wins"},{value:"LOSS",label:"Losses"},{value:"BE",label:"Break Even"}];
const SORT_FIELDS = { date: "entry_datetime", asset: "asset__symbol", r: "pnl_r" };
const PAGE_SIZE = 20;

function TableSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border border-zinc-800/60">
      <div className="border-b border-zinc-800/60 bg-zinc-900/60 px-3 py-2.5">
        <Skeleton className="h-3 w-64" />
      </div>
      <div className="divide-y divide-zinc-800/40">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-4 px-3 py-3">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-5 w-10 rounded" />
            <Skeleton className="h-3 w-24" />
            <Skeleton className="ml-auto h-5 w-14" />
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyTrades({ hasFilters }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-zinc-800 py-20 text-center">
      <div className="flex size-12 items-center justify-center rounded-xl bg-zinc-900 ring-1 ring-zinc-800">
        <BookOpen className="size-5 text-zinc-600" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-zinc-300">
          {hasFilters ? "No trades match your filters" : "No trades yet"}
        </p>
        <p className="max-w-xs text-xs text-zinc-600">
          {hasFilters
            ? "Try clearing the search or status filter."
            : "Trades will appear here once synced."}
        </p>
      </div>
    </div>
  );
}

export default function TradesTab({ breakEvenMethod, journalId }) {
  const {activeJournal,updateJournal} = useJournal();
  const [displayUnit,setDisplayUnit] = useState(activeJournal?.display_unit || "R");
  const [unitError,setUnitError] = useState("");
  const [savingUnit,setSavingUnit] = useState(false);
  async function changeDisplayUnit(unit) {
    const previous=displayUnit;
    setDisplayUnit(unit);setUnitError("");setSavingUnit(true);
    try {await updateJournal(journalId,{displayUnit:unit});}
    catch {setDisplayUnit(previous);setUnitError("Could not save display units. Try again.");}
    finally {setSavingUnit(false);}
  }
  const [query, setQuery] = useState({ search: "", status: "", page: 1, sortField: "date", sortDir: "desc" });
  const [panel, setPanel] = useState(null);
  const prefix = query.sortDir === "desc" ? "-" : "";
  const sortColumn = query.sortField==="r" ? ({R:"display_pnl_r",USD:"pnl_amount",PCT:"pnl_percent"}[displayUnit]) : SORT_FIELDS[query.sortField];
  const ordering = `${prefix}${sortColumn},${prefix}id`;
  const {data, loading, error, refetch} = useTrades({journalId, search:query.search, status:query.status, page:query.page, ordering});
  const catalog = useJournalCatalog(journalId);
  const onSearch = useCallback(search => setQuery(current => current.search === search ? current : {...current, search, page:1}), []);
  const onSort = useCallback(key => setQuery(current => ({...current, sortField:key, sortDir:current.sortField===key && current.sortDir==="desc"?"asc":"desc",page:1})), []);
  const sort = useMemo(()=>({field:query.sortField,dir:query.sortDir}),[query.sortField,query.sortDir]);
  const openTrade = useCallback(trade => setPanel({mode:"edit",trade}), []);
  const openNewTrade = useCallback(() => setPanel({mode:"create",trade:null}), []);
  const trades = data?.results ?? [];
  const totalCount = data?.count ?? 0;
  const totalPages = Math.max(1,Math.ceil(totalCount/PAGE_SIZE));
  async function handleSave(payload) {
    const result = panel?.mode === "edit" ? await updateTrade(journalId,panel.trade.id,payload) : await createTrade(journalId,payload);
    if(query.page>1) setQuery(current=>({...current,page:1})); else refetch();
    return result;
  }
  async function handleDelete(id) {
    await deleteTrade(journalId,id);
    if(trades.length===1 && query.page>1) setQuery(current=>({...current,page:current.page-1}));
    else refetch();
  }
  return <div className="space-y-4">
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <TradeSearchInput onSearch={onSearch}/>
      <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Trade status">
        {STATUS_FILTERS.map(filter=><button key={filter.value} type="button" aria-pressed={query.status===filter.value} onClick={()=>setQuery(current=>({...current,status:filter.value,page:1}))} className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${query.status===filter.value?"bg-zinc-700/70 text-zinc-100 ring-1 ring-zinc-600":"bg-zinc-800/60 text-zinc-400 hover:bg-zinc-700/60 hover:text-zinc-200"}`}>{filter.label}</button>)}
      </div>
      <div className="ml-auto flex shrink-0 items-center gap-3">
        <FieldModeToggle label="Table display units" options={UNIT_OPTIONS.map(option=>({...option,disabled:savingUnit}))} value={displayUnit} onChange={changeDisplayUnit}/>
        <span className="text-xs text-zinc-500" aria-live="polite">{loading && data ? "Updating..." : `${totalCount} ${totalCount===1?"trade":"trades"}`}</span>
        <Button type="button" size="sm" onClick={openNewTrade}><Plus className="size-3.5"/>New Trade</Button>
      </div>
    </div>
    {error && <div role="alert" className="flex items-center justify-between gap-3 rounded-lg border border-zinc-700 px-4 py-3 text-sm text-zinc-300"><span>{error}{data ? " Showing the previous results." : ""}</span><Button size="sm" variant="outline" onClick={refetch}>Retry</Button></div>}
    {unitError&&<p role="alert" className="text-xs text-red-400">{unitError}</p>}
    <div aria-busy={loading}>
      {loading && !data ? <TableSkeleton/> : trades.length ? <TradeTable trades={trades} breakEvenMethod={breakEvenMethod} onRowClick={openTrade} journalId={journalId} sort={sort} onSort={onSort} displayUnit={displayUnit}/> : !error ? <EmptyTrades hasFilters={!!query.search||!!query.status}/> : null}
    </div>
    {totalPages>1 && <div className="flex items-center justify-between gap-2 pt-1">
      <span className="text-xs text-zinc-500">Page {query.page} of {totalPages}</span>
      <div className="flex items-center gap-2"><Button size="sm" variant="outline" disabled={loading||query.page<=1} onClick={()=>setQuery(current=>({...current,page:Math.max(1,current.page-1)}))}>Previous</Button><Button size="sm" variant="outline" disabled={loading||query.page>=totalPages} onClick={()=>setQuery(current=>({...current,page:Math.min(totalPages,current.page+1)}))}>Next</Button></div>
    </div>}
    <TradePanel mode={panel?.mode??"create"} trade={panel?.trade??null} open={panel!==null} onClose={()=>setPanel(null)} onSave={handleSave} onDelete={handleDelete} catalog={catalog} journalId={journalId} defaultUnit={displayUnit}/>
  </div>;
}
