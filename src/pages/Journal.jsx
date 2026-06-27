import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  BarChart3,
  BookOpen,
  Cable,
  FileUp,
  Layers,
  Plus,
  PlugZap,
  Search,
  Settings2,
  Trash2,
} from "lucide-react";

import AppShell from "@/components/layout/AppShell";
import { MT5ImportDialog } from "@/components/journal/MT5ImportDialog";
import TradeTable from "@/components/journal/TradeTable";
import TradePanel from "@/components/journal/TradePanel";
import AnalyticsPane from "@/components/hub/AnalyticsPane";
import HubHeader from "@/components/hub/HubHeader";
import KpiStrip from "@/components/hub/KpiStrip";
import MonthDetailDialog from "@/components/hub/MonthDetailDialog";
import StatsStrip from "@/components/hub/StatsStrip";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { createTrade, updateTrade, deleteTrade } from "@/api/trades.api";
import { useCareerData } from "@/hooks/useCareerData";
import { useHubAnalytics } from "@/hooks/useHubAnalytics";
import { useTrades } from "@/hooks/useTrades";
import { useAuth } from "@/auth/useAuth";
import { useJournal } from "@/journals/useJournal";
import { useJournalCatalog } from "@/journals/useJournalCatalog";
import { buildMergedSummary } from "@/lib/buildMergedSummary";
import { deriveStatus } from "@/lib/deriveStatus";

// ─── Constants ────────────────────────────────────────────────────────────────

const TABS = [
  { id: "trades",        label: "Trades"        },
  { id: "analytics",    label: "Analytics"      },
  { id: "custom-fields", label: "Custom Fields" },
];

const STATUS_FILTERS = [
  { value: "",     label: "All"        },
  { value: "OPEN", label: "Open"       },
  { value: "WIN",  label: "Wins"       },
  { value: "LOSS", label: "Losses"     },
  { value: "BE",   label: "Break Even" },
];

const JOURNAL_TYPE_LABEL = {
  trading: "Trading Journal",
  backtest: "Backtest Journal",
};

const BREAK_EVEN_LABEL = {
  ratio:  "Ratio Based",
  profit: "Profit Based",
};

function yearsLabel(selectedYears) {
  if (selectedYears.length === 0) return "All";
  if (selectedYears.length === 1) return String(selectedYears[0]);
  const sorted = [...selectedYears].sort((a, b) => a - b);
  return `${sorted[0]} – ${sorted[sorted.length - 1]}`;
}

// ─── Trades tab ───────────────────────────────────────────────────────────────

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

const PAGE_SIZE = 20;

function TradesTab({ breakEvenMethod, journalId, refreshKey }) {
  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page,         setPage]         = useState(1);
  // panel state: null = closed, { mode: 'create'|'edit', trade: null|obj }
  const [panel, setPanel] = useState(null);

  const { activeWorkspace } = useJournal();
  const workspaceId = activeWorkspace?.id;

  // Reset to page 1 whenever the search query changes
  useEffect(() => { setPage(1); }, [search]);

  const { data: tradesData, loading: tradesLoading, refetch } = useTrades({ search, page });

  const prevRefreshKey = useRef(refreshKey);
  useEffect(() => {
    if (refreshKey !== prevRefreshKey.current) {
      prevRefreshKey.current = refreshKey;
      setPage(1);
      refetch();
    }
  }, [refreshKey, refetch]);

  const trades     = tradesData?.results ?? [];
  const totalCount = tradesData?.count   ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const catalog = useJournalCatalog(journalId);

  const filtered = useMemo(() => {
    if (!statusFilter) return trades;
    return trades.filter((t) => deriveStatus(t) === statusFilter);
  }, [trades, statusFilter]);

  const hasFilters = !!search || !!statusFilter;

  async function handleSave(payload) {
    let result;
    if (panel?.mode === "edit") {
      result = await updateTrade(workspaceId, panel.trade.id, payload);
    } else {
      result = await createTrade(workspaceId, payload);
    }
    refetch();
    return result;
  }

  async function handleDelete(id) {
    await deleteTrade(workspaceId, id);
    refetch();
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative max-w-xs flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-zinc-500" />
          <Input
            placeholder="Search asset…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 border-zinc-800 bg-zinc-900/60 pl-8 text-sm placeholder:text-zinc-600 focus-visible:ring-emerald-500/30"
          />
        </div>

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

        <div className="ml-auto flex shrink-0 items-center gap-3">
          {!tradesLoading && (
            <span className="text-xs text-zinc-600">
              {statusFilter
                ? `${filtered.length} shown of ${totalCount}`
                : totalCount}{" "}
              {totalCount === 1 ? "trade" : "trades"}
            </span>
          )}
          <Button
            size="sm"
            onClick={() => setPanel({ mode: "create", trade: null })}
          >
            <Plus className="size-3.5" />
            New Trade
          </Button>
        </div>
      </div>

      {/* Table */}
      {tradesLoading ? (
        <TableSkeleton />
      ) : filtered.length === 0 ? (
        <EmptyTrades hasFilters={hasFilters} />
      ) : (
        <TradeTable
          trades={filtered}
          breakEvenMethod={breakEvenMethod}
          onRowClick={(trade) => setPanel({ mode: "edit", trade })}
          journalId={journalId}
        />
      )}

      {/* Pagination */}
      {!tradesLoading && totalPages > 1 && (
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-zinc-500">
            Page {page} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              Previous
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Trade panel */}
      <TradePanel
        mode={panel?.mode ?? "create"}
        trade={panel?.trade ?? null}
        open={panel !== null}
        onClose={() => setPanel(null)}
        onSave={handleSave}
        onDelete={handleDelete}
        catalog={catalog}
        journalId={workspaceId}
      />
    </div>
  );
}

// ─── Analytics tab ────────────────────────────────────────────────────────────

function AnalyticsTab({
  jLoading,
  selectedYears, setSelectedYears,
  openMonth, setOpenMonth,
  yearAnalytics, monthAnalytics, latestMonthAnalytics,
  loading, error, refetch, hasData, availableYears,
  mergedSummary,
}) {
  const isLoading = jLoading || loading;

  const handleYearToggle = (year) =>
    setSelectedYears((prev) =>
      prev.includes(year)
        ? prev.filter((y) => y !== year)
        : [...prev, year].sort((a, b) => a - b)
    );

  const handleCellClick = (year, month) =>
    setOpenMonth((prev) =>
      prev?.year === year && prev?.month === month ? null : { year, month }
    );

  const label = yearsLabel(selectedYears);

  // Error state — shown instead of empty state when the fetch itself failed
  if (!isLoading && error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-zinc-800 py-20 text-center">
        <div className="flex size-12 items-center justify-center rounded-xl bg-zinc-900 ring-1 ring-zinc-800">
          <BarChart3 className="size-5 text-zinc-600" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-zinc-300">Failed to load analytics</p>
          <p className="max-w-xs text-zinc-600">{error}</p>
        </div>
        <Button size="sm" variant="outline" onClick={refetch}>
          Retry
        </Button>
      </div>
    );
  }

  if (!isLoading && !hasData) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-zinc-800 py-20 text-center">
        <div className="flex size-12 items-center justify-center rounded-xl bg-zinc-900 ring-1 ring-zinc-800">
          <BarChart3 className="size-5 text-zinc-600" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-zinc-300">No data yet</p>
          <p className="max-w-xs text-xs text-zinc-600">
            Add closed trades to this journal to see your analytics and performance charts.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <HubHeader selectedYears={selectedYears} onYearsChange={setSelectedYears} availableYears={availableYears} />
        <KpiStrip summary={mergedSummary ?? yearAnalytics?.summary} loading={isLoading} />
        <StatsStrip summary={mergedSummary} loading={isLoading} />
        <AnalyticsPane
          yearEquityCurve={yearAnalytics?.equityCurve ?? []}
          yearRPerTrade={yearAnalytics?.rPerTrade ?? []}
          yearAnalytics={yearAnalytics}
          latestMonthAnalytics={latestMonthAnalytics}
          yearsLabel={label}
          selectedYears={selectedYears}
          openMonth={openMonth}
          onCellClick={handleCellClick}
          onYearToggle={handleYearToggle}
        />
      </div>

      <MonthDetailDialog
        open={openMonth !== null}
        onClose={() => setOpenMonth(null)}
        year={openMonth?.year}
        month={openMonth?.month}
        monthAnalytics={monthAnalytics}
        loading={loading}
      />
    </>
  );
}

// ─── Custom Fields tab ────────────────────────────────────────────────────────

function CustomFieldsTab() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-zinc-800 py-20 text-center">
      <div className="flex size-12 items-center justify-center rounded-xl bg-zinc-900 ring-1 ring-zinc-800">
        <Layers className="size-5 text-zinc-600" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-zinc-300">Custom field analytics</p>
        <p className="max-w-xs text-xs text-zinc-600">
          Breakdowns by your custom trade fields are coming soon.
        </p>
      </div>
    </div>
  );
}

// ─── Settings dialog ──────────────────────────────────────────────────────────

function SettingsDialog({ open, onClose, journal }) {
  const { updateJournal } = useJournal();
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  // Local form state — reinitialised each time the dialog opens
  const [name,            setName]            = useState("");
  const [currency,        setCurrency]        = useState("");
  const [startingCapital, setStartingCapital] = useState("");
  const [journalType,     setJournalType]     = useState("trading");
  const [breakEvenMethod, setBreakEvenMethod] = useState("ratio");
  const [breakEvenValue,  setBreakEvenValue]  = useState("");

  // Reset form fields from journal prop whenever dialog opens
  useEffect(() => {
    if (!open || !journal) return;
    setName(journal.name ?? "");
    setCurrency(journal.currency ?? "");
    setStartingCapital(journal.startingCapital != null ? String(journal.startingCapital) : "");
    setJournalType(journal.journalType ?? "trading");
    setBreakEvenMethod(journal.breakEvenMethod ?? "ratio");
    setBreakEvenValue(journal.breakEvenValue != null ? String(journal.breakEvenValue) : "");
    setSaveError(null);
  }, [open, journal]);

  const handleSave = async () => {
    if (!journal) return;
    setSaving(true);
    setSaveError(null);
    try {
      await updateJournal(journal.id, {
        name:           name.trim() || journal.name,
        currency:       currency.trim() || undefined,
        startingCapital: startingCapital !== "" ? Number(startingCapital) : undefined,
        journalType:    journalType  || undefined,
        breakEvenMethod: breakEvenMethod || undefined,
        breakEvenValue: breakEvenValue !== "" ? Number(breakEvenValue) : undefined,
      });
      onClose();
    } catch (err) {
      setSaveError(err?.response?.data?.detail ?? err.message ?? "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const fieldClass = "w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-emerald-500/50";
  const selectClass = fieldClass;
  const labelClass  = "text-xs font-medium text-zinc-500";

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="border-zinc-800 bg-zinc-950 sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Journal Settings</DialogTitle>
          <DialogDescription className="sr-only">Edit journal configuration.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* Name */}
          <div className="space-y-1.5">
            <label className={labelClass}>Name</label>
            <input className={fieldClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="Journal name" />
          </div>

          {/* Type */}
          <div className="space-y-1.5">
            <label className={labelClass}>Type</label>
            <select className={selectClass} value={journalType} onChange={(e) => setJournalType(e.target.value)}>
              <option value="trading">Trading Journal</option>
              <option value="backtest">Backtest Journal</option>
            </select>
          </div>

          {/* Currency + Starting Capital side by side */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className={labelClass}>Currency</label>
              <input className={fieldClass} value={currency} onChange={(e) => setCurrency(e.target.value)} placeholder="USD" maxLength={6} />
            </div>
            <div className="space-y-1.5">
              <label className={labelClass}>Starting Capital</label>
              <input className={fieldClass} type="number" min="0" value={startingCapital} onChange={(e) => setStartingCapital(e.target.value)} placeholder="0" />
            </div>
          </div>

          {/* Break-Even Method + Threshold */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className={labelClass}>Break-Even Method</label>
              <select className={selectClass} value={breakEvenMethod} onChange={(e) => setBreakEvenMethod(e.target.value)}>
                <option value="ratio">Ratio Based</option>
                <option value="profit">Profit Based</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className={labelClass}>BE Threshold {breakEvenMethod === "profit" ? `(${currency || "currency"})` : "(R)"}</label>
              <input className={fieldClass} type="number" step="0.01" value={breakEvenValue} onChange={(e) => setBreakEvenValue(e.target.value)} placeholder="0" />
            </div>
          </div>
        </div>

        {saveError && <p className="text-sm text-destructive">{saveError}</p>}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Broker Connections dialog ────────────────────────────────────────────────

function BrokerConnectionsDialog({ open, onClose }) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="border-zinc-800 bg-zinc-950 sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Broker Connections</DialogTitle>
          <DialogDescription className="sr-only">
            Connect your broker accounts.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <div className="flex size-12 items-center justify-center rounded-xl bg-zinc-900 ring-1 ring-zinc-800">
            <PlugZap className="size-5 text-zinc-600" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-zinc-300">Broker synchronization</p>
            <p className="max-w-xs text-xs text-zinc-600">
              Automatic broker sync is coming soon. Trades will be imported directly from MT4/MT5.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Journal() {
  const { journalId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { loading: authLoading } = useAuth();
  const {
    journals,
    activeJournal,
    selectJournal,
    deleteJournal,
    loading: jLoading,
  } = useJournal();

  // Tab is stored in the URL so it survives page refresh
  const activeTab = searchParams.get("tab") ?? "trades";
  function setActiveTab(tab) {
    setSearchParams({ tab }, { replace: true });
  }

  // Analytics state lives here so data survives tab switches and any
  // AnalyticsTab re-mount; it can only be lost on full route navigation.
  const [selectedYears, setSelectedYears] = useState([]);
  const [openMonth,     setOpenMonth]     = useState(null);
  const {
    yearAnalytics, monthAnalytics, latestMonthAnalytics,
    loading: analyticsLoading, error: analyticsError,
    refetch: analyticsRefetch, hasData: analyticsHasData,
    availableYears,
  } = useHubAnalytics({ selectedYears, openMonth });

  const { data: careerData } = useCareerData();

  const mergedSummary = useMemo(
    () => buildMergedSummary(yearAnalytics?.summary, careerData, selectedYears),
    [yearAnalytics?.summary, careerData, selectedYears]
  );

  const [settingsOpen,     setSettingsOpen]     = useState(false);
  const [brokerOpen,       setBrokerOpen]       = useState(false);
  const [importOpen,       setImportOpen]       = useState(false);
  const [deleteOpen,       setDeleteOpen]       = useState(false);
  const [deleting,         setDeleting]         = useState(false);
  const [deleteError,      setDeleteError]      = useState(null);
  const [tradesRefreshKey, setTradesRefreshKey] = useState(0);

  const handleDelete = async () => {
    if (!activeJournal) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteJournal(activeJournal.id);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setDeleteError(err?.response?.data?.detail ?? err.message ?? "Failed to delete journal");
      setDeleting(false);
    }
  };

  // Sync active journal when URL param changes.
  // Guard on both auth AND journal loading to avoid premature redirect to /dashboard
  // when the page refreshes and journals haven't been fetched yet.
  useEffect(() => {
    if (authLoading || jLoading) return;
    const j = journals.find((j) => String(j.id) === journalId);
    if (j) {
      selectJournal(j);
    } else if (journals.length > 0) {
      navigate(`/journal/${journals[0].id}`, { replace: true });
    } else {
      navigate("/dashboard", { replace: true });
    }
  }, [journalId, journals, jLoading, authLoading, navigate, selectJournal]);

  const typeLabel = activeJournal
    ? (JOURNAL_TYPE_LABEL[activeJournal.journalType] ?? "Journal")
    : null;

  const breakEvenMethod = activeJournal?.breakEvenMethod ?? "ratio";

  return (
    <AppShell>
      <div className="space-y-0">

        {/* ── Journal header ── */}
        <div className="flex items-start justify-between gap-4 pb-5">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-semibold tracking-tight truncate">
                {activeJournal?.name ?? "Journal"}
              </h1>
              {typeLabel && (
                <span className="shrink-0 rounded-full bg-zinc-800 px-2 py-0.5 text-[11px] font-medium text-zinc-400">
                  {typeLabel}
                </span>
              )}
            </div>
            {activeJournal?.currency && activeJournal?.startingCapital != null && (
              <p className="mt-0.5 text-sm text-zinc-500">
                {activeJournal.currency} · {Number(activeJournal.startingCapital).toLocaleString()} starting capital
                {activeJournal.breakEvenMethod && (
                  <> · {BREAK_EVEN_LABEL[activeJournal.breakEvenMethod]} break-even</>
                )}
              </p>
            )}
          </div>

          {/* Gear icon */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0" aria-label="Journal settings">
                <Settings2 className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={() => setSettingsOpen(true)}>
                <Settings2 className="size-3.5" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setBrokerOpen(true)}>
                <Cable className="size-3.5" />
                Broker Connections
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setImportOpen(true)}>
                <FileUp className="size-3.5" />
                Import MT5 Report
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => { setDeleteError(null); setDeleteOpen(true); }}
              >
                <Trash2 className="size-3.5" />
                Delete Journal
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* ── Tab navigation ── */}
        <div className="flex border-b border-zinc-800/60">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative px-4 py-2.5 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "text-zinc-100 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-emerald-500 after:content-['']"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Tab content ──
             All three panels stay mounted so data isn't lost on tab switches.
             CSS `hidden` hides the inactive ones without unmounting them. */}
        <div className="pt-5">
          <div className={activeTab !== "trades" ? "hidden" : ""}>
            <TradesTab
              breakEvenMethod={breakEvenMethod}
              journalId={activeJournal?.id}
              refreshKey={tradesRefreshKey}
            />
          </div>
          <div className={activeTab !== "analytics" ? "hidden" : ""}>
            <AnalyticsTab
              jLoading={jLoading}
              selectedYears={selectedYears}
              setSelectedYears={setSelectedYears}
              openMonth={openMonth}
              setOpenMonth={setOpenMonth}
              yearAnalytics={yearAnalytics}
              monthAnalytics={monthAnalytics}
              latestMonthAnalytics={latestMonthAnalytics}
              loading={analyticsLoading}
              error={analyticsError}
              refetch={analyticsRefetch}
              hasData={analyticsHasData}
              availableYears={availableYears}
              mergedSummary={mergedSummary}
            />
          </div>
          <div className={activeTab !== "custom-fields" ? "hidden" : ""}>
            <CustomFieldsTab />
          </div>
        </div>

      </div>

      <SettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        journal={activeJournal}
      />
      <BrokerConnectionsDialog
        open={brokerOpen}
        onClose={() => setBrokerOpen(false)}
      />
      <MT5ImportDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        journal={activeJournal}
        onSuccess={() => setTradesRefreshKey((k) => k + 1)}
      />

      <Dialog open={deleteOpen} onOpenChange={(v) => !v && setDeleteOpen(false)}>
        <DialogContent className="border-zinc-800 bg-zinc-950 sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete &ldquo;{activeJournal?.name}&rdquo;?</DialogTitle>
            <DialogDescription>
              All trades, analytics, and catalog data will be permanently deleted.
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {deleteError && <p className="text-sm text-destructive">{deleteError}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
