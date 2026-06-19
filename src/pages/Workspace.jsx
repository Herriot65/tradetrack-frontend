import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { BookOpen, Plus, Search } from "lucide-react";

import AppShell from "@/components/layout/AppShell";
import TradeTable from "@/components/journal/TradeTable";
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

// ─── Loading skeleton ─────────────────────────────────────────────────────────

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
            : "Trades will appear here once synced from MT5."}
        </p>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Workspace() {
  const { workspaceId }   = useParams();
  const navigate          = useNavigate();
  const { workspaces, activeWorkspace, selectWorkspace, loading: wsLoading } = useWorkspace();

  // Sync workspace selection when URL param changes
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

  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Search is server-side; status is client-side for instant response
  const { data: tradesData, loading: tradesLoading } = useTrades({ search });
  const trades = tradesData?.results ?? [];

  const filtered = useMemo(() => {
    if (!statusFilter) return trades;
    return trades.filter((t) => t.status === statusFilter);
  }, [trades, statusFilter]);

  const hasFilters = !!search || !!statusFilter;

  return (
    <AppShell>
      <div className="space-y-5">

        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {activeWorkspace?.name ?? "Journal"}
            </h1>
            <p className="mt-0.5 text-sm text-zinc-500">
              MT5 execution history — review and annotate your trades
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
          <div className="relative max-w-xs flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-zinc-500" />
            <Input
              placeholder="Search asset or setup…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 border-zinc-800 bg-zinc-900/60 pl-8 text-sm placeholder:text-zinc-600 focus-visible:ring-emerald-500/30"
            />
          </div>

          {/* Account filter (placeholder — multi-account support coming) */}
          <select
            disabled
            title="Account filter — coming soon"
            className="h-8 cursor-not-allowed rounded-md border border-zinc-800/60 bg-zinc-900/60 px-2.5 text-xs text-zinc-600"
          >
            <option>All Accounts</option>
          </select>

          {/* Status pills */}
          <div className="flex flex-wrap items-center gap-1.5">
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

          {!tradesLoading && (
            <span className="ml-auto shrink-0 text-xs text-zinc-600">
              {filtered.length} {filtered.length === 1 ? "trade" : "trades"}
            </span>
          )}
        </div>

        {/* ── Table ── */}
        {tradesLoading ? (
          <TableSkeleton />
        ) : filtered.length === 0 ? (
          <EmptyState hasFilters={hasFilters} />
        ) : (
          <TradeTable trades={filtered} />
        )}

      </div>
    </AppShell>
  );
}
