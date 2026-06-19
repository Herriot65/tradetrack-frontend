import { formatDate } from "@/lib/formatters";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetBody,
} from "@/components/ui/sheet";

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
  if (value == null || value === "") return null;
  return (
    <div className={`space-y-0.5 ${className}`}>
      <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-600">{label}</p>
      <p className="text-sm text-zinc-200">{value}</p>
    </div>
  );
}

function Badge({ children, colorClass }) {
  return (
    <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold uppercase tracking-wide ring-1 ${colorClass}`}>
      {children}
    </span>
  );
}

function formatDatetime(iso) {
  if (!iso) return "—";
  return iso.replace("T", " ").slice(0, 16) + " UTC";
}

function formatR(pnlR) {
  if (pnlR == null) return null;
  const r = parseFloat(pnlR);
  return `${r > 0 ? "+" : ""}${pnlR}R`;
}

export default function TradeDetailPanel({ trade, open, onClose }) {
  if (!trade) return null;

  const statusColor = STATUS_COLORS[trade._derivedStatus] ?? STATUS_COLORS.BE;
  const sideColor = SIDE_COLORS[trade.side] ?? "";

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent>
        <SheetHeader onClose={onClose}>
          <SheetTitle className="text-base font-semibold">
            {trade.asset}
            {trade.side && (
              <Badge colorClass={sideColor + " ring-0 ml-2"}>{trade.side}</Badge>
            )}
          </SheetTitle>
          <SheetDescription className="flex items-center gap-2">
            {trade._derivedStatus && (
              <Badge colorClass={statusColor}>{trade._derivedStatus === "BE" ? "BREAKEVEN" : trade._derivedStatus}</Badge>
            )}
            <span className="text-xs text-zinc-500">
              {trade.entry_datetime ? formatDate(trade.entry_datetime.slice(0, 10)) : "—"}
            </span>
          </SheetDescription>
        </SheetHeader>

        <SheetBody>
          <div className="space-y-6">

            {/* Execution */}
            <section>
              <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                Execution
              </h3>
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                <Field label="Entry" value={formatDatetime(trade.entry_datetime)} />
                <Field label="Exit" value={trade.exit_datetime ? formatDatetime(trade.exit_datetime) : "Still open"} />
                <Field label="Side" value={trade.side} />
                <Field label="Risk %" value={trade.risk_percent ? `${trade.risk_percent}%` : null} />
              </div>
            </section>

            {/* Performance */}
            <section>
              <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                Performance
              </h3>
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                <Field label="R Multiple" value={formatR(trade.pnl_r)} />
                <Field label="PnL" value={trade.pnl != null ? String(trade.pnl) : null} />
                <Field label="Commission" value={trade.commission != null ? String(trade.commission) : null} />
                <Field label="Swap" value={trade.swap != null ? String(trade.swap) : null} />
              </div>
            </section>

            {/* Setup */}
            <section>
              <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                Setup
              </h3>
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                <Field label="Opportunity TF" value={trade.opportunity_timeframe} />
                <Field label="Entry TF" value={trade.entry_timeframe} />
                <Field label="Trend" value={trade.trend_direction} />
                <Field label="Setup" value={trade.setup} />
                <Field label="Session" value={trade.session} />
              </div>
            </section>

            {/* Psychology — placeholder for Phase 2 editing */}
            {(trade.emotion || trade.mistake) && (
              <section>
                <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                  Psychology
                </h3>
                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                  <Field label="Emotion" value={trade.emotion} />
                  <Field label="Mistake" value={trade.mistake} />
                </div>
              </section>
            )}

            {/* Notes */}
            {trade.notes && (
              <section>
                <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                  Notes
                </h3>
                <p className="rounded-md border border-zinc-800/60 bg-zinc-900/40 px-3 py-2.5 text-sm leading-relaxed text-zinc-300">
                  {trade.notes}
                </p>
              </section>
            )}

          </div>
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}
