import { fetchTrade } from "@/api/trades.api";
import { useAsyncQuery } from "@/hooks/useAsyncQuery";
import { translate as t } from "@/i18n/language";
import { useLanguage } from "@/i18n/useLanguage";
import { useCallback, useState, useContext } from "react";
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

export default function TradeDetailPanel({ trade: summaryTrade, open, onClose }) {
  useLanguage();
  const context = useContext(JournalContext);
  const unit = context?.activeJournal?.display_unit || "R";
  const journalId = context?.activeJournal?.id ?? context?.activeWorkspace?.id;
  const tradeId = summaryTrade?.id;
  const loadDetail = useCallback(() => fetchTrade(journalId, tradeId), [journalId, tradeId]);
  const details = useAsyncQuery(loadDetail, [journalId, tradeId], {
    enabled: !!(open && summaryTrade?.analytics_only && journalId && tradeId),
  });
  const trade = details.data?.id === tradeId ? { ...summaryTrade, ...details.data } : summaryTrade;

  const [lightboxSrc, setLightboxSrc] = useState(null);
  if (!trade) return null;

  const statusColor = STATUS_COLORS[trade._derivedStatus] ?? STATUS_COLORS.BE;
  const sideColor = SIDE_COLORS[trade.side] ?? "";

  return (
    <>
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent>
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
          {details.loading && <p role="status">{t("Loading…")}</p>}
          {details.error && <p role="alert">{details.error} <button onClick={details.refetch}>{t("Retry")}</button></p>}
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

            {/* Notes */}
            {trade.notes && (
              <section>
                <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">{t("Notes")}</h3>
                <p className="rounded-md border border-zinc-800/60 bg-zinc-900/40 px-3 py-2.5 text-sm leading-relaxed text-zinc-300">
                  {trade.notes}
                </p>
              </section>
            )}

            {/* Screenshots */}
            {trade.screenshots?.length > 0 && (
              <section>
                <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">{t("Screenshots")}</h3>
                <div className="grid grid-cols-2 gap-2">
                  {trade.screenshots.map((s) => (
                    <img
                      key={s.id}
                      src={s.image_url}
                      alt={t("Trade screenshot")}
                      className="h-32 w-full cursor-zoom-in rounded-md border border-zinc-800 object-cover transition-opacity hover:opacity-80"
                      onClick={() => setLightboxSrc(s.image_url)}
                    />
                  ))}
                </div>
              </section>
            )}

          </div>
        </SheetBody>
      </SheetContent>
    </Sheet>

    {lightboxSrc && <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />}
    </>
  );
}
