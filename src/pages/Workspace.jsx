import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { BookOpen, Plus, Search } from "lucide-react";

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import TradeJournalEntry from "@/components/journal/TradeJournalEntry";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useTrades } from "@/hooks/useTrades";
import { useWorkspace } from "@/workspaces/useWorkspace";

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_FILTERS = [
  { value: "",     label: "All" },
  { value: "OPEN", label: "Open" },
  { value: "WIN",  label: "Wins" },
  { value: "LOSS", label: "Losses" },
  { value: "BE",   label: "Break Even" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function groupByDate(trades) {
  const map = new Map();
  trades.forEach((t) => {
    const date = t.entry_datetime.slice(0, 10);
    if (!map.has(date)) map.set(date, []);
    map.get(date).push(t);
  });
  return [...map.entries()].map(([date, entries]) => ({ date, entries }));
}

function formatGroupDate(dateStr) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString(undefined, {
    weekday: "long",
    year:    "numeric",
    month:   "long",
    day:     "numeric",
  });
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function JournalSkeleton() {
  return (
    <div className="space-y-6">
      {[0, 1].map((g) => (
        <div key={g} className="space-y-2">
          <Skeleton className="h-4 w-48" />
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
        </div>
      ))}
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ hasFilters }) {
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
            : "Add your first trade to start building your journal."}
        </p>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Workspace() {
  const { workspaceId }                     = useParams();
  const navigate                            = useNavigate();
  const { workspaces, activeWorkspace, selectWorkspace, loading: wsLoading } = useWorkspace();

  // Sync workspace selection when the URL param changes
  useEffect(() => {
    if (wsLoading) return;
    const ws = workspaces.find((w) => String(w.id) === workspaceId);
    if (ws) {
      selectWorkspace(ws);
    } else if (workspaces.length > 0) {
      navigate(`/workspace/${workspaces[0].id}`, { replace: true });
    } else {
      navigate("/dashboard", { replace: true });
    }
  }, [workspaceId, workspaces, wsLoading, navigate, selectWorkspace]);

  // Filter state
  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Fetch trades (search is server-side; status is client-side for instant response)
  const { data: tradesData, loading: tradesLoading } = useTrades({ search });

  const trades = tradesData?.results ?? [];

  // Client-side status filter + group by date
  const grouped = useMemo(() => {
    const filtered = statusFilter
      ? trades.filter((t) => t.status === statusFilter)
      : trades;
    return groupByDate(filtered);
  }, [trades, statusFilter]);

  const hasFilters    = !!search || !!statusFilter;
  const totalFiltered = grouped.reduce((n, g) => n + g.entries.length, 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {activeWorkspace?.name ?? "Journal"}
            </h1>
            <p className="text-sm text-zinc-500 mt-0.5">
              Trading journal — your personal trade log and reflections
            </p>
          </div>
          <Button size="sm" className="shrink-0" disabled>
            <Plus className="size-4" />
            New Trade
          </Button>
        </div>

        {/* ── Filters ── */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-zinc-500 pointer-events-none" />
            <Input
              placeholder="Search asset or setup…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 bg-zinc-900/60 border-zinc-800 text-sm placeholder:text-zinc-600 focus-visible:ring-emerald-500/30"
            />
          </div>

          {/* Status pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  statusFilter === f.value
                    ? "bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30"
                    : "bg-zinc-800/60 text-zinc-400 hover:bg-zinc-700/60 hover:text-zinc-200"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Count */}
          {!tradesLoading && (
            <span className="ml-auto text-xs text-zinc-600 shrink-0">
              {totalFiltered} {totalFiltered === 1 ? "trade" : "trades"}
            </span>
          )}
        </div>

        {/* ── Journal entries ── */}
        {tradesLoading ? (
          <JournalSkeleton />
        ) : grouped.length === 0 ? (
          <EmptyState hasFilters={hasFilters} />
        ) : (
          <div className="space-y-8">
            {grouped.map(({ date, entries }) => (
              <div key={date} className="space-y-2">
                {/* Date heading */}
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                    {formatGroupDate(date)}
                  </span>
                  <div className="flex-1 h-px bg-zinc-800/60" />
                  <span className="text-[10px] text-zinc-700">
                    {entries.length} {entries.length === 1 ? "trade" : "trades"}
                  </span>
                </div>

                {/* Trade cards for this day */}
                <div className="space-y-1.5">
                  {entries.map((trade) => (
                    <TradeJournalEntry key={trade.id} trade={trade} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
