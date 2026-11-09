import { translate as t } from "@/i18n/language";
import { useLanguage } from "@/i18n/useLanguage";
import { Fragment, useState, useContext } from "react";
import { JournalContext } from "@/journals/JournalContext";
import { tradeAmount, riskDisplayAmount, formatValue } from "@/lib/analytics";
import { formatDate } from "@/lib/formatters";
import { getUserTimezone, zonedDate } from "@/lib/timezone";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetBody,
} from "@/components/ui/sheet";
import { imageSectionOwners, restoreImageLayout } from "@/lib/imageLayout";
import { documentText } from "@/lib/noteDocument";
import RichNotesContent from "@/components/notes/RichNotesContent";
import { Button } from "@/components/ui/button";
import TradeImage from "./TradeImage";
import ImageLightbox from "./ImageLightbox";

const STATUS_COLORS = {
  WIN:  "bg-emerald-500/15 text-emerald-400 ring-emerald-500/20",
  LOSS: "bg-red-500/15 text-red-400 ring-red-500/20",
  BE:   "bg-zinc-700/40 text-zinc-400 ring-zinc-600/20",
  OPEN: "bg-amber-500/15 text-amber-400 ring-amber-500/20",
};

const SIDE_COLORS = {
  BUY:  "bg-emerald-500/10 text-emerald-400",
  SELL: "bg-red-500/10 text-red-400",
};

function Field({ label, value, className = "" }) {
  useLanguage();
  if (value == null || value === "") return null;
  return (
    <div className={`space-y-0.5 ${className}`}>
      <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-600">{t(label)}</p>
      <p className="text-sm text-zinc-200">{value}</p>
    </div>
  );
}

function Badge({ children, colorClass }) {
  useLanguage();
  return (
    <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold uppercase tracking-wide ring-1 ${colorClass}`}>
      {children}
    </span>
  );
}

function formatDatetime(iso) {
  if (!iso) return "—";
  return zonedDate(iso).toISOString().replace("T", " ").slice(0, 16) + ` ${getUserTimezone()}`;
}

export default function TradeDetailPanel({ trade, open, onClose }) {
  useLanguage();
  const context = useContext(JournalContext);
  const unit = context?.activeJournal?.display_unit || "R";
  const [wide, setWide] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState(null);
  if (!trade) return null;
  const screenshots = trade.screenshots ?? [];
  const usedImages = new Set();
  const owners = imageSectionOwners(trade.notes_document?.version===1 ? trade.notes_document.sections : []);
  const noteSections = trade.notes_document?.version === 1 ? (trade.notes_document.sections ?? []).map(section => {
    const images = screenshots.filter(image => (owners.has(String(image.id)) ? owners.get(String(image.id))===section.id : image.section === section.title) && !usedImages.has(image));
    images.forEach(image => usedImages.add(image));
    return {...section, images:restoreImageLayout(images,section.image_layout)};
  }) : [];
  const otherImages = screenshots.filter(image => !usedImages.has(image));
  const widthToggle = screenshots.length > 0 && <Button type="button" variant="outline" size="sm" className="hidden md:flex" aria-pressed={wide} onClick={() => setWide(value => !value)}>{wide ? t("Standard width") : t("Wide review")}</Button>;
  function renderImages(images) {
    return <div className="trade-note-images">{images.map((image,index) => <Fragment key={image.id}>{index>0 && image.startRow && <span className="trade-image-break" aria-hidden="true"/>}<TradeImage key={image.id} src={image.image_url} width={image.display_width ?? 100}
      label={image.section ? t("{section} · Screenshot {number}", {section:image.section,number:screenshots.indexOf(image)+1}) : t("Screenshot {number}",{number:screenshots.indexOf(image)+1})}
      onOpen={() => setLightboxSrc(image.image_url)} /></Fragment>)}</div>;
  }


  const statusColor = STATUS_COLORS[trade._derivedStatus] ?? STATUS_COLORS.BE;
  const sideColor = SIDE_COLORS[trade.side] ?? "";

  return (
    <>
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent style={{maxWidth: wide ? "1100px" : "560px"}}>
        <SheetHeader onClose={onClose}>
          <SheetTitle className="text-base font-semibold">
            {typeof trade.asset === "object" ? trade.asset?.symbol : trade.asset}
            {trade.side && (
              <Badge colorClass={sideColor + " ring-0 ml-2"}>{trade.side}</Badge>
            )}
          </SheetTitle>
          <SheetDescription className="flex items-center gap-2">
            {trade._derivedStatus && (
              <Badge colorClass={statusColor}>{trade._derivedStatus === "BE" ? "BREAKEVEN" : trade._derivedStatus}</Badge>
            )}
            <span className="text-xs text-zinc-500">
              {trade.entry_datetime ? formatDate(zonedDate(trade.entry_datetime).toISOString().slice(0, 10)) : "—"}
            </span>
          </SheetDescription>
        </SheetHeader>

        <SheetBody>
          <div className="space-y-6">

            {/* Execution */}
            <section>
              <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">{t("Execution")}</h3>
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                <Field label={t("Entry")} value={formatDatetime(trade.entry_datetime)} />
                <Field label={t("Exit")} value={trade.exit_datetime ? formatDatetime(trade.exit_datetime) : "Still open"} />
                <Field label={t("Side")} value={trade.side} />
                <Field label={t("Risk")} value={formatValue(riskDisplayAmount(trade,unit),unit,{signed:false})} />
              </div>
            </section>

            {/* Performance */}
            <section>
              <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">{t("Performance")}</h3>
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                <Field label={t("PnL")} value={formatValue(tradeAmount(trade,unit),unit)} />
                <Field label={t("Commission")} value={trade.commission != null ? String(trade.commission) : null} />
                <Field label="Swap" value={trade.swap != null ? String(trade.swap) : null} />
              </div>
            </section>

            {/* Setup */}
            <section>
              <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">{t("Setup")}</h3>
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                <Field label={t("Reference TF")} value={trade.reference_timeframe} />
                <Field label={t("Trade score")} value={trade.trade_score != null ? `${trade.trade_score} / 10` : null} />
                <Field label={t("Opportunity TF")} value={trade.opportunity_timeframe} />
                <Field label={t("Entry TF")} value={trade.entry_timeframe} />
                <Field label={t("Trend")} value={trade.trend_direction} />
                <Field label={t("Setup")} value={typeof trade.setup === "object" ? trade.setup?.label : trade.setup} />
                <Field label={t("Session")} value={trade.session} />
              </div>
            </section>

            {/* Psychology — placeholder for Phase 2 editing */}
            {(trade.emotion || trade.mistake) && (
              <section>
                <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">{t("Psychology")}</h3>
                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                  <Field label={t("Emotion")} value={trade.emotion} />
                  <Field label={t("Mistake")} value={trade.mistake} />
                </div>
              </section>
            )}

            {/* Keep each saved note and its screenshots together in one reading flow. */}
            {(trade.notes || trade.notes_document?.version === 1) && (
              <section className="rich-notes-readonly space-y-4">
                <div className="flex items-center justify-between gap-3"><h3 className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">{t("Notes")}</h3>{widthToggle}</div>
                {trade.notes_document?.version === 1 ? <>
                  {documentText(trade.notes_document.general).trim() && <RichNotesContent document={trade.notes_document.general}/>}
                  {noteSections.filter(section => documentText(section.content).trim() || section.images.length).map(section => <div key={section.id} className="space-y-3">
                    <h4 className="text-sm font-medium">{section.title}</h4>
                    {documentText(section.content).trim() && <RichNotesContent document={section.content}/>}
                    {section.images.length > 0 && renderImages(section.images)}
                  </div>)}
                </> : <p className="whitespace-pre-wrap text-sm">{trade.notes}</p>}
              </section>
            )}

            {otherImages.length > 0 && (
              <section>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">{t("Screenshots")}</h3>
                  {!(trade.notes || trade.notes_document?.version === 1) && widthToggle}
                </div>
                {renderImages(otherImages)}
              </section>
            )}

          </div>
        </SheetBody>
        {/* Keep viewer touch events inside the trade sheet's interaction tree. */}
        {lightboxSrc && <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />}
      </SheetContent>
    </Sheet>

    </>
  );
}
