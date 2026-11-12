import { getLanguage, translate as t } from "@/i18n/language";
import { useLanguage } from "@/i18n/useLanguage";
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  FileUp,
  Settings2,
  Trash2,
  ChartNoAxesCombined,
  SlidersHorizontal,
  ChartNoAxesColumn,
} from "lucide-react";

import AppShell from "@/components/layout/AppShell";
import { MT5ImportDialog } from "@/components/journal/MT5ImportDialog";
import OverviewTab from "@/components/journal/OverviewTab";
import UserSettings from "@/components/layout/UserSettings";
import BreakdownTab from "@/components/journal/BreakdownTab";
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
import { useAuth } from "@/auth/useAuth";
import { useJournal } from "@/journals/useJournal";

// ─── Constants ────────────────────────────────────────────────────────────────

const SECTION_TABS = {
  analytics: [{id:'analytics',label:'Performance',icon:ChartNoAxesCombined},{id:'breakdown',label:'Breakdown',icon:ChartNoAxesColumn}],
  settings: [{id:'settings',label:'Account',icon:Settings2},{id:'custom-fields',label:'Custom Fields',icon:SlidersHorizontal}],
};

const JOURNAL_TYPE_LABEL = {
  trading: "Trading Journal",
  backtest: "Backtest Journal",
};

const BREAK_EVEN_LABEL = {
  ratio: "Ratio Based",
  profit: "Profit Based",
};

// ─── Trades tab ───────────────────────────────────────────────────────────────

// ─── Analytics tab ────────────────────────────────────────────────────────────

// ─── Custom Fields tab ────────────────────────────────────────────────────────

// ─── Settings dialog ──────────────────────────────────────────────────────────

function SettingsDialog({ open, onClose, journal }) {
  useLanguage();
  const { updateJournal } = useJournal();
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  // Local form state — reinitialised each time the dialog opens
  const [name, setName] = useState("");
  const [currency, setCurrency] = useState("");
  const [startingCapital, setStartingCapital] = useState("");
  const [journalType, setJournalType] = useState("trading");
  const [breakEvenMethod, setBreakEvenMethod] = useState("ratio");
  const [breakEvenValue, setBreakEvenValue] = useState("");

  // Reset form fields from journal prop whenever dialog opens
  useEffect(() => {
    if (!open || !journal) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Reset the editable settings draft from the selected journal on opening.
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
        name: name.trim() || journal.name,
        currency: currency.trim() || undefined,
        startingCapital: startingCapital !== "" ? Number(startingCapital) : undefined,
        journalType: journalType || undefined,
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

  const fieldClass =
    "w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-400/40";
  const selectClass = fieldClass;
  const labelClass = "text-xs font-medium text-zinc-500";

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="border-zinc-800 bg-zinc-950 sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("Journal Settings")}</DialogTitle>
          <DialogDescription className="sr-only">{t("Edit journal configuration.")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* Name */}
          <div className="space-y-1.5">
            <label className={labelClass}>{t("Name")}</label>
            <input
              className={fieldClass}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("Journal name")}
            />
          </div>

          {/* Type */}
          <div className="space-y-1.5">
            <label className={labelClass}>{t("Type")}</label>
            <select
              className={selectClass}
              value={journalType}
              onChange={(e) => setJournalType(e.target.value)}
            >
              <option value="trading">{t("Trading Journal")}</option>
              <option value="backtest">{t("Backtest Journal")}</option>
            </select>
          </div>

          {/* Currency + Starting Capital side by side */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className={labelClass}>{t("Currency")}</label>
              <input
                className={fieldClass}
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                placeholder="USD"
                maxLength={6}
              />
            </div>
            <div className="space-y-1.5">
              <label className={labelClass}>{t("Starting Capital")}</label>
              <input
                className={fieldClass}
                type="number"
                min="0"
                value={startingCapital}
                onChange={(e) => setStartingCapital(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          {/* Break-Even Method + Threshold */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className={labelClass}>{t("Break-Even Method")}</label>
              <select
                className={selectClass}
                value={breakEvenMethod}
                onChange={(e) => setBreakEvenMethod(e.target.value)}
              >
                <option value="ratio">{t("Ratio Based")}</option>
                <option value="profit">{t("Profit Based")}</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className={labelClass}>{t("BE Threshold") + " "}{breakEvenMethod === "profit" ? `(${currency || "currency"})` : "(R)"}
              </label>
              <input
                className={fieldClass}
                type="number"
                step="0.01"
                value={breakEvenValue}
                onChange={(e) => setBreakEvenValue(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>
        </div>

        {saveError && <p className="text-sm text-destructive">{saveError}</p>}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>{t("Cancel")}</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? t("Saving…") : t("Save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Journal() {
  useLanguage();
  const { journalId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { loading: authLoading } = useAuth();
  const {
    journals,
    activeJournal: selectedJournal,
    selectJournal,
    deleteJournal,
    setSyntheticData,
    refreshAnalytics,
    loading: jLoading,
  } = useJournal();

  const activeJournal = journals.find(journal => String(journal.id) === journalId)
    ?? (String(selectedJournal?.id) === journalId ? selectedJournal : null);

  const accountReady = activeJournal && String(selectedJournal?.id) === journalId;

  // Tab is stored in the URL so it survives page refresh
  const requestedTab = searchParams.get("tab") ?? "trades";
  const activeTab = ['overview','trades','analytics','breakdown','settings','custom-fields'].includes(requestedTab) ? requestedTab : 'trades';
  const section = ['analytics','breakdown'].includes(activeTab) ? 'analytics' : ['settings','custom-fields'].includes(activeTab) ? 'settings' : activeTab === 'overview' ? 'overview' : 'journal';
  const sectionTitle = {overview:'Overview',journal:'Journal',analytics:'Analytics',settings:'Settings'}[section];
  const sectionDescription = {overview:'A clear view of your trading performance.',journal:'Review your trades and the decisions behind them.',analytics:'Understand your trading performance.',settings:'Manage your account and trading workspace.'}[section];
  function setActiveTab(tab) {
    setSearchParams(current => {const next = new URLSearchParams(current);next.set('tab',tab);return next;});
  }

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [tradesRefreshKey, setTradesRefreshKey] = useState(0);
  const [syntheticBusy, setSyntheticBusy] = useState(false);
  const [syntheticError, setSyntheticError] = useState(null);

  const syntheticEnabled = !!activeJournal?.synthetic_data_enabled;

  const handleToggleSynthetic = useCallback(async (enabled) => {
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
          "Failed to update sample data",
      );
    } finally {
      setSyntheticBusy(false);
    }
  }, [activeJournal, setSyntheticData, setTradesRefreshKey, setSyntheticBusy, setSyntheticError]);

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

  if (authLoading || jLoading || !activeJournal || String(activeJournal.id) !== journalId) {
    return <AppShell><p role="status">{t("Loading…")}</p></AppShell>;
  }

  const typeLabel = activeJournal
    ? (JOURNAL_TYPE_LABEL[activeJournal.journalType] ?? "Journal")
    : null;

  const breakEvenMethod = activeJournal?.breakEvenMethod ?? "ratio";

  return (
    <AppShell>
      <div className="space-y-0">
        {/* ── Journal header ── */}
        <div className="nx-page-header">
          <div className="min-w-0">
            <p className="nx-account-context"><span />{activeJournal.name}<span className="nx-context-slash">/</span>{t('Workspace')}</p>
            <div className="flex items-center gap-2.5">
              <h1 className="nx-page-title truncate">{t(sectionTitle)}</h1>
              {typeLabel && section === 'settings' && (
                <span className="shrink-0 rounded-md border border-border bg-card px-2 py-1 text-[10px] font-medium text-muted-foreground">
                  {t(typeLabel)}
                </span>
              )}
            </div>
            <p className="nx-subtitle">{t(sectionDescription)}</p>
            {section === 'settings' && activeJournal?.currency && activeJournal?.startingCapital != null && (
              <p className="mt-2 text-xs text-muted-foreground">
                {activeJournal.name} · {activeJournal.currency} ·{" "}
                {Number(activeJournal.startingCapital).toLocaleString(getLanguage(), {
                  style: "currency",
                  currency: activeJournal.currency,
                  maximumFractionDigits: 2,
                })}{" "}{t("starting capital")}{activeJournal.breakEvenMethod && (
                  <> · {t(BREAK_EVEN_LABEL[activeJournal.breakEvenMethod])}{" " + t("break-even")}</>
                )}
              </p>
            )}
          </div>

          {/* Gear icon */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0"
                aria-label={t("Journal settings")}
              >
                <Settings2 className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={() => setSettingsOpen(true)}>
                <Settings2 className="size-3.5" />{t("Settings")}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setImportOpen(true)}>
                <FileUp className="size-3.5" />{t("Import MT5 Report")}</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => {
                  setDeleteError(null);
                  setDeleteOpen(true);
                }}
              >
                <Trash2 className="size-3.5" />{t("Delete Journal")}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* ── Tab navigation ── */}
        <nav className="nx-tabs max-w-full overflow-x-auto" aria-label={t(section==='analytics'?'Analytics sections':'Settings sections')} hidden={!SECTION_TABS[section]}>
          {(SECTION_TABS[section] ?? []).map((tab) => (
            <button
              key={tab.id}
              type="button"
              aria-current={activeTab === tab.id ? "page" : undefined}
              onClick={() => setActiveTab(tab.id)}
              className="nx-tab shrink-0"
            >
              <tab.icon aria-hidden="true" className="size-3.5" />
              {t(tab.label)}
            </button>
          ))}
        </nav>

        {/* ── Tab content ──
             All panels stay mounted so data isn't lost on tab switches.
             CSS `hidden` hides the inactive ones without unmounting them. */}
        <div className={SECTION_TABS[section] ? 'pt-6' : ''}>
          {!accountReady && <div className="nx-surface p-8 text-sm text-muted-foreground" role="status">{t('Loading account…')}</div>}
          {accountReady && <>
          <div className="nx-panel-enter" hidden={activeTab !== 'overview'}>
            <OverviewTab key={activeJournal?.id} journal={activeJournal} jLoading={jLoading} onNavigate={setActiveTab} syntheticEnabled={syntheticEnabled}/>
          </div>
          <div hidden={activeTab !== 'settings'} className="nx-panel-enter grid gap-5 lg:grid-cols-2">
            <section className="nx-surface p-6"><h2 className="text-lg font-medium">{t('Journal Settings')}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{t('Configure the name, currency, starting capital and break-even rules for this account.')}</p><Button className="mt-5" variant="outline" onClick={()=>setSettingsOpen(true)}>{t('Edit account settings')}</Button></section>
            <section className="nx-surface p-6"><h2 className="text-lg font-medium">{t('Preferences')}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{t('Choose your appearance and the timezone used for trades.')}</p><Button className="mt-5" variant="outline" onClick={()=>setPreferencesOpen(true)}>{t('Edit preferences')}</Button></section>
            <section className="nx-surface p-6"><h2 className="text-lg font-medium">{t('Import MT5 Report')}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{t('Import an existing MetaTrader 5 report into this journal.')}</p><Button className="mt-5" variant="outline" onClick={()=>setImportOpen(true)}><FileUp className="size-4"/>{t('Import MT5 Report')}</Button></section>
            <section className="nx-surface p-6"><h2 className="text-lg font-medium">{t('Delete Journal')}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{t('All trades, analytics, and catalog data will be permanently deleted. This action cannot be undone.')}</p><Button className="mt-5" variant="outline" onClick={()=>{setDeleteError(null);setDeleteOpen(true);}}>{t('Delete Journal')}</Button></section>
          </div>
          <div className={activeTab !== "trades" ? "hidden" : "nx-panel-enter"}>
            <TradesTab
              key={`${activeJournal?.id}-${tradesRefreshKey}`}
              breakEvenMethod={breakEvenMethod}
              journalId={activeJournal?.id}
              refreshKey={tradesRefreshKey}
            />
          </div>
          <div className={activeTab !== "analytics" ? "hidden" : "nx-panel-enter"}>
            <JournalAnalyticsTab
              embedded
              journal={activeJournal}
              jLoading={jLoading}
              syntheticEnabled={syntheticEnabled}
              syntheticBusy={syntheticBusy}
              syntheticError={syntheticError}
              onToggleSynthetic={handleToggleSynthetic}
            />
          </div>
          <div className={activeTab !== "breakdown" ? "hidden" : "nx-panel-enter"}>
            <BreakdownTab key={activeJournal?.id} journal={activeJournal} active={activeTab === "breakdown"} syntheticEnabled={syntheticEnabled} />
          </div>
          <div className={activeTab !== "custom-fields" ? "hidden" : "nx-panel-enter"}>
            <CustomFieldsTab journalId={activeJournal?.id} active={activeTab === "custom-fields"} />
          </div>
          </>}
        </div>
      </div>

      {preferencesOpen && <UserSettings onClose={()=>setPreferencesOpen(false)}/>}
      <SettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        journal={activeJournal}
      />
      <MT5ImportDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        journal={activeJournal}
        onSuccess={() => {setTradesRefreshKey((k) => k + 1);refreshAnalytics?.();}}
      />

      <Dialog open={deleteOpen} onOpenChange={(v) => !v && setDeleteOpen(false)}>
        <DialogContent className="border-zinc-800 bg-zinc-950 sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("Delete “")}{activeJournal?.name}&rdquo;?</DialogTitle>
            <DialogDescription>{t("All trades, analytics, and catalog data will be permanently deleted. This action cannot be undone.")}</DialogDescription>
          </DialogHeader>
          {deleteError && <p className="text-sm text-destructive">{deleteError}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={deleting}>{t("Cancel")}</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? t("Deleting…") : t("Delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
