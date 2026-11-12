import { useEffect, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { fetchTrades } from "@/api/trades.api";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { apiError, fieldClass } from "./coachConfiguration";

export default function CoachTradePicker({ journalId, timezone, onSelect, onClose }) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let cancelled = false;
    setLoading(true); setError("");
    const timer = setTimeout(async () => {
      try {
        const data = await fetchTrades(journalId, { page, page_size: 20, compact: "1", search: query.trim(), ordering: "-entry_datetime,-id" });
        if (!cancelled) setResult(Array.isArray(data) ? { results: data, count: data.length } : data);
      } catch (err) { if (!cancelled) setError(apiError(err)); }
      finally { if (!cancelled) setLoading(false); }
    }, 250);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [journalId, page, query, retry]);
  const rows = result?.results || [];
  return <Dialog open onOpenChange={open => { if (!open) onClose(); }}><DialogContent className="sm:max-w-xl"><DialogHeader><DialogTitle>Choose a trade</DialogTitle><DialogDescription>Pick a trade from this journal. Its date, notes, and attachments will be available to your coach.</DialogDescription></DialogHeader>
    <label className="relative block"><Search className="absolute left-3 top-3 size-4 text-muted-foreground" /><span className="sr-only">Search trades</span><input autoFocus className={`${fieldClass} pl-9`} value={query} onChange={event => { setQuery(event.target.value); setPage(1); }} placeholder="Search by instrument or journal notes…" /></label>
    <div className="max-h-[45dvh] space-y-2 overflow-y-auto" aria-busy={loading}>
      {loading ? <p role="status" className="flex items-center gap-2 py-8 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" />Finding your trades…</p> : error ? <div role="alert"><p className="text-sm text-destructive">{error}</p><Button className="mt-2" variant="outline" onClick={() => setRetry(value => value + 1)}>Try again</Button></div> : !rows.length ? <p className="py-8 text-center text-sm text-muted-foreground">{query ? "No matching trades. Try another symbol or a word from your notes." : "No trades in this journal yet. You can still ask your coach to help with preparation or a trading goal."}</p> : rows.map(trade => <button type="button" key={trade.id} onClick={() => onSelect(trade)} className="flex w-full items-center justify-between gap-3 rounded-xl border border-border p-4 text-left transition-colors hover:border-primary/40 hover:bg-primary/5 focus-visible:ring-2 focus-visible:ring-primary">
        <span><span className="text-sm font-medium">{trade.asset?.symbol || trade.asset} · {trade.side}</span><span className="mt-1 block text-xs text-muted-foreground">{new Date(trade.entry_datetime).toLocaleString([], { timeZone: timezone, dateStyle: "medium", timeStyle: "short" })}</span></span>
        <span className="shrink-0 text-right"><span className="text-sm font-medium">{trade.pnl_r == null ? "Open" : `${Number(trade.pnl_r) > 0 ? "+" : ""}${Number(trade.pnl_r).toFixed(2)} R`}</span><span className="mt-1 block text-[11px] text-muted-foreground">Trade #{trade.id}</span></span>
      </button>)}
    </div>
    <div className="flex items-center justify-between gap-2"><Button variant="outline" disabled={loading || page === 1} onClick={() => setPage(value => value - 1)}>Previous</Button><span className="text-xs text-muted-foreground">Page {page}</span><Button variant="outline" disabled={loading || !(result?.next || (page * 20 < (result?.count || 0)))} onClick={() => setPage(value => value + 1)}>Next</Button></div>
  </DialogContent></Dialog>;
}
