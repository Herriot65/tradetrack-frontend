import { getLanguage, translate as t } from "@/i18n/language";
import { useLanguage } from "@/i18n/useLanguage";
import { useEffect, useRef, useState } from "react";
import "./trade-panel.css";
import TradeQualityInput from "./TradeQualityInput";
import TradePnlInput from "./TradePnlInput";
import TradeRiskInput from "./TradeRiskInput";
import { useAuth } from "@/auth/useAuth";
import { useJournal } from "@/journals/useJournal";
import { getUserTimezone } from "@/lib/timezone";
import { useForm, useWatch, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Settings2, Trash2, Star, Hash } from "lucide-react";
import FieldModeToggle from "./FieldModeToggle";
import { UNIT_OPTIONS, riskAmount, tradeAmount } from "@/lib/analytics";

import { tradeSchema } from "@/schemas/tradeSchema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SelectField from "@/components/ui/select-field";
import DateTimePicker from "@/components/ui/date-time-picker";
import {
  toTradeDateTimeInput as toInputDt,
  fromTradeDateTimeInput as fromInputDt,
} from "@/lib/tradeDateTime";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetBody,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import TradeCustomFields, { AddCustomFieldButton } from "./TradeCustomFields";
import { useTradeCustomFields } from "@/hooks/useTradeCustomFields";
import TagPicker from "./TagPicker";
import TagManager from "./TagManager";
import AssetCombobox from "./AssetCombobox";
import CatalogCombobox from "./CatalogCombobox";
import TradeNotesEditor, { DEFAULT_SECTIONS } from "./TradeNotesEditor";
import { uploadScreenshot, deleteScreenshot, fetchTrade } from "@/api/trades.api";

// ─── Options ──────────────────────────────────────────────────────────────────

const TF_OPTIONS = ["M1", "M5", "M15", "M30", "H1", "H4", "D1", "W1", "MN"];
const TREND_OPTIONS = [
  { value: "BULLISH", label: "Bullish" },
  { value: "BEARISH", label: "Bearish" },
  { value: "RANGE", label: "Range" },
];
const SESSION_OPTIONS = ["Asian", "London", "New York", "London/NY Overlap", "Pre-Market"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function tradeToDefaults(trade, timezone = "UTC") {
  if (!trade) {
    return {
      asset: "",
      side: "BUY",
      entry_datetime: "",
      exit_datetime: "",
      risk_percent: "",
      pnl_r: "",
      commission: "",
      swap: "",
      reference_timeframe: "",
      trade_score: "",
      opportunity_timeframe: "",
      entry_timeframe: "",
      trend_direction: "",
      setup: "",
      session: "",
      status: null,
      emotions: [],
      mistakes: [],
      notes: "",
      custom_fields: {},
    };
  }
  // Handle asset: {id, symbol} (API) or string (legacy mock)
  const asset =
    trade.asset && typeof trade.asset === "object" ? trade.asset.symbol : (trade.asset ?? "");
  // Handle emotions: [{id, label}] (API) or string[] or single legacy string
  const emotions = Array.isArray(trade.emotions)
    ? trade.emotions.map((e) => (typeof e === "object" ? e.label : e))
    : trade.emotion
      ? [trade.emotion]
      : [];
  // Handle mistakes: [{id, label}] (API) or string[]
  const mistakes = Array.isArray(trade.mistakes)
    ? trade.mistakes.map((m) => (typeof m === "object" ? m.label : m))
    : [];
  // Handle setup: {id, label} (API) or string (legacy mock)
  const setup =
    trade.setup && typeof trade.setup === "object" ? trade.setup.label : (trade.setup ?? "");
  return {
    asset,
    side: trade.side ?? "BUY",
    entry_datetime: toInputDt(trade.entry_datetime, timezone),
    exit_datetime: toInputDt(trade.exit_datetime, timezone),
    risk_percent: trade.risk_percent ?? "",
    pnl_r: tradeAmount(trade, "R") ?? "",
    commission: trade.commission ?? "",
    swap: trade.swap ?? "",
    reference_timeframe: trade.reference_timeframe ?? "",
    trade_score: trade.trade_score ?? "",
    opportunity_timeframe: trade.opportunity_timeframe ?? "",
    entry_timeframe: trade.entry_timeframe ?? "",
    trend_direction: trade.trend_direction ?? "",
    setup,
    session: trade.session ?? "",
    status: trade.status === "OPEN" ? null : (trade.status ?? null),
    emotions,
    mistakes,
    notes: trade.notes ?? "",
    custom_fields: trade.custom_fields ?? {},
  };
}

// Rebuild notesSections from backend screenshots, preserving default section order.
// Each screenshot carries a `section` string (its section title); nulls fall into
// the first default section.
function buildSections(screenshots = []) {
  const map = new Map(DEFAULT_SECTIONS.map((s) => [s.title, { ...s, text: "", images: [] }]));
  for (const sc of screenshots) {
    const title = sc.section ?? DEFAULT_SECTIONS[0].title;
    if (!map.has(title)) {
      map.set(title, { id: `section-${title}`, title, text: "", images: [] });
    }
    map.get(title).images.push({
      id: sc.id,
      name: `screenshot-${sc.id}`,
      preview: sc.image_url,
      file: null,
      screenshotId: sc.id,
    });
  }
  return Array.from(map.values());
}

// ─── Sub-components ───────────────────────────────────────────────────────────

// Label row with optional action button on the right
function F({ label, error, children, span2 = false, action, id }) {
  useLanguage();
  return (
    <div className={span2 ? "min-w-0 col-span-full space-y-1.5" : "min-w-0 space-y-1.5"}>
      <div className="flex min-h-6 items-center justify-between gap-2">
        <label htmlFor={id} className="block text-xs font-medium text-zinc-400">
          {t(label)}
        </label>
        {action}
      </div>
      {children}
      {error && <p className="text-xs text-red-400">{t(error)}</p>}
    </div>
  );
}

// Number input prefixed with a dollar sign
function DollarInput({ className = "", ...props }) {
  useLanguage();
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-500">
        $
      </span>
      <Input
        type="number"
        step="0.01"
        className={`h-9 border-zinc-800 bg-zinc-900/60 pl-6 text-sm focus-visible:ring-zinc-400/40 ${className}`}
        {...props}
      />
    </div>
  );
}

// Small "Manage" gear button used in section headers
function ManageBtn({ onClick }) {
  useLanguage();
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1 text-[10px] text-zinc-600 hover:text-zinc-400"
    >
      <Settings2 className="size-3" />{t("Manage")}</button>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TradePanel({
  mode,
  trade,
  open,
  onClose,
  onSave,
  onDelete,
  catalog,
  journalId,
  defaultUnit = "R",
}) {
  useLanguage();
  const isEdit = mode === "edit";
  const auth = useAuth();
  const timezone = auth?.user?.timezone || getUserTimezone();
  const journalContext = useJournal();
  const journal = journalContext?.activeJournal ?? journalContext?.activeWorkspace;
  const capital = Number(
    trade && Object.hasOwn(trade, "capital_basis")
      ? trade.capital_basis
      : (journal?.startingCapital ?? journal?.starting_capital ?? 0),
  );
  const customFields = useTradeCustomFields(journalId, { enabled: open });

  const [notesSections, setNotesSections] = useState(() => buildSections(trade?.screenshots));
  const [draftSource, setDraftSource] = useState({ open, trade, mode });
  // A new draft must not retain the previous trade's attachments.
  if (draftSource.open !== open || draftSource.trade !== trade || draftSource.mode !== mode) {
    setDraftSource({ open, trade, mode });
    if (open) setNotesSections(buildSections(trade?.screenshots));
  }
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [manageAssetsOpen, setManageAssetsOpen] = useState(false);
  const [manageEmotionsOpen, setManageEmotionsOpen] = useState(false);
  const [manageMistakesOpen, setManageMistakesOpen] = useState(false);
  const [manageSetupsOpen, setManageSetupsOpen] = useState(false);
  const [panelWidth, setPanelWidth] = useState(560);
  const [pnlUnit, setPnlUnit] = useState(defaultUnit);
  const [riskUnit, setRiskUnit] = useState(defaultUnit === "USD" ? "USD" : "PCT");
  const [unitSource, setUnitSource] = useState({ open, trade });
  if (unitSource.open !== open || unitSource.trade !== trade) {
    setUnitSource({ open, trade });
    if (open) {
      setPnlUnit(defaultUnit);
      setRiskUnit(defaultUnit === "USD" ? "USD" : "PCT");
    }
  }
  const [ratingStyle, setRatingStyle] = useState("score");
  const [resizing, setResizing] = useState(false);
  const resizeFrame = useRef(null);
  const resizeWidth = useRef(560);
  useEffect(() => () => cancelAnimationFrame(resizeFrame.current), []);

  function resizePanel(event) {
    const sheet = event.currentTarget.closest('[data-slot="sheet-content"]');
    resizeWidth.current = Math.min(
      window.innerWidth,
      Math.min(1100, Math.max(420, window.innerWidth - event.clientX)),
    );
    cancelAnimationFrame(resizeFrame.current);
    resizeFrame.current = requestAnimationFrame(() => {
      sheet.style.maxWidth = `${resizeWidth.current}px`;
    });
  }

  function startResize(event) {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setResizing(true);
  }

  function stopResize(event) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setResizing(false);
    setPanelWidth(resizeWidth.current);
  }

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    setError,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(tradeSchema),
    defaultValues: tradeToDefaults(trade, timezone),
  });

  useEffect(() => {
    if (!open) return;
    reset(tradeToDefaults(trade, timezone));
    if (mode === "edit" && trade?.id && journalId) {
      // The list endpoint doesn't include screenshots; fetch the detail to populate them.
      let cancelled = false;
      fetchTrade(journalId, trade.id)
        .then((full) => {
          if (!cancelled) setNotesSections(buildSections(full.screenshots));
        })
        .catch(() => {
          if (!cancelled) setNotesSections(buildSections(trade?.screenshots));
        });
      return () => {
        cancelled = true;
      };
    }
  }, [open, trade, reset, mode, journalId, timezone]);

  const watchedEmotions = useWatch({ control, name: "emotions" }) ?? [];
  const watchedMistakes = useWatch({ control, name: "mistakes" }) ?? [];
  const watchedSide = useWatch({ control, name: "side" });
  const watchedStatus = useWatch({ control, name: "status" });
  const watchedRisk = useWatch({ control, name: "risk_percent" });
  const canConvertPnl = riskAmount({ risk_percent: watchedRisk }, capital) !== null;
  const unresolvedProfit =
    trade?.pnl_amount != null && trade?.risk_amount == null ? Number(trade.pnl_amount) : null;
  const effectivePnlUnit = unresolvedProfit !== null && !canConvertPnl ? "USD" : pnlUnit;

  async function removeCustomField(id) {
    await customFields.remove(id);
    const values = { ...getValues("custom_fields") };
    delete values[String(id)];
    setValue("custom_fields", values, { shouldDirty: true });
  }

  async function submit(values) {
    // Keep the original instant when editing an unchanged repeated DST hour.
    const entry =
      trade?.entry_datetime && values.entry_datetime === toInputDt(trade.entry_datetime, timezone)
        ? new Date(trade.entry_datetime).toISOString()
        : fromInputDt(values.entry_datetime, timezone);
    const exit =
      trade?.exit_datetime && values.exit_datetime === toInputDt(trade.exit_datetime, timezone)
        ? new Date(trade.exit_datetime).toISOString()
        : fromInputDt(values.exit_datetime, timezone);
    if (!entry || (values.exit_datetime && !exit)) {
      setError(!entry ? "entry_datetime" : "exit_datetime", {
        message: "This local time does not exist in your timezone. Choose another time.",
      });
      return;
    }
    if (exit && exit <= entry) {
      setError("exit_datetime", { message: "Exit must be after entry." });
      return;
    }
    const payload = {
      // Non-catalog fields
      side: values.side,
      entry_datetime: entry,
      exit_datetime: exit,
      risk_percent:
        values.risk_percent == null ? null : Number(Number(values.risk_percent).toFixed(6)),
      pnl_r:
        values.pnl_r == null && unresolvedProfit !== null
          ? canConvertPnl
            ? Number(
                (unresolvedProfit / ((capital * Number(values.risk_percent)) / 100)).toFixed(6),
              )
            : trade.pnl_r
          : values.pnl_r == null
            ? null
            : Number(Number(values.pnl_r).toFixed(6)),
      commission: values.commission ?? null,
      swap: values.swap ?? null,
      reference_timeframe: values.reference_timeframe || null,
      trade_score: values.trade_score ?? null,
      opportunity_timeframe: values.opportunity_timeframe || null,
      entry_timeframe: values.entry_timeframe || null,
      trend_direction: values.trend_direction || null,
      session: values.session || null,
      status: values.status,
      notes: values.notes || null,
      custom_fields: values.custom_fields ?? {},
      // Catalog ID fields — replace raw strings with backend IDs
      asset_id: catalog.assetMap.get(values.asset) ?? null,
      emotion_ids: values.emotions.map((l) => catalog.emotionMap.get(l)).filter(Boolean),
      mistake_ids: values.mistakes.map((l) => catalog.mistakeMap.get(l)).filter(Boolean),
      setup_id: values.setup ? (catalog.setupMap.get(values.setup) ?? null) : null,
    };
    try {
      const savedTrade = await onSave(payload);
      const tradeId = isEdit ? trade.id : savedTrade?.id;
      if (tradeId && journalId) {
        const pendingImages = notesSections.flatMap((s) =>
          s.images
            .filter((img) => img.file)
            .map((img) => ({ file: img.file, preview: img.preview, section: s.title })),
        );
        if (pendingImages.length > 0) {
          await Promise.allSettled(
            pendingImages.map(({ file, section }) =>
              uploadScreenshot(journalId, tradeId, file, section),
            ),
          );
          pendingImages.forEach(({ preview }) => URL.revokeObjectURL(preview));
        }
      }
      onClose();
    } catch (err) {
      const fieldErrors = err?.response?.data?.custom_fields;
      if (fieldErrors && typeof fieldErrors === "object") {
        Object.entries(fieldErrors).forEach(([id, message]) =>
          setError(`custom_fields.${id}`, {
            type: "server",
            message: Array.isArray(message) ? message.join(" ") : String(message),
          }),
        );
      }
      setError("root", {
        message: err?.response?.data?.detail ?? err.message ?? "Failed to save trade",
      });
    }
  }

  async function handleDeleteBackendImage(screenshotId) {
    if (!trade?.id || !journalId) return;
    try {
      await deleteScreenshot(journalId, trade.id, screenshotId);
    } catch {
      // image already removed from UI via TradeNotesEditor; nothing to revert
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await onDelete(trade.id);
      setDeleteOpen(false);
      onClose();
    } catch {
      setDeleting(false);
    }
  }

  return (
    <>
      <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
        <SheetContent
          className={`flex flex-col ${resizing ? "select-none" : ""}`}
          style={{ maxWidth: `${panelWidth}px`, transition: "none" }}
        >
          <div
            role="separator"
            aria-label="Resize trade form"
            aria-orientation="vertical"
            onPointerDown={startResize}
            onPointerMove={(event) => resizing && resizePanel(event)}
            onPointerUp={stopResize}
            onPointerCancel={stopResize}
            className="group absolute inset-y-0 left-0 z-10 hidden w-2 cursor-col-resize sm:block"
            style={{ touchAction: "none" }}
          >
            <span className="absolute inset-y-0 left-0.5 w-px bg-zinc-800 transition-colors group-hover:bg-zinc-500" />
          </div>
          <SheetHeader onClose={onClose}>
            <div className="flex items-center justify-between gap-3">
              <SheetTitle>
                {isEdit
                  ? ((trade?.asset && typeof trade.asset === "object"
                      ? trade.asset.symbol
                      : trade?.asset) ?? t("Edit Trade"))
                  : t("New Trade")}
              </SheetTitle>
            </div>
            <SheetDescription className="sr-only">
              {isEdit ? t("Edit trade details") : t("Log a new trade")}
            </SheetDescription>
          </SheetHeader>

          <SheetBody className="trade-panel-body">
            <form id="trade-form" onSubmit={handleSubmit(submit)} noValidate>
              {errors.root && (
                <p className="mb-4 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
                  {errors.root.message}
                </p>
              )}

              {customFields.error && (
                <div
                  role="alert"
                  className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-zinc-800 p-3 text-xs text-zinc-400"
                >
                  <span>{t("Custom fields could not be loaded.")}</span>
                  <Button type="button" variant="outline" size="sm" onClick={customFields.refetch}>{t("Retry")}</Button>
                </div>
              )}
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-4">
                <div>
                  <p className="text-xs font-medium text-zinc-300">{t("Custom fields")}</p>
                  <p className="mt-0.5 text-[11px] text-zinc-600">{t("Add a field to any section of this trade form.")}</p>
                </div>
                <AddCustomFieldButton
                  onCreate={customFields.create}
                  disabled={customFields.loading || !!customFields.error}
                />
              </div>
              {capital > 0 && (
                <p className="mb-4 text-[11px] text-zinc-500">{t("Conversions use") + " "}{isEdit ? "this trade’s saved" : "the journal’s current"}{" " + t("capital basis: $")}{capital.toLocaleString(getLanguage(), { maximumFractionDigits: 2 })}.
                </p>
              )}
              <div className="space-y-7">
                {/* ── Execution ── */}
                <section>
                  <h3 className="mb-3 text-[13px] font-medium uppercase tracking-[0.12em] text-zinc-200">{t("Execution")}</h3>
                  <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-x-4 gap-y-4">
                    <F
                      label={t("Asset *")}
                      error={errors.asset?.message}
                      span2
                      action={<ManageBtn onClick={() => setManageAssetsOpen(true)} />}
                    >
                      <Controller
                        name="asset"
                        control={control}
                        render={({ field }) => (
                          <AssetCombobox
                            value={field.value}
                            onChange={field.onChange}
                            options={catalog.assets}
                            onCreateAsset={catalog.addAsset}
                          />
                        )}
                      />
                    </F>

                    <F label={t("Side *")} error={errors.side?.message}>
                      <div className="flex gap-2">
                        {["BUY", "SELL"].map((s) => {
                          const active = watchedSide === s;
                          return (
                            <button
                              key={s}
                              type="button"
                              onClick={() => setValue("side", s, { shouldValidate: true })}
                              className={`flex-1 rounded-md border px-3 py-1.5 text-xs font-bold uppercase transition-colors ${
                                s === "BUY"
                                  ? active
                                    ? "border-emerald-500/50 bg-emerald-500/20 text-emerald-400"
                                    : "border-zinc-800 text-zinc-500 hover:border-zinc-600"
                                  : active
                                    ? "border-red-500/50 bg-red-500/20 text-red-400"
                                    : "border-zinc-800 text-zinc-500 hover:border-zinc-600"
                              }`}
                            >
                              {s}
                            </button>
                          );
                        })}
                      </div>
                    </F>

                    <F
                      label={t("Entry date/time *")}
                      id="trade-entry_datetime"
                      error={errors.entry_datetime?.message}
                    >
                      <Controller
                        name="entry_datetime"
                        control={control}
                        render={({ field }) => (
                          <DateTimePicker
                            id="trade-entry_datetime"
                            label={t("Entry date/time")}
                            value={field.value}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            ref={field.ref}
                            invalid={!!errors.entry_datetime}
                          />
                        )}
                      />
                    </F>

                    <F
                      label={t("Exit date/time")}
                      id="trade-exit_datetime"
                      error={errors.exit_datetime?.message}
                    >
                      <Controller
                        name="exit_datetime"
                        control={control}
                        render={({ field }) => (
                          <DateTimePicker
                            id="trade-exit_datetime"
                            label={t("Exit date/time")}
                            value={field.value}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            ref={field.ref}
                            invalid={!!errors.exit_datetime}
                          />
                        )}
                      />
                    </F>

                    <F
                      label={t("Risk")}
                      id="trade-risk"
                      error={errors.risk_percent?.message}
                      action={
                        <FieldModeToggle
                          label={t("Risk unit")}
                          options={[
                            { value: "PCT", label: "%" },
                            {
                              value: "USD",
                              label: "$",
                              disabled: !(capital > 0),
                              title:
                                capital > 0
                                  ? "$"
                                  : "Set journal starting capital to enter risk in dollars",
                            },
                          ]}
                          value={capital > 0 ? riskUnit : "PCT"}
                          onChange={setRiskUnit}
                        />
                      }
                    >
                      <Controller
                        name="risk_percent"
                        control={control}
                        render={({ field }) => (
                          <TradeRiskInput {...field} capital={capital} unit={riskUnit} />
                        )}
                      />
                    </F>
                  </div>
                  <TradeCustomFields
                    section="execution"
                    fields={customFields.fields}
                    control={control}
                    errors={errors}
                    onCreate={customFields.create}
                    onRemove={removeCustomField}
                    disabled={customFields.loading || !!customFields.error}
                    showAdd={false}
                  />
                </section>

                {/* ── Performance ── */}
                <section>
                  <h3 className="mb-3 text-[13px] font-medium uppercase tracking-[0.12em] text-zinc-200">{t("Performance")}</h3>
                  <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-x-4 gap-y-4">
                    <F
                      label={t("PnL")}
                      error={errors.pnl_r?.message}
                      span2
                      action={
                        <FieldModeToggle
                          label={t("PnL unit")}
                          options={UNIT_OPTIONS.map((option) => ({
                            ...option,
                            disabled:
                              !canConvertPnl &&
                              (unresolvedProfit !== null
                                ? option.value !== "USD"
                                : option.value !== "R"),
                            title: !canConvertPnl
                              ? "Set positive risk and a capital basis for conversion"
                              : option.label,
                          }))}
                          value={
                            canConvertPnl
                              ? effectivePnlUnit
                              : unresolvedProfit !== null
                                ? "USD"
                                : "R"
                          }
                          onChange={setPnlUnit}
                        />
                      }
                    >
                      <Controller
                        name="pnl_r"
                        control={control}
                        render={({ field }) => (
                          <TradePnlInput
                            {...field}
                            value={
                              (field.value == null || field.value === "") &&
                              unresolvedProfit !== null &&
                              canConvertPnl
                                ? unresolvedProfit / ((capital * Number(watchedRisk)) / 100)
                                : field.value
                            }
                            risk={watchedRisk}
                            capital={capital}
                            unit={effectivePnlUnit}
                            knownProfit={unresolvedProfit}
                          />
                        )}
                      />
                    </F>

                    <F label={t("Status")} span2>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { value: null, label: "Auto" },
                          { value: "WIN", label: "WIN" },
                          { value: "LOSS", label: "LOSS" },
                          { value: "BE", label: "Breakeven" },
                        ].map(({ value, label }) => {
                          const active = watchedStatus === value;
                          const activeClass = {
                            null: "border-zinc-600 bg-zinc-800 text-zinc-200",
                            WIN: "border-emerald-500/50 bg-emerald-500/20 text-emerald-400",
                            LOSS: "border-red-500/50 bg-red-500/20 text-red-400",
                            BE: "border-zinc-500/40 bg-zinc-700/40 text-zinc-300",
                            OPEN: "border-amber-500/50 bg-amber-500/20 text-amber-400",
                          }[String(value)];
                          return (
                            <button
                              key={label}
                              type="button"
                              onClick={() => setValue("status", value)}
                              className={`rounded-md border px-3 py-1 text-xs font-semibold uppercase transition-colors ${
                                active
                                  ? activeClass
                                  : "border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-400"
                              }`}
                            >
                              {t(label)}
                            </button>
                          );
                        })}
                      </div>
                      {watchedStatus === null && (
                        <p className="mt-1 text-[10px] text-zinc-600">{t("Derived automatically from PnL value")}</p>
                      )}
                    </F>

                    <F label={t("Commission")} error={errors.commission?.message}>
                      <DollarInput placeholder="0.00" {...register("commission")} />
                    </F>

                    <F label="Swap" error={errors.swap?.message}>
                      <DollarInput placeholder="0.00" {...register("swap")} />
                    </F>
                  </div>
                  <TradeCustomFields
                    section="performance"
                    fields={customFields.fields}
                    control={control}
                    errors={errors}
                    onCreate={customFields.create}
                    onRemove={removeCustomField}
                    disabled={customFields.loading || !!customFields.error}
                    showAdd={false}
                  />
                </section>

                {/* ── Setup ── */}
                <section>
                  <h3 className="mb-3 text-[13px] font-medium uppercase tracking-[0.12em] text-zinc-200">{t("Setup")}</h3>
                  <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-x-4 gap-y-4">
                    <F label={t("Reference TF")} id="trade-reference_timeframe">
                      <Controller
                        name="reference_timeframe"
                        control={control}
                        render={({ field }) => (
                          <SelectField translateOptions
                            id="trade-reference_timeframe"
                            label={t("Reference TF")}
                            value={field.value}
                            onValueChange={field.onChange}
                            onBlur={field.onBlur}
                            ref={field.ref}
                            options={TF_OPTIONS}
                            placeholder={t("Select timeframe")}
                          />
                        )}
                      />
                    </F>

                    <F
                      label={t("Trade score")}
                      id="trade-trade_score"
                      error={errors.trade_score?.message}
                      action={
                        <FieldModeToggle
                          label={t("Quality rating style")}
                          options={[
                            {
                              value: "score",
                              label: "Score",
                              title: "Numeric score",
                              icon: <Hash className="size-3" />,
                            },
                            {
                              value: "stars",
                              label: "Stars",
                              title: "Star rating",
                              icon: <Star className="size-3" />,
                            },
                          ]}
                          value={ratingStyle}
                          onChange={setRatingStyle}
                        />
                      }
                    >
                      <Controller
                        name="trade_score"
                        control={control}
                        render={({ field }) => (
                          <TradeQualityInput
                            id="trade-trade_score"
                            value={field.value}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            style={ratingStyle}
                          />
                        )}
                      />
                    </F>

                    <F label={t("Opportunity TF")} id="trade-opportunity_timeframe">
                      <Controller
                        name="opportunity_timeframe"
                        control={control}
                        render={({ field }) => (
                          <SelectField translateOptions
                            id="trade-opportunity_timeframe"
                            label={t("Opportunity TF")}
                            value={field.value}
                            onValueChange={field.onChange}
                            onBlur={field.onBlur}
                            ref={field.ref}
                            options={TF_OPTIONS}
                            placeholder={t("Select timeframe")}
                          />
                        )}
                      />
                    </F>

                    <F label={t("Entry TF")} id="trade-entry_timeframe">
                      <Controller
                        name="entry_timeframe"
                        control={control}
                        render={({ field }) => (
                          <SelectField translateOptions
                            id="trade-entry_timeframe"
                            label={t("Entry TF")}
                            value={field.value}
                            onValueChange={field.onChange}
                            onBlur={field.onBlur}
                            ref={field.ref}
                            options={TF_OPTIONS}
                            placeholder={t("Select timeframe")}
                          />
                        )}
                      />
                    </F>

                    <F label={t("Trend")} id="trade-trend_direction">
                      <Controller
                        name="trend_direction"
                        control={control}
                        render={({ field }) => (
                          <SelectField translateOptions
                            id="trade-trend_direction"
                            label={t("Trend")}
                            value={field.value}
                            onValueChange={field.onChange}
                            onBlur={field.onBlur}
                            ref={field.ref}
                            options={TREND_OPTIONS}
                            placeholder={t("Select trend")}
                          />
                        )}
                      />
                    </F>

                    <F label={t("Session")} id="trade-session">
                      <Controller
                        name="session"
                        control={control}
                        render={({ field }) => (
                          <SelectField translateOptions
                            id="trade-session"
                            label={t("Session")}
                            value={field.value}
                            onValueChange={field.onChange}
                            onBlur={field.onBlur}
                            ref={field.ref}
                            options={SESSION_OPTIONS}
                            placeholder={t("Select session")}
                          />
                        )}
                      />
                    </F>

                    <F
                      label={t("Setup")}
                      span2
                      action={<ManageBtn onClick={() => setManageSetupsOpen(true)} />}
                    >
                      <Controller
                        name="setup"
                        control={control}
                        render={({ field }) => (
                          <CatalogCombobox
                            value={field.value ?? ""}
                            onChange={field.onChange}
                            options={catalog.setups}
                            onCreateOption={catalog.addSetup}
                            placeholder={t("Select or type a setup…")}
                            createLabel={(v) => `Add "${v}" to setups`}
                          />
                        )}
                      />
                    </F>
                  </div>
                  <TradeCustomFields
                    section="setup"
                    fields={customFields.fields}
                    control={control}
                    errors={errors}
                    onCreate={customFields.create}
                    onRemove={removeCustomField}
                    disabled={customFields.loading || !!customFields.error}
                    showAdd={false}
                  />
                </section>

                {/* ── Psychology ── */}
                <section>
                  <h3 className="mb-3 text-[13px] font-medium uppercase tracking-[0.12em] text-zinc-200">{t("Psychology")}</h3>
                  <div className="space-y-3">
                    <F
                      label={t("Emotion *")}
                      error={errors.emotions?.message}
                      span2
                      action={<ManageBtn onClick={() => setManageEmotionsOpen(true)} />}
                    >
                      <TagPicker
                        selected={watchedEmotions}
                        onChange={(v) => setValue("emotions", v, { shouldValidate: true })}
                        options={catalog.emotionTags}
                        onCreateTag={catalog.addEmotionTag}
                        placeholder={t("Select emotions…")}
                      />
                    </F>

                    <F
                      label={t("Mistake")}
                      span2
                      action={<ManageBtn onClick={() => setManageMistakesOpen(true)} />}
                    >
                      <TagPicker
                        selected={watchedMistakes}
                        onChange={(v) => setValue("mistakes", v)}
                        options={catalog.mistakeTags}
                        onCreateTag={catalog.addMistakeTag}
                        placeholder={t("Select mistakes…")}
                        emptyText="No errors"
                      />
                    </F>
                  </div>
                  <TradeCustomFields
                    section="psychology"
                    fields={customFields.fields}
                    control={control}
                    errors={errors}
                    onCreate={customFields.create}
                    onRemove={removeCustomField}
                    disabled={customFields.loading || !!customFields.error}
                    showAdd={false}
                  />
                </section>

                {/* ── Notes ── */}
                <section>
                  <h3 className="mb-3 text-[13px] font-medium uppercase tracking-[0.12em] text-zinc-200">{t("Notes")}</h3>
                  <textarea
                    rows={3}
                    placeholder={t("General trade notes…")}
                    className="w-full resize-none rounded-md border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:ring-1 focus:ring-zinc-400/40"
                    {...register("notes")}
                  />
                  <TradeCustomFields
                    section="notes"
                    fields={customFields.fields}
                    control={control}
                    errors={errors}
                    onCreate={customFields.create}
                    onRemove={removeCustomField}
                    disabled={customFields.loading || !!customFields.error}
                    showAdd={false}
                  />
                </section>

                {/* ── Trade Notes ── */}
                <section>
                  <h3 className="mb-3 text-[13px] font-medium uppercase tracking-[0.12em] text-zinc-200">{t("Trade Notes")}</h3>
                  <TradeNotesEditor
                    sections={notesSections}
                    onChange={setNotesSections}
                    onDeleteImage={handleDeleteBackendImage}
                  />
                  <TradeCustomFields
                    section="trade_notes"
                    fields={customFields.fields}
                    control={control}
                    errors={errors}
                    onCreate={customFields.create}
                    onRemove={removeCustomField}
                    disabled={customFields.loading || !!customFields.error}
                    showAdd={false}
                  />
                </section>
              </div>
            </form>
          </SheetBody>

          <SheetFooter>
            {isEdit && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-red-400 hover:bg-red-500/10 hover:text-red-300"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="size-3.5" />{t("Delete")}</Button>
            )}
            <div className="ml-auto flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={onClose}>{t("Cancel")}</Button>
              <Button
                type="submit"
                form="trade-form"
                size="sm"
                disabled={isSubmitting || catalog.loading}
              >
                {isSubmitting ? t("Saving…") : t("Save Trade")}
              </Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Delete confirmation */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="border-zinc-800 bg-zinc-950 sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("Delete trade?")}</DialogTitle>
            <DialogDescription>{t("This trade will be permanently removed. This action cannot be undone.")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={deleting}>{t("Cancel")}</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? t("Deleting…") : t("Delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Catalog managers */}
      <TagManager
        open={manageAssetsOpen}
        onClose={() => setManageAssetsOpen(false)}
        title={t("Manage Assets")}
        tags={catalog.assets}
        onAdd={catalog.addAsset}
        onRemove={catalog.removeAsset}
        onUpdate={catalog.updateAsset}
      />
      <TagManager
        open={manageEmotionsOpen}
        onClose={() => setManageEmotionsOpen(false)}
        title={t("Manage Emotion Tags")}
        tags={catalog.emotionTags}
        onAdd={catalog.addEmotionTag}
        onRemove={catalog.removeEmotionTag}
        onUpdate={catalog.updateEmotionTag}
      />
      <TagManager
        open={manageMistakesOpen}
        onClose={() => setManageMistakesOpen(false)}
        title={t("Manage Mistake Tags")}
        tags={catalog.mistakeTags}
        onAdd={catalog.addMistakeTag}
        onRemove={catalog.removeMistakeTag}
        onUpdate={catalog.updateMistakeTag}
      />
      <TagManager
        open={manageSetupsOpen}
        onClose={() => setManageSetupsOpen(false)}
        title={t("Manage Setups")}
        tags={catalog.setups}
        onAdd={catalog.addSetup}
        onRemove={catalog.removeSetup}
        onUpdate={catalog.updateSetup}
      />
    </>
  );
}
