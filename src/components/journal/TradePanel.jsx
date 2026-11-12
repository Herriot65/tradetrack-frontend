import { useTradeDraft } from "@/hooks/useTradeDraft";
import { restoreDraftImages } from "@/lib/tradeDraftStore";
import EntrySectionHeader from "./EntrySectionHeader";
import EntryFieldActions from "./EntryFieldActions";
import EntryFieldPreferences from "./EntryFieldPreferences";
import { imageSectionOwners, restoreImageLayout, serializeImageLayout, serializeImageNotes, serializeImageDetails } from "@/lib/imageLayout";
import { useEntryFieldPreferences } from "@/hooks/useEntryFieldPreferences";
import { getLanguage, translate as t } from "@/i18n/language";
import { useLanguage } from "@/i18n/useLanguage";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import "./trade-panel.css";
import TradeQualityInput from "./TradeQualityInput";
import TradePnlInput from "./TradePnlInput";
import TradeRiskInput from "./TradeRiskInput";
import { useAuth } from "@/auth/useAuth";
import { useJournal } from "@/journals/useJournal";
import { getUserTimezone } from "@/lib/timezone";
import { useForm, useWatch, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Trash2, Star, Hash } from "lucide-react";
import FieldModeToggle from "./FieldModeToggle";
import { UNIT_OPTIONS, riskAmount, tradeAmount } from "@/lib/analytics";

import { tradeSchema } from "@/schemas/tradeSchema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SetupOptionManager from "./SetupOptionManager";
import { useSetupOptions } from "@/hooks/useSetupOptions";
import TimeframeField from "./TimeframeField";
import OptionCombobox from "./OptionCombobox";
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
import RichNotesEditor from "@/components/notes/RichNotesEditor";
import { documentFromText, documentText } from "@/lib/noteDocument";
import TradeNotesEditor, { DEFAULT_SECTIONS } from "./TradeNotesEditor";
import { uploadScreenshot, updateScreenshotWidth, deleteScreenshot, fetchTrade } from "@/api/trades.api";

// ─── Options ──────────────────────────────────────────────────────────────────

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
    notes: trade.notes_document?.version === 1 ? documentText(trade.notes_document.general) : trade.notes ?? "",
    custom_fields: trade.custom_fields ?? {},
  };
}

// Rebuild notesSections from backend screenshots, preserving default section order.
// Each screenshot carries a `section` string (its section title); nulls fall into
// the first default section.
function buildSections(screenshots = [], document = {}) {
  const sections = document.version === 1 && document.sections?.length ? document.sections : DEFAULT_SECTIONS;
  const restored = sections.map(s => ({...s, text: documentText(s.content) || s.text || "", images: []}));
  const owners = imageSectionOwners(sections);
  for (const sc of screenshots) {
    const owner = sections.find(section => section.id === owners.get(String(sc.id)));
    const title = owner?.title ?? sc.section ?? DEFAULT_SECTIONS[0].title;
    let section = owner ? restored.find(item => item.id === owner.id) : restored.find(item => item.title === title);
    if (!section) {
      section = {id:`section-${title}`,title,text:"",images:[]};
      restored.push(section);
    }
    section.images.push({
      id: sc.id,
      name: `screenshot-${sc.id}`,
      preview: sc.image_url,
      file: null,
      screenshotId: sc.id,
      afterContent: section.image_notes?.[String(sc.id)],
      ...section.image_details?.[String(sc.id)],
      width: sc.display_width ?? 100,
      savedWidth: sc.display_width ?? 100,
      savedSection: sc.section ?? DEFAULT_SECTIONS[0].title,
    });
  }
  return restored.map(section => ({...section,images:restoreImageLayout(section.images,section.image_layout)}));
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
  const entryFields = useEntryFieldPreferences(journalId);
  const [customizingSection, setCustomizingSection] = useState(null);
  const [saveConfigurationOpen, setSaveConfigurationOpen] = useState(false);
  const [configurationScope, setConfigurationScope] = useState("journal");
  const [exitPending, setExitPending] = useState(false);
  const pendingExit = useRef(null);
  const [configurationNotice, setConfigurationNotice] = useState(null);
  useEffect(() => {
    if (!configurationNotice) return;
    const timer = setTimeout(() => setConfigurationNotice(null), 4000);
    return () => clearTimeout(timer);
  }, [configurationNotice]);
  useEffect(() => {
    if (!open || !entryFields.dirty) return;
    const warn = event => {event.preventDefault();event.returnValue = "";};
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [open, entryFields.dirty]);
  const draftFlush = useRef(null);
  const exiting=useRef(false);
  const requestExit = async (action = onClose) => {
    if (isSubmitting || exiting.current) return;
    exiting.current=true;
    try {
    const preserved=await draftFlush.current?.();
    if(preserved===false)return;
    if (entryFields.saving) return;
    if (!entryFields.dirty) {await action();return;}
    pendingExit.current = action;
    setExitPending(true);
    setSaveConfigurationOpen(true);
    } finally {exiting.current=false;}
  };
  const dismissConfiguration = () => {
    if (entryFields.saving) return;
    setSaveConfigurationOpen(false);
    setExitPending(false);
    pendingExit.current = null;
  };
  const toggleCustomization = section => {
    if (section === null && entryFields.dirty) {
      setExitPending(false);
      pendingExit.current = null;
      setSaveConfigurationOpen(true);
    } else setCustomizingSection(section);
  };
  const saveConfiguration = async () => {
    if (await entryFields.save(configurationScope)) {
      const action = pendingExit.current;
      setSaveConfigurationOpen(false);
      setExitPending(false);
      pendingExit.current = null;
      setCustomizingSection(null);
      setConfigurationNotice({message:configurationScope === "future" ? "Layout saved for this journal and future journals." : "Layout saved for this journal."});
      action?.();
    }
  };
  const discardConfiguration = () => {
    const action = pendingExit.current;
    entryFields.discard();
    dismissConfiguration();
    setCustomizingSection(null);
    action?.();
  };
  const [wasOpen, setWasOpen] = useState(open);
  if (wasOpen !== open) {
    setWasOpen(open);
    if (!open) setCustomizingSection(null);
  }
  const isEdit = mode === "edit";
  const [manageOptions, setManageOptions] = useState(null);
  const { options: trendOptions, add: addTrend, update: updateTrend, remove: removeTrend } = useSetupOptions("trends");
  const { options: sessionOptions, add: addSession, update: updateSession, remove: removeSession } = useSetupOptions("sessions");
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

  const [notesSections, setNotesSections] = useState(() => buildSections(trade?.screenshots, trade?.notes_document));
  const [generalDocument, setGeneralDocument] = useState(() => trade?.notes_document?.general ?? documentFromText(trade?.notes));
  const savedDraftId = useRef(null);
  const [removedImageIds,setRemovedImageIds]=useState([]);
  const [discardDraftOpen,setDiscardDraftOpen]=useState(false);
  const notesDirty = useRef(false);
  const hydratedDraft = useRef(null);
  const [draftSource, setDraftSource] = useState({ open, tradeId: trade?.id, mode });
  // A new draft must not retain the previous trade's attachments.
  if (draftSource.open !== open || draftSource.tradeId !== trade?.id || draftSource.mode !== mode) {
    setDraftSource({ open, tradeId: trade?.id, mode });
    if (open) {
      setNotesSections(buildSections(trade?.screenshots, trade?.notes_document));
      setGeneralDocument(trade?.notes_document?.general ?? documentFromText(trade?.notes));

    }
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
    if (!open) { hydratedDraft.current = null; return; }
    const identity = `${mode}:${trade?.id ?? 'new'}:${journalId}:${timezone}`;
    // A parent may refresh the same trade after the first save. Keep any
    // pending image layout changes intact so partial-save retries are safe.
    if (hydratedDraft.current === identity) return;
    hydratedDraft.current = identity;
    savedDraftId.current = null;
    setRemovedImageIds([]);
    notesDirty.current = false;
    reset(tradeToDefaults(trade, timezone));
    if (mode === "edit" && trade?.id && journalId) {
      // The list endpoint doesn't include screenshots; fetch the detail to populate them.
      let cancelled = false;
      fetchTrade(journalId, trade.id)
        .then((full) => {
          if (!cancelled && !notesDirty.current) {
            setNotesSections(buildSections(full.screenshots, full.notes_document));
            setGeneralDocument(full.notes_document?.general ?? documentFromText(full.notes));
            setValue("notes", full.notes_document?.version === 1 ? documentText(full.notes_document.general) : full.notes ?? "");
          }
        })
        .catch(() => {
          if (!cancelled) setNotesSections(buildSections(trade?.screenshots, trade?.notes_document));
        });
      return () => {
        cancelled = true;
      };
    }
  }, [open, trade, reset, mode, journalId, timezone, setValue]);

  const allValues=useWatch({control});
  const draft=useTradeDraft({open,identity:`${auth?.user?.id ?? auth?.user?.email ?? 'browser'}:${journalId}:${mode}:${trade?.id ?? 'new'}:${timezone}`,
    snapshot:{values:allValues,sections:notesSections,generalDocument,pnlUnit,riskUnit,removedImageIds},
    getSavedTradeId:()=>savedDraftId.current,
    onRestore:stored=>{notesDirty.current=true;reset(stored.values);setNotesSections(restoreDraftImages(stored.sections));setGeneralDocument(stored.generalDocument);setPnlUnit(stored.pnlUnit);setRiskUnit(stored.riskUnit);setRemovedImageIds(stored.removedImageIds??[]);savedDraftId.current=stored.savedTradeId??null;},
  });
  useLayoutEffect(()=>{draftFlush.current=draft.flush;});

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
      notes: [values.notes, ...notesSections.flatMap(section => [section.text,...section.images.map(image=>documentText(image.afterContent))])].filter(Boolean).join("\n\n") || null,
      notes_document: { version: 1, general: generalDocument, sections: notesSections.map(section => ({id:String(section.id).slice(0,100),title:section.title.slice(0,100),content:section.content ?? documentFromText(section.text),image_layout:serializeImageLayout(section.images),image_notes:serializeImageNotes(section.images),image_details:serializeImageDetails(section.images)})) },
      custom_fields: values.custom_fields ?? {},
      // Catalog ID fields — replace raw strings with backend IDs
      asset_id: catalog.assetMap.get(values.asset) ?? null,
      emotion_ids: values.emotions.map((l) => catalog.emotionMap.get(l)).filter(Boolean),
      mistake_ids: values.mistakes.map((l) => catalog.mistakeMap.get(l)).filter(Boolean),
      setup_id: values.setup ? (catalog.setupMap.get(values.setup) ?? null) : null,
    };
    try {
      const savedTrade = await onSave(payload, savedDraftId.current);
      const tradeId = savedDraftId.current ?? (isEdit ? trade.id : savedTrade?.id);
      savedDraftId.current = tradeId;
      if (tradeId && journalId) {
        const updates = new Map();
        const tasks = notesSections.flatMap(section => section.images.map(image => async () => {
          if (image.file) {
            const uploaded = await uploadScreenshot(journalId, tradeId, image.file, section.title, image.width ?? 100);
            updates.set(image.id, {...image,file:null,screenshotId:uploaded.id,preview:uploaded.image_url,width:uploaded.display_width ?? image.width ?? 100,savedWidth:uploaded.display_width ?? image.width ?? 100,savedSection:section.title});
          } else if (image.screenshotId && ((image.width ?? 100) !== (image.savedWidth ?? 100) || section.title !== image.savedSection)) {
            await updateScreenshotWidth(journalId, tradeId, image.screenshotId, image.width ?? 100, section.title);
            updates.set(image.id,{...image,savedWidth:image.width,savedSection:section.title});
          }
        }));
        const results = await Promise.allSettled(tasks.map(task => task()));
        setNotesSections(current => current.map(section => ({...section,images:section.images.map(image => updates.get(image.id) ?? image)})));
        if (results.some(result => result.status === 'rejected')) {
          setError("root", {message:"Trade notes saved, but some images could not be saved. Try saving again to retry the remaining images."});
          requestAnimationFrame(() => document.getElementById("trade-save-error")?.scrollIntoView({block:"center"}));
          return;
        }
        const completedDocument = {...payload.notes_document,sections:payload.notes_document.sections.map((section,index)=>({...section,image_layout:serializeImageLayout(notesSections[index].images.map(image=>updates.get(image.id)??image)),image_notes:serializeImageNotes(notesSections[index].images.map(image=>updates.get(image.id)??image)),image_details:serializeImageDetails(notesSections[index].images.map(image=>updates.get(image.id)??image))}))};
        if (JSON.stringify(completedDocument) !== JSON.stringify(payload.notes_document)) {
          try { await onSave({notes_document:completedDocument},tradeId); }
          catch {
            setError("root", {message:"Trade notes and images were saved, but their layout could not be saved. Save again to retry."});
            requestAnimationFrame(() => document.getElementById("trade-save-error")?.scrollIntoView({block:"center"}));
            return;
          }
        }

      }
      const present=new Set(notesSections.flatMap(section=>section.images.map(image=>image.screenshotId)));
      for(const id of removedImageIds)if(!present.has(id))await deleteScreenshot(journalId,(savedDraftId.current ?? trade?.id),id);
      setRemovedImageIds([]);
      await draft.clear();
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

  function handleDeleteBackendImage(screenshotId) {
    setRemovedImageIds(ids=>ids.includes(screenshotId)?ids:[...ids,screenshotId]);
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await onDelete(trade.id);
      await draft.clear();
      setDeleteOpen(false);
      onClose();
    } catch {
      setDeleting(false);
    }
  }

  const configurationNotification = configurationNotice && <div role="status" aria-live="polite" className="fixed bottom-6 left-1/2 z-[100] w-max max-w-[calc(100vw-2rem)] -translate-x-1/2 rounded-lg border border-emerald-500/30 bg-zinc-900 px-4 py-3 text-sm text-emerald-300 shadow-lg">{configurationNotice.message}</div>;

  return (
    <>
      <Sheet open={open} onOpenChange={(v) => !v && requestExit()}>
        <SheetContent
          onEscapeKeyDown={event => {
            // An expanded field handles Escape before the enclosing trade sheet.
            if (document.querySelector('[data-slot="sheet-content"] [data-option-panel]')) event.preventDefault();
          }}
          className={`flex flex-col ${resizing ? "select-none" : ""}`}
          style={{ maxWidth: `${panelWidth}px`, transition: "none" }}
          data-wide-review={panelWidth > 760}
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
          <SheetHeader>
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

          <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-border px-6 py-2 text-xs text-muted-foreground">
            <span role="status" aria-live="polite">{t(({loading:'Loading draft…',ready:'Drafts save on this device',saving:'Saving draft…',saved:'Draft saved on this device',restored:'Draft restored',error:'Draft could not be saved. Keep this dialog open.'})[draft.status])}</span>
            <button type="button" onClick={()=>setDiscardDraftOpen(true)} className="min-h-9 rounded px-2 hover:bg-secondary">{t('Discard draft')}</button>
          </div>
          {configurationNotification}
          <SheetBody className="trade-panel-body">
            <form id="trade-form" onSubmit={event => {event.preventDefault();requestExit(() => handleSubmit(submit)());}} noValidate>
              {errors.root && (
                <p id="trade-save-error" role="alert" className="mb-4 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
                  {t(errors.root.message)}
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
                  <EntrySectionHeader section="execution" title={t("Execution")} active={customizingSection === "execution"} onToggle={toggleCustomization} />
                  <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-x-4 gap-y-4">
                    <F
                      label={entryFields.label("asset", t("Asset")) + " *"}
                      error={errors.asset?.message}
                      span2
                      action={<EntryFieldActions active={customizingSection === "execution"} id="asset" label={t("Asset")} settings={entryFields} onEditOptions={() => setManageAssetsOpen(true)} />}
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
                            onUpdateAsset={catalog.updateAsset} onDeleteAsset={catalog.removeAsset}
                          />
                        )}
                      />
                    </F>

                    <F label={entryFields.label("side", t("Side")) + " *"} action={<EntryFieldActions active={customizingSection === "execution"} id="side" label={t("Side")} settings={entryFields} />} error={errors.side?.message}>
                      <div className="flex gap-2">
                        {["BUY", "SELL"].map((s) => {
                          const active = watchedSide === s;
                          return (
                            <button
                              key={s}
                              aria-pressed={active}
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
                      label={entryFields.label("entry_datetime", t("Entry date/time")) + " *"} action={<EntryFieldActions active={customizingSection === "execution"} id="entry_datetime" label={entryFields.label("entry_datetime", t("Entry date/time"))} settings={entryFields} />}
                      id="trade-entry_datetime"
                      error={errors.entry_datetime?.message}
                    >
                      <Controller
                        name="entry_datetime"
                        control={control}
                        render={({ field }) => (
                          <DateTimePicker
                            id="trade-entry_datetime"
                            label={entryFields.label("entry_datetime", t("Entry date/time"))}
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
                      label={entryFields.label("exit_datetime", t("Exit date/time"))} action={<EntryFieldActions active={customizingSection === "execution"} id="exit_datetime" label={entryFields.label("exit_datetime", t("Exit date/time"))} settings={entryFields} />}
                      id="trade-exit_datetime"
                      error={errors.exit_datetime?.message}
                    >
                      <Controller
                        name="exit_datetime"
                        control={control}
                        render={({ field }) => (
                          <DateTimePicker
                            id="trade-exit_datetime"
                            label={entryFields.label("exit_datetime", t("Exit date/time"))}
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
                      label={entryFields.label("risk_percent", t("Risk"))}
                      id="trade-risk"
                      error={errors.risk_percent?.message}
                      action={
                        <EntryFieldActions active={customizingSection === "execution"} id="risk_percent" label={t("Risk")} settings={entryFields}><FieldModeToggle
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
                        /></EntryFieldActions>
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
                    onUpdateOptions={customFields.updateOptions}
                    disabled={customFields.loading || !!customFields.error}
                    showAdd={false}
                  />
                </section>

                {/* ── Performance ── */}
                <section>
                  <EntrySectionHeader section="performance" title={t("Performance")} active={customizingSection === "performance"} onToggle={toggleCustomization} />
                  <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-x-4 gap-y-4">
                    <F
                      label={entryFields.label("pnl_r", t("PnL"))}
                      error={errors.pnl_r?.message}
                      span2
                      action={
                        <EntryFieldActions active={customizingSection === "performance"} id="pnl_r" label={t("PnL")} settings={entryFields}><FieldModeToggle
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
                        /></EntryFieldActions>
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

                    <F label={entryFields.label("status", t("Status"))} action={<EntryFieldActions active={customizingSection === "performance"} id="status" label={t("Status")} settings={entryFields} />} span2>
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

                    {entryFields.visible("commission") && (<F label={entryFields.label("commission", t("Commission"))} action={<EntryFieldActions active={customizingSection === "performance"} id="commission" label={t("Commission")} settings={entryFields} />} error={errors.commission?.message}>
                      <DollarInput placeholder="0.00" {...register("commission")} />
                    </F>)}

                    {entryFields.visible("swap") && (<F label={entryFields.label("swap", t("Swap"))} action={<EntryFieldActions active={customizingSection === "performance"} id="swap" label={t("Swap")} settings={entryFields} />} error={errors.swap?.message}>
                      <DollarInput placeholder="0.00" {...register("swap")} />
                    </F>)}
                  </div>
                  <TradeCustomFields
                    section="performance"
                    fields={customFields.fields}
                    control={control}
                    errors={errors}
                    onCreate={customFields.create}
                    onRemove={removeCustomField}
                    onUpdateOptions={customFields.updateOptions}
                    disabled={customFields.loading || !!customFields.error}
                    showAdd={false}
                  />
                {customizingSection === "performance" && <EntryFieldPreferences section="performance" settings={entryFields} />}
                </section>

                {/* ── Setup ── */}
                <section>
                  <EntrySectionHeader section="setup" title={t("Setup")} active={customizingSection === "setup"} onToggle={toggleCustomization} />
                  {customizingSection === "setup" && <p className="mb-3 text-xs text-zinc-500">Edit names and choices, or remove fields from your entry.</p>}
                  <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-x-4 gap-y-4">
                    {entryFields.visible("reference_timeframe") && (<F label={entryFields.label("reference_timeframe", t("Reference TF"))} id="trade-reference_timeframe" action={<EntryFieldActions active={customizingSection === "setup"} id="reference_timeframe" label={t("Reference TF")} settings={entryFields} onEditOptions={() => setManageOptions("timeframes")} />}>
                      <Controller
                        name="reference_timeframe"
                        control={control}
                        render={({ field }) => (
                          <TimeframeField
                            id="trade-reference_timeframe"
                            label={entryFields.label("reference_timeframe", t("Reference TF"))}
                            value={field.value}
                            onValueChange={field.onChange}
                            onBlur={field.onBlur}
                            ref={field.ref}
                          />
                        )}
                      />
                    </F>)}

                    {entryFields.visible("trade_score") && (<F
                      label={entryFields.label("trade_score", t("Trade score"))}
                      id="trade-trade_score"
                      error={errors.trade_score?.message}
                      action={
                        <EntryFieldActions active={customizingSection === "setup"} id="trade_score" label={t("Trade score")} settings={entryFields}><FieldModeToggle
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
                        /></EntryFieldActions>
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
                    </F>)}

                    {entryFields.visible("opportunity_timeframe") && (<F label={entryFields.label("opportunity_timeframe", t("Opportunity TF"))} id="trade-opportunity_timeframe" action={<EntryFieldActions active={customizingSection === "setup"} id="opportunity_timeframe" label={t("Opportunity TF")} settings={entryFields} onEditOptions={() => setManageOptions("timeframes")} />}>
                      <Controller
                        name="opportunity_timeframe"
                        control={control}
                        render={({ field }) => (
                          <TimeframeField
                            id="trade-opportunity_timeframe"
                            label={entryFields.label("opportunity_timeframe", t("Opportunity TF"))}
                            value={field.value}
                            onValueChange={field.onChange}
                            onBlur={field.onBlur}
                            ref={field.ref}
                          />
                        )}
                      />
                    </F>)}

                    {entryFields.visible("entry_timeframe") && (<F label={entryFields.label("entry_timeframe", t("Entry TF"))} id="trade-entry_timeframe" action={<EntryFieldActions active={customizingSection === "setup"} id="entry_timeframe" label={t("Entry TF")} settings={entryFields} onEditOptions={() => setManageOptions("timeframes")} />}>
                      <Controller
                        name="entry_timeframe"
                        control={control}
                        render={({ field }) => (
                          <TimeframeField
                            id="trade-entry_timeframe"
                            label={entryFields.label("entry_timeframe", t("Entry TF"))}
                            value={field.value}
                            onValueChange={field.onChange}
                            onBlur={field.onBlur}
                            ref={field.ref}
                          />
                        )}
                      />
                    </F>)}

                    {entryFields.visible("trend_direction") && (<F label={entryFields.label("trend_direction", t("Trend"))} id="trade-trend_direction" action={<EntryFieldActions active={customizingSection === "setup"} id="trend_direction" label={t("Trend")} settings={entryFields} onEditOptions={() => setManageOptions("trends")} />}>
                      <Controller
                        name="trend_direction"
                        control={control}
                        render={({ field }) => (
                          <OptionCombobox translateOptions
                            id="trade-trend_direction"
                            label={entryFields.label("trend_direction", t("Trend"))}
                            value={field.value}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            ref={field.ref}
                            options={trendOptions}
                            onCreate={label => addTrend({value:label,label})} onUpdate={updateTrend} onDelete={removeTrend} maxLength={20}
                            placeholder={t("Select trend")}
                          />
                        )}
                      />
                    </F>)}

                    {entryFields.visible("session") && (<F label={entryFields.label("session", t("Session"))} id="trade-session" action={<EntryFieldActions active={customizingSection === "setup"} id="session" label={t("Session")} settings={entryFields} onEditOptions={() => setManageOptions("sessions")} />}>
                      <Controller
                        name="session"
                        control={control}
                        render={({ field }) => (
                          <OptionCombobox translateOptions
                            id="trade-session"
                            label={entryFields.label("session", t("Session"))}
                            value={field.value}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            ref={field.ref}
                            options={sessionOptions}
                            onCreate={label => addSession({value:label,label})} onUpdate={updateSession} onDelete={removeSession} maxLength={50}
                            placeholder={t("Select session")}
                          />
                        )}
                      />
                    </F>)}

                    {entryFields.visible("setup") && (<F
                      label={entryFields.label("setup", t("Setup"))}
                      span2
                      action={<EntryFieldActions active={customizingSection === "setup"} id="setup" label={t("Setup")} settings={entryFields} onEditOptions={() => setManageSetupsOpen(true)} />}
                    >
                      <Controller
                        name="setup"
                        control={control}
                        render={({ field }) => (
                          <CatalogCombobox
                            value={field.value ?? ""}
                            onChange={field.onChange}
                            options={catalog.setups}
                            label="Setup" onCreateOption={catalog.addSetup}
                            onUpdateOption={catalog.updateSetup} onDeleteOption={catalog.removeSetup}
                            placeholder={t("Select or type a setup…")}
                          />
                        )}
                      />
                    </F>)}
                  </div>
                  <TradeCustomFields
                    section="setup"
                    fields={customFields.fields}
                    control={control}
                    errors={errors}
                    onCreate={customFields.create}
                    onRemove={removeCustomField}
                    onUpdateOptions={customFields.updateOptions}
                    disabled={customFields.loading || !!customFields.error}
                    showAdd={false}
                  />
                {customizingSection === "setup" && <EntryFieldPreferences section="setup" settings={entryFields} />}
                </section>

                {/* ── Psychology ── */}
                <section>
                  <EntrySectionHeader section="psychology" title={t("Psychology")} active={customizingSection === "psychology"} onToggle={toggleCustomization} />
                  {customizingSection === "psychology" && <p className="mb-3 text-xs text-zinc-500">Edit names and choices, or remove fields from your entry.</p>}
                  <div className="space-y-3">
                    {entryFields.visible("emotions") && (<F
                      label={entryFields.label("emotions", t("Emotion"))}
                      error={errors.emotions?.message}
                      span2
                      action={<EntryFieldActions active={customizingSection === "psychology"} id="emotions" label={t("Emotion")} settings={entryFields} onEditOptions={() => setManageEmotionsOpen(true)} />}
                    >
                      <TagPicker
                        selected={watchedEmotions}
                        onChange={(v) => setValue("emotions", v, { shouldValidate: true })}
                        options={catalog.emotionTags}
                        maxLength={50} label="Emotion" onCreateTag={catalog.addEmotionTag}
                        onUpdateTag={catalog.updateEmotionTag} onDeleteTag={catalog.removeEmotionTag}
                        placeholder={t("Select emotions…")}
                      />
                    </F>)}

                    {entryFields.visible("mistakes") && (<F
                      label={entryFields.label("mistakes", t("Mistake"))}
                      span2
                      action={<EntryFieldActions active={customizingSection === "psychology"} id="mistakes" label={t("Mistake")} settings={entryFields} onEditOptions={() => setManageMistakesOpen(true)} />}
                    >
                      <TagPicker
                        selected={watchedMistakes}
                        onChange={(v) => setValue("mistakes", v)}
                        options={catalog.mistakeTags}
                        maxLength={50} label="Mistake" onCreateTag={catalog.addMistakeTag}
                        onUpdateTag={catalog.updateMistakeTag} onDeleteTag={catalog.removeMistakeTag}
                        placeholder={t("Select mistakes…")}
                        emptyText="No errors"
                      />
                    </F>)}
                  </div>
                  <TradeCustomFields
                    section="psychology"
                    fields={customFields.fields}
                    control={control}
                    errors={errors}
                    onCreate={customFields.create}
                    onRemove={removeCustomField}
                    onUpdateOptions={customFields.updateOptions}
                    disabled={customFields.loading || !!customFields.error}
                    showAdd={false}
                  />
                {customizingSection === "psychology" && <EntryFieldPreferences section="psychology" settings={entryFields} />}
                </section>

                {/* ── Notes ── */}
                <section>
                  <EntrySectionHeader section="notes" title={t("Notes")} active={customizingSection === "notes"} onToggle={toggleCustomization} />
                  <F label={entryFields.label("notes", t("General trade notes"))} action={<EntryFieldActions active={customizingSection === "notes"} id="notes" label={t("General trade notes")} settings={entryFields} />}>
                  <RichNotesEditor label={entryFields.label("notes", t("General trade notes"))} value={generalDocument} onChange={(content,text) => {notesDirty.current=true;setGeneralDocument(content);setValue("notes",text,{shouldDirty:true});}} />
                  </F>
                  <TradeCustomFields
                    section="notes"
                    fields={customFields.fields}
                    control={control}
                    errors={errors}
                    onCreate={customFields.create}
                    onRemove={removeCustomField}
                    onUpdateOptions={customFields.updateOptions}
                    disabled={customFields.loading || !!customFields.error}
                    showAdd={false}
                  />
                </section>

                {/* ── Trade Notes ── */}
                <section>
                  <EntrySectionHeader section="trade_notes" title={t("Trade Notes")} active={customizingSection === "trade_notes"} onToggle={toggleCustomization} />
                  <F label={entryFields.label("trade_notes", t("Trade Notes"))} action={<EntryFieldActions active={customizingSection === "trade_notes"} id="trade_notes" label={t("Trade Notes")} settings={entryFields} />}>
                  <TradeNotesEditor
                    sections={notesSections}
                    onChange={sections => {notesDirty.current=true;setNotesSections(sections);}}
                    onDeleteImage={handleDeleteBackendImage}
                    wide={panelWidth > 760}
                    onToggleWide={() => setPanelWidth(width => width > 760 ? 560 : Math.min(window.innerWidth, 1100))}
                  />
                  </F>
                  <TradeCustomFields
                    section="trade_notes"
                    fields={customFields.fields}
                    control={control}
                    errors={errors}
                    onCreate={customFields.create}
                    onRemove={removeCustomField}
                    onUpdateOptions={customFields.updateOptions}
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
              <Button type="button" variant="outline" size="sm" onClick={() => requestExit()}>{t("Cancel")}</Button>
              <Button
                type="submit"
                form="trade-form"
                size="sm"
                disabled={isSubmitting || catalog.loading || draft.status === "loading"}
              >
                {isSubmitting ? t("Saving…") : t("Save Trade")}
              </Button>
            </div>
          </SheetFooter>
          {/* Keep portaled options in the sheet's React tree so touch dismissal stays local. */}
          {manageOptions && <SetupOptionManager key={manageOptions} kind={manageOptions} onClose={() => setManageOptions(null)} />}
        </SheetContent>
      </Sheet>

      <Dialog open={discardDraftOpen} onOpenChange={setDiscardDraftOpen}><DialogContent>
        <DialogHeader><DialogTitle>{t('Discard draft?')}</DialogTitle><DialogDescription>{t('Remove your unsaved changes and return to the saved trade.')}</DialogDescription></DialogHeader>
        <DialogFooter><Button type="button" variant="outline" onClick={()=>setDiscardDraftOpen(false)}>{t('Keep editing')}</Button><Button type="button" variant="destructive" onClick={async()=>{await draft.clear();reset(tradeToDefaults(trade,timezone));setNotesSections(buildSections(trade?.screenshots,trade?.notes_document));setGeneralDocument(trade?.notes_document?.general??documentFromText(trade?.notes));setRemovedImageIds([]);setDiscardDraftOpen(false);onClose();}}>{t('Discard draft')}</Button></DialogFooter>
      </DialogContent></Dialog>
      <Dialog open={saveConfigurationOpen} onOpenChange={value => {if (!value) dismissConfiguration();}}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{exitPending ? "Unsaved layout changes" : "Save entry configuration"}</DialogTitle>
            <DialogDescription>{exitPending ? "Save your layout before leaving, or discard your layout changes. Trade values are kept separate." : entryFields.accountBacked ? "Save your field names and visibility to your account." : "Save your field names and visibility in this browser."}</DialogDescription>
          </DialogHeader>
          <fieldset disabled={entryFields.saving} className="space-y-3">
            <legend className="sr-only">Apply configuration to</legend>
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3">
              <input type="radio" name="configuration-scope" value="journal" checked={configurationScope === "journal"} onChange={() => setConfigurationScope("journal")} className="mt-1 accent-emerald-400" />
              <span><span className="block text-sm font-medium">This journal only</span><span className="text-xs text-muted-foreground">Reuse this layout for every trade in this journal.</span></span>
            </label>
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3">
              <input type="radio" name="configuration-scope" value="future" checked={configurationScope === "future"} onChange={() => setConfigurationScope("future")} className="mt-1 accent-emerald-400" />
              <span><span className="block text-sm font-medium">This journal and all future journals</span><span className="text-xs text-muted-foreground">Use as your default. Other existing journals keep their layouts.</span></span>
            </label>
          </fieldset>
          {entryFields.error && <p role="alert" className="text-sm text-red-400">{entryFields.error}</p>}
          <DialogFooter className="sm:flex-wrap">
            <Button type="button" variant="outline" disabled={entryFields.saving} onClick={dismissConfiguration}>Keep editing</Button>
            {exitPending && <Button type="button" variant="outline" disabled={entryFields.saving} onClick={discardConfiguration}>Discard layout changes</Button>}
            <Button type="button" disabled={entryFields.saving} onClick={saveConfiguration}>{entryFields.saving ? "Saving…" : "Save configuration"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {!open && configurationNotification}

      {/* Delete confirmation */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="border-zinc-800 bg-zinc-950 sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("Delete trade?")}</DialogTitle>
            <DialogDescription>{t("This trade will be permanently removed. This action cannot be undone.")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={deleting}>{t("Cancel")}</Button>
            <Button variant="destructive" onClick={() => {setDeleteOpen(false);requestExit(handleDelete);}} disabled={deleting}>
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
