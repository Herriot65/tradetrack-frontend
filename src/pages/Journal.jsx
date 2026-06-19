import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  BookOpen,
  Cable,
  Layers,
  PlugZap,
  Search,
  Settings2,
} from "lucide-react";

import AppShell from "@/components/layout/AppShell";
import TradeTable from "@/components/journal/TradeTable";
import AnalyticsPane from "@/components/hub/AnalyticsPane";
import HubHeader from "@/components/hub/HubHeader";
import KpiStrip from "@/components/hub/KpiStrip";
import MonthDetailDialog from "@/components/hub/MonthDetailDialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useHubAnalytics } from "@/hooks/useHubAnalytics";
import { useTrades } from "@/hooks/useTrades";
import { useJournal } from "@/journals/useJournal";

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

function TradesTab({ breakEvenMethod }) {
  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const { data: tradesData, loading: tradesLoading } = useTrades({ search });
  const trades = tradesData?.results ?? [];

  const filtered = useMemo(() => {
    if (!statusFilter) return trades;
    // Status filter uses derived status: re-derive here for consistency
    const method = breakEvenMethod ?? "ratio";
    return trades.filter((t) => {
      if (t.pnl_r === null || t.pnl_r === undefined) {
        return statusFilter === "OPEN";
      }
      const r = parseFloat(t.pnl_r);
      let derived;
      if (method === "profit" && t.pnl != null) {
        const pnl = parseFloat(t.pnl);
        derived = pnl > 0 ? "WIN" : pnl < 0 ? "LOSS" : "BE";
      } else {
        derived = r > 0 ? "WIN" : r < 0 ? "LOSS" : "BE";
      }
      return derived === statusFilter;
    });
  }, [trades, statusFilter, breakEvenMethod]);

  const hasFilters = !!search || !!statusFilter;

  return (
    <div className="space-y-4">
      {/* Filters */}
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

        {!tradesLoading && (
          <span className="ml-auto shrink-0 text-xs text-zinc-600">
            {filtered.length} {filtered.length === 1 ? "trade" : "trades"}
          </span>
        )}
      </div>

      {/* Table */}
      {tradesLoading ? (
        <TableSkeleton />
      ) : filtered.length === 0 ? (
        <EmptyTrades hasFilters={hasFilters} />
      ) : (
        <TradeTable trades={filtered} breakEvenMethod={breakEvenMethod} />
      )}
    </div>
  );
}

// ─── Analytics tab ────────────────────────────────────────────────────────────

function AnalyticsTab() {
  const [selectedYears, setSelectedYears] = useState([]);
  const [openMonth,     setOpenMonth]     = useState(null);

  const { yearAnalytics, monthAnalytics, latestMonthAnalytics, loading } =
    useHubAnalytics({ selectedYears, openMonth });

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

  return (
    <>
      <div className="space-y-6">
        <HubHeader selectedYears={selectedYears} onYearsChange={setSelectedYears} />
        <KpiStrip summary={yearAnalytics?.summary} loading={loading} />
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
  const rows = [
    { label: "Name",              value: journal?.name },
    { label: "Type",              value: JOURNAL_TYPE_LABEL[journal?.journalType] ?? "—" },
    { label: "Starting Capital",  value: journal?.startingCapital != null ? `${journal.currency ?? ""} ${Number(journal.startingCapital).toLocaleString()}`.trim() : "—" },
    { label: "Currency",          value: journal?.currency ?? "—" },
    { label: "Break-Even Method", value: BREAK_EVEN_LABEL[journal?.breakEvenMethod] ?? "—" },
  ];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="border-zinc-800 bg-zinc-950 sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Journal Settings</DialogTitle>
          <DialogDescription className="sr-only">
            Journal configuration details.
          </DialogDescription>
        </DialogHeader>
        <div className="divide-y divide-zinc-800/60">
          {rows.map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between py-3">
              <span className="text-sm text-zinc-500">{label}</span>
              <span className="text-sm font-medium text-zinc-200">{value ?? "—"}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-zinc-600">Editing journal settings is coming soon.</p>
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
  const {
    journals,
    activeJournal,
    selectJournal,
    loading: jLoading,
  } = useJournal();

  const [activeTab,     setActiveTab]     = useState("trades");
  const [settingsOpen,  setSettingsOpen]  = useState(false);
  const [brokerOpen,    setBrokerOpen]    = useState(false);

  // Sync active journal when URL param changes
  useEffect(() => {
    if (jLoading) return;
    const j = journals.find((j) => String(j.id) === journalId);
    if (j) {
      selectJournal(j);
    } else if (journals.length > 0) {
      navigate(`/journal/${journals[0].id}`, { replace: true });
    } else {
      navigate("/dashboard", { replace: true });
    }
  }, [journalId, journals, jLoading, navigate, selectJournal]);

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

        {/* ── Tab content ── */}
        <div className="pt-5">
          {activeTab === "trades" && (
            <TradesTab breakEvenMethod={breakEvenMethod} />
          )}
          {activeTab === "analytics" && <AnalyticsTab />}
          {activeTab === "custom-fields" && <CustomFieldsTab />}
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
    </AppShell>
  );
}
