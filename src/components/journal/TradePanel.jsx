import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Settings2, Trash2 } from "lucide-react";

import { tradeSchema } from "@/schemas/tradeSchema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import TagPicker from "./TagPicker";
import TagManager from "./TagManager";
import AssetCombobox from "./AssetCombobox";
import CatalogCombobox from "./CatalogCombobox";
import TradeNotesEditor, { DEFAULT_SECTIONS } from "./TradeNotesEditor";
import { uploadScreenshot, deleteScreenshot, fetchTrade } from "@/api/trades.api";

// ─── Options ──────────────────────────────────────────────────────────────────

const TF_OPTIONS      = ["M1", "M5", "M15", "M30", "H1", "H4", "D1", "W1", "MN"];
const TREND_OPTIONS   = ["BULLISH", "BEARISH", "RANGE", "NEUTRAL"];
const SESSION_OPTIONS = ["Asian", "London", "New York", "London/NY Overlap", "Pre-Market"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const selectCls =
  "h-9 w-full rounded-md border border-zinc-800 bg-zinc-900/60 px-3 text-sm text-zinc-100 outline-none focus:ring-1 focus:ring-emerald-500/50 disabled:opacity-50";

function toInputDt(iso) {
  if (!iso) return "";
  return iso.slice(0, 16).replace(" ", "T");
}

function fromInputDt(val) {
  if (!val) return null;
  return val.length === 16 ? `${val}:00.000Z` : val;
}

function tradeToDefaults(trade) {
  if (!trade) {
    return {
      asset: "", side: "BUY",
      entry_datetime: "", exit_datetime: "",
      risk_percent: "", pnl_r: "",
      commission: "", swap: "",
      opportunity_timeframe: "", entry_timeframe: "",
      trend_direction: "", setup: "", session: "",
      status: null,
      emotions: [], mistakes: [], notes: "",
    };
  }
  // Handle asset: {id, symbol} (API) or string (legacy mock)
  const asset = trade.asset && typeof trade.asset === "object"
    ? trade.asset.symbol
    : (trade.asset ?? "");
  // Handle emotions: [{id, label}] (API) or string[] or single legacy string
  const emotions = Array.isArray(trade.emotions)
    ? trade.emotions.map((e) => (typeof e === "object" ? e.label : e))
    : trade.emotion ? [trade.emotion] : [];
  // Handle mistakes: [{id, label}] (API) or string[]
  const mistakes = Array.isArray(trade.mistakes)
    ? trade.mistakes.map((m) => (typeof m === "object" ? m.label : m))
    : [];
  // Handle setup: {id, label} (API) or string (legacy mock)
  const setup = trade.setup && typeof trade.setup === "object"
    ? trade.setup.label
    : (trade.setup ?? "");
  return {
    asset,
    side:                  trade.side ?? "BUY",
    entry_datetime:        toInputDt(trade.entry_datetime),
    exit_datetime:         toInputDt(trade.exit_datetime),
    risk_percent:          trade.risk_percent ?? "",
    pnl_r:                 trade.pnl_r ?? "",
    commission:            trade.commission ?? "",
    swap:                  trade.swap ?? "",
    opportunity_timeframe: trade.opportunity_timeframe ?? "",
    entry_timeframe:       trade.entry_timeframe ?? "",
    trend_direction:       trade.trend_direction ?? "",
    setup,
    session:               trade.session ?? "",
    status:                trade.status ?? null,
    emotions, mistakes,
    notes: trade.notes ?? "",
  };
}

// Rebuild notesSections from backend screenshots, preserving default section order.
// Each screenshot carries a `section` string (its section title); nulls fall into
// the first default section.
function buildSections(screenshots = []) {
  const map = new Map(
    DEFAULT_SECTIONS.map((s) => [s.title, { ...s, text: "", images: [] }])
  );
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
function F({ label, error, children, span2 = false, action }) {
  return (
    <div className={span2 ? "col-span-2 space-y-1" : "space-y-1"}>
      <div className="flex items-center justify-between">
        <label className="block text-[11px] font-medium uppercase tracking-wider text-zinc-500">
          {label}
        </label>
        {action}
      </div>
      {children}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

// Number input prefixed with a dollar sign
function DollarInput({ className = "", ...props }) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-500">
        $
      </span>
      <Input
        type="number"
        step="0.01"
        className={`h-9 border-zinc-800 bg-zinc-900/60 pl-6 text-sm focus-visible:ring-emerald-500/50 ${className}`}
        {...props}
      />
    </div>
  );
}

// Small "Manage" gear button used in section headers
function ManageBtn({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1 text-[10px] text-zinc-600 hover:text-zinc-400"
    >
      <Settings2 className="size-3" />
      Manage
    </button>
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
}) {
  const isEdit = mode === "edit";

  const [notesSections, setNotesSections] = useState(() => DEFAULT_SECTIONS.map((s) => ({ ...s })));
  const [deleteOpen,     setDeleteOpen]     = useState(false);
  const [deleting,           setDeleting]           = useState(false);
  const [manageAssetsOpen,   setManageAssetsOpen]   = useState(false);
  const [manageEmotionsOpen, setManageEmotionsOpen] = useState(false);
  const [manageMistakesOpen, setManageMistakesOpen] = useState(false);
  const [manageSetupsOpen,   setManageSetupsOpen]   = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(tradeSchema),
    defaultValues: tradeToDefaults(trade),
  });

  useEffect(() => {
    if (!open) return;
    reset(tradeToDefaults(trade));
    if (mode === "edit" && trade?.id && journalId) {
      // The list endpoint doesn't include screenshots; fetch the detail to populate them.
      let cancelled = false;
      fetchTrade(journalId, trade.id)
        .then((full) => { if (!cancelled) setNotesSections(buildSections(full.screenshots)); })
        .catch(() =>   { if (!cancelled) setNotesSections(buildSections(trade?.screenshots)); });
      return () => { cancelled = true; };
    }
    setNotesSections(buildSections(trade?.screenshots));
  }, [open, trade, reset, mode, journalId]);

  const watchedEmotions = watch("emotions") ?? [];
  const watchedMistakes = watch("mistakes") ?? [];

  async function submit(values) {
    const payload = {
      // Non-catalog fields
      side:                  values.side,
      entry_datetime:        fromInputDt(values.entry_datetime),
      exit_datetime:         fromInputDt(values.exit_datetime) ?? null,
      risk_percent:          values.risk_percent || null,
      pnl_r:                 values.pnl_r || null,
      commission:            values.commission || null,
      swap:                  values.swap || null,
      opportunity_timeframe: values.opportunity_timeframe || null,
      entry_timeframe:       values.entry_timeframe || null,
      trend_direction:       values.trend_direction || null,
      session:               values.session || null,
      status:                values.status,
      notes:                 values.notes || null,
      // Catalog ID fields — replace raw strings with backend IDs
      asset_id:    catalog.assetMap.get(values.asset) ?? null,
      emotion_ids: values.emotions.map((l) => catalog.emotionMap.get(l)).filter(Boolean),
      mistake_ids: values.mistakes.map((l) => catalog.mistakeMap.get(l)).filter(Boolean),
      setup_id:    values.setup ? (catalog.setupMap.get(values.setup) ?? null) : null,
    };
    try {
      const savedTrade = await onSave(payload);
      const tradeId = isEdit ? trade.id : savedTrade?.id;
      if (tradeId && journalId) {
        const pendingImages = notesSections.flatMap((s) =>
          s.images.filter((img) => img.file).map((img) => ({ file: img.file, preview: img.preview, section: s.title }))
        );
        if (pendingImages.length > 0) {
          await Promise.allSettled(
            pendingImages.map(({ file, section }) => uploadScreenshot(journalId, tradeId, file, section))
          );
          pendingImages.forEach(({ preview }) => URL.revokeObjectURL(preview));
        }
      }
      onClose();
    } catch (err) {
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
        <SheetContent className="flex flex-col">
          <SheetHeader onClose={onClose}>
            <SheetTitle>
              {isEdit
                ? (trade?.asset && typeof trade.asset === "object"
                    ? trade.asset.symbol
                    : trade?.asset) ?? "Edit Trade"
                : "New Trade"}
            </SheetTitle>
            <SheetDescription className="sr-only">
              {isEdit ? "Edit trade details" : "Log a new trade"}
            </SheetDescription>
          </SheetHeader>

          <SheetBody>
            <form id="trade-form" onSubmit={handleSubmit(submit)} noValidate>
              {errors.root && (
                <p className="mb-4 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
                  {errors.root.message}
                </p>
              )}

              <div className="space-y-6">

                {/* ── Execution ── */}
                <section>
                  <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                    Execution
                  </h3>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3">

                    <F
                      label="Asset *"
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

                    <F label="Side *" error={errors.side?.message}>
                      <div className="flex gap-2">
                        {["BUY", "SELL"].map((s) => {
                          const active = watch("side") === s;
                          return (
                            <button
                              key={s}
                              type="button"
                              onClick={() => setValue("side", s, { shouldValidate: true })}
                              className={`flex-1 rounded-md border px-3 py-1.5 text-xs font-bold uppercase transition-colors ${
                                s === "BUY"
                                  ? active ? "border-emerald-500/50 bg-emerald-500/20 text-emerald-400" : "border-zinc-800 text-zinc-500 hover:border-zinc-600"
                                  : active ? "border-red-500/50 bg-red-500/20 text-red-400"           : "border-zinc-800 text-zinc-500 hover:border-zinc-600"
                              }`}
                            >
                              {s}
                            </button>
                          );
                        })}
                      </div>
                    </F>

                    <F label="Entry Date/Time *" error={errors.entry_datetime?.message}>
                      <Input
                        type="datetime-local"
                        className="h-9 border-zinc-800 bg-zinc-900/60 text-sm text-zinc-100 focus-visible:ring-emerald-500/50 [color-scheme:dark]"
                        {...register("entry_datetime")}
                      />
                    </F>

                    <F label="Exit Date/Time" error={errors.exit_datetime?.message}>
                      <Input
                        type="datetime-local"
                        className="h-9 border-zinc-800 bg-zinc-900/60 text-sm text-zinc-100 focus-visible:ring-emerald-500/50 [color-scheme:dark]"
                        {...register("exit_datetime")}
                      />
                    </F>

                    <F label="Risk %" error={errors.risk_percent?.message}>
                      <Input
                        type="number" step="0.01" min="0" placeholder="1.00"
                        className="h-9 border-zinc-800 bg-zinc-900/60 text-sm focus-visible:ring-emerald-500/50"
                        {...register("risk_percent")}
                      />
                    </F>

                  </div>
                </section>

                {/* ── Performance ── */}
                <section>
                  <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                    Performance
                  </h3>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3">

                    <F label="PnL" error={errors.pnl_r?.message} span2>
                      <Input
                        type="number" step="0.01" placeholder="e.g. 2.00"
                        className="h-9 border-zinc-800 bg-zinc-900/60 text-sm focus-visible:ring-emerald-500/50"
                        {...register("pnl_r")}
                      />
                    </F>

                    <F label="Status" span2>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { value: null,   label: "Auto"      },
                          { value: "WIN",  label: "WIN"       },
                          { value: "LOSS", label: "LOSS"      },
                          { value: "BE",   label: "Breakeven" },
                          { value: "OPEN", label: "Open"      },
                        ].map(({ value, label }) => {
                          const active = watch("status") === value;
                          const activeClass = {
                            null:   "border-zinc-600 bg-zinc-800 text-zinc-200",
                            WIN:    "border-emerald-500/50 bg-emerald-500/20 text-emerald-400",
                            LOSS:   "border-red-500/50 bg-red-500/20 text-red-400",
                            BE:     "border-zinc-500/40 bg-zinc-700/40 text-zinc-300",
                            OPEN:   "border-amber-500/50 bg-amber-500/20 text-amber-400",
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
                              {label}
                            </button>
                          );
                        })}
                      </div>
                      {watch("status") === null && (
                        <p className="mt-1 text-[10px] text-zinc-600">Derived automatically from PnL value</p>
                      )}
                    </F>

                    <F label="Commission" error={errors.commission?.message}>
                      <DollarInput placeholder="0.00" {...register("commission")} />
                    </F>

                    <F label="Swap" error={errors.swap?.message}>
                      <DollarInput placeholder="0.00" {...register("swap")} />
                    </F>

                  </div>
                </section>

                {/* ── Setup ── */}
                <section>
                  <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                    Setup
                  </h3>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3">

                    <F label="Opportunity TF">
                      <select className={selectCls} {...register("opportunity_timeframe")}>
                        <option value="">—</option>
                        {TF_OPTIONS.map((tf) => <option key={tf} value={tf}>{tf}</option>)}
                      </select>
                    </F>

                    <F label="Entry TF">
                      <select className={selectCls} {...register("entry_timeframe")}>
                        <option value="">—</option>
                        {TF_OPTIONS.map((tf) => <option key={tf} value={tf}>{tf}</option>)}
                      </select>
                    </F>

                    <F label="Trend">
                      <select className={selectCls} {...register("trend_direction")}>
                        <option value="">—</option>
                        {TREND_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </F>

                    <F label="Session">
                      <select className={selectCls} {...register("session")}>
                        <option value="">—</option>
                        {SESSION_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </F>

                    <F
                      label="Setup"
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
                            placeholder="Select or type a setup…"
                            createLabel={(v) => `Add "${v}" to setups`}
                          />
                        )}
                      />
                    </F>

                  </div>
                </section>

                {/* ── Psychology ── */}
                <section>
                  <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                    Psychology
                  </h3>
                  <div className="space-y-3">

                    <F
                      label="Emotion *"
                      error={errors.emotions?.message}
                      span2
                      action={<ManageBtn onClick={() => setManageEmotionsOpen(true)} />}
                    >
                      <TagPicker
                        selected={watchedEmotions}
                        onChange={(v) => setValue("emotions", v, { shouldValidate: true })}
                        options={catalog.emotionTags}
                        onCreateTag={catalog.addEmotionTag}
                        placeholder="Select emotions…"
                      />
                    </F>

                    <F
                      label="Mistake"
                      span2
                      action={<ManageBtn onClick={() => setManageMistakesOpen(true)} />}
                    >
                      <TagPicker
                        selected={watchedMistakes}
                        onChange={(v) => setValue("mistakes", v)}
                        options={catalog.mistakeTags}
                        onCreateTag={catalog.addMistakeTag}
                        placeholder="Select mistakes…"
                        emptyText="No errors"
                      />
                    </F>

                  </div>
                </section>

                {/* ── Notes ── */}
                <section>
                  <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                    Notes
                  </h3>
                  <textarea
                    rows={3}
                    placeholder="General trade notes…"
                    className="w-full resize-none rounded-md border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:ring-1 focus:ring-emerald-500/50"
                    {...register("notes")}
                  />
                </section>

                {/* ── Trade Notes ── */}
                <section>
                  <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                    Trade Notes
                  </h3>
                  <TradeNotesEditor
                    sections={notesSections}
                    onChange={setNotesSections}
                    onDeleteImage={handleDeleteBackendImage}
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
                <Trash2 className="size-3.5" />
                Delete
              </Button>
            )}
            <div className="ml-auto flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                form="trade-form"
                size="sm"
                disabled={isSubmitting || catalog.loading}
              >
                {isSubmitting ? "Saving…" : "Save Trade"}
              </Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Delete confirmation */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="border-zinc-800 bg-zinc-950 sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete trade?</DialogTitle>
            <DialogDescription>
              This trade will be permanently removed. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={deleting}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Catalog managers */}
      <TagManager
        open={manageAssetsOpen}
        onClose={() => setManageAssetsOpen(false)}
        title="Manage Assets"
        tags={catalog.assets}
        onAdd={catalog.addAsset}
        onRemove={catalog.removeAsset}
        onUpdate={catalog.updateAsset}
      />
      <TagManager
        open={manageEmotionsOpen}
        onClose={() => setManageEmotionsOpen(false)}
        title="Manage Emotion Tags"
        tags={catalog.emotionTags}
        onAdd={catalog.addEmotionTag}
        onRemove={catalog.removeEmotionTag}
        onUpdate={catalog.updateEmotionTag}
      />
      <TagManager
        open={manageMistakesOpen}
        onClose={() => setManageMistakesOpen(false)}
        title="Manage Mistake Tags"
        tags={catalog.mistakeTags}
        onAdd={catalog.addMistakeTag}
        onRemove={catalog.removeMistakeTag}
        onUpdate={catalog.updateMistakeTag}
      />
      <TagManager
        open={manageSetupsOpen}
        onClose={() => setManageSetupsOpen(false)}
        title="Manage Setups"
        tags={catalog.setups}
        onAdd={catalog.addSetup}
        onRemove={catalog.removeSetup}
        onUpdate={catalog.updateSetup}
      />

    </>
  );
}
