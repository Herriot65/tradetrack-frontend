import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  Cable,
  FileUp,
  PlugZap,
  Settings2,
  Trash2,
} from "lucide-react";

import AppShell from "@/components/layout/AppShell";
import { MT5ImportDialog } from "@/components/journal/MT5ImportDialog";
import CustomFieldsTab from "@/components/journal/CustomFieldsTab";
import TradesTab from "@/components/journal/TradesTab";
import JournalAnalyticsTab from "@/components/analytics/AnalyticsTab";
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
import { useAuth } from "@/auth/useAuth";
import { useJournal } from "@/journals/useJournal";

// ─── Constants ────────────────────────────────────────────────────────────────

const TABS = [
  { id: "trades",        label: "Trades"        },
  { id: "analytics",    label: "Analytics"      },
  { id: "custom-fields", label: "Custom Fields" },
];

const JOURNAL_TYPE_LABEL = {
  trading: "Trading Journal",
  backtest: "Backtest Journal",
};

const BREAK_EVEN_LABEL = {
  ratio:  "Ratio Based",
  profit: "Profit Based",
};

// ─── Trades tab ───────────────────────────────────────────────────────────────

// ─── Analytics tab ────────────────────────────────────────────────────────────

// ─── Custom Fields tab ────────────────────────────────────────────────────────


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

  const fieldClass = "w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-400/40";
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
    setSyntheticData,
    loading: jLoading,
  } = useJournal();

  // Tab is stored in the URL so it survives page refresh
  const activeTab = searchParams.get("tab") ?? "trades";
  function setActiveTab(tab) {
    setSearchParams({ tab }, { replace: true });
  }

  const [settingsOpen,     setSettingsOpen]     = useState(false);
  const [brokerOpen,       setBrokerOpen]       = useState(false);
  const [importOpen,       setImportOpen]       = useState(false);
  const [deleteOpen,       setDeleteOpen]       = useState(false);
  const [deleting,         setDeleting]         = useState(false);
  const [deleteError,      setDeleteError]      = useState(null);
  const [tradesRefreshKey, setTradesRefreshKey] = useState(0);
  const [syntheticBusy,    setSyntheticBusy]    = useState(false);
  const [syntheticError,   setSyntheticError]   = useState(null);

  const syntheticEnabled = !!activeJournal?.synthetic_data_enabled;

  const handleToggleSynthetic = async (enabled) => {
    if (!activeJournal) return;
    setSyntheticBusy(true);
    setSyntheticError(null);
    try {
      await setSyntheticData(activeJournal.id, enabled);
      setTradesRefreshKey((k) => k + 1);
    } catch (err) {
      setSyntheticError(
        err?.response?.data?.error ??
          err?.response?.data?.detail ??
          err.message ??
          "Failed to update sample data"
      );
    } finally {
      setSyntheticBusy(false);
    }
  };

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
                {activeJournal.currency} · {Number(activeJournal.startingCapital).toLocaleString(undefined, { style: "currency", currency: activeJournal.currency, maximumFractionDigits: 2 })} starting capital
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
                  ? "text-zinc-100 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-zinc-300 after:content-['']"
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
            <TradesTab key={`${activeJournal?.id}-${tradesRefreshKey}`}
              breakEvenMethod={breakEvenMethod}
              journalId={activeJournal?.id}
              refreshKey={tradesRefreshKey}
            />
          </div>
          <div className={activeTab !== "analytics" ? "hidden" : ""}>
            <JournalAnalyticsTab
              journal={activeJournal}
              jLoading={jLoading}
              syntheticEnabled={syntheticEnabled}
              syntheticBusy={syntheticBusy}
              syntheticError={syntheticError}
              onToggleSynthetic={handleToggleSynthetic}
            />
          </div>
          <div className={activeTab !== "custom-fields" ? "hidden" : ""}>
            <CustomFieldsTab journalId={activeJournal?.id} active={activeTab === "custom-fields"} />
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
