import { useState } from "react";
import { ChevronDown, ChevronUp, FileText } from "lucide-react";

import { formatDateTime } from "@/lib/formatters";

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUS = {
  WIN:  { accent: "border-l-emerald-500/80", bg: "bg-emerald-950/15", badge: "bg-emerald-500/15 text-emerald-400 ring-emerald-500/20" },
  LOSS: { accent: "border-l-red-500/80",     bg: "bg-red-950/15",     badge: "bg-red-500/15 text-red-400 ring-red-500/20"           },
  BE:   { accent: "border-l-zinc-600/60",    bg: "",                  badge: "bg-zinc-700/40 text-zinc-400 ring-zinc-600/20"         },
  OPEN: { accent: "border-l-amber-500/70",   bg: "bg-amber-950/10",   badge: "bg-amber-500/15 text-amber-400 ring-amber-500/20"      },
};

const SIDE = {
  BUY:  "bg-emerald-500/10 text-emerald-400",
  SELL: "bg-red-500/10 text-red-400",
};

// ─── Sub-pieces ───────────────────────────────────────────────────────────────

function Badge({ children, className = "" }) {
  return (
    <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ${className}`}>
      {children}
    </span>
  );
}

function DetailRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="text-[10px] uppercase tracking-wider text-zinc-600 w-20 shrink-0">{label}</span>
      <span className="text-xs text-zinc-300">{value}</span>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function TradeJournalEntry({ trade }) {
  const [expanded, setExpanded] = useState(false);
  const s = STATUS[trade.status] ?? STATUS.BE;
  const isOpen = trade.status === "OPEN";

  const rDisplay = isOpen
    ? <span className="text-amber-400 font-semibold text-sm">In progress</span>
    : (
      <span className={`text-base font-bold tabular-nums ${parseFloat(trade.pnl_r) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
        {parseFloat(trade.pnl_r) > 0 ? "+" : ""}{trade.pnl_r}R
      </span>
    );

  return (
    <div className={`rounded-lg border border-zinc-800/50 border-l-2 ${s.accent} ${s.bg} overflow-hidden`}>
      {/* ── Summary row ── */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-zinc-800/20 transition-colors"
      >
        {/* Side pill */}
        <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${SIDE[trade.side] ?? ""}`}>
          {trade.side}
        </span>

        {/* Asset */}
        <span className="text-sm font-semibold text-zinc-100 w-20 shrink-0">{trade.asset}</span>

        {/* Setup + session */}
        <span className="flex-1 text-xs text-zinc-500 truncate hidden sm:block">
          {trade.setup}{trade.session ? ` · ${trade.session}` : ""}
        </span>

        {/* R value */}
        <span className="ml-auto shrink-0">{rDisplay}</span>

        {/* Status badge */}
        <Badge className={`${s.badge} ml-2 hidden sm:inline-flex`}>{trade.status}</Badge>

        {/* Notes indicator */}
        {trade.notes && (
          <FileText className="size-3 text-zinc-600 shrink-0" />
        )}

        {/* Expand toggle */}
        {expanded
          ? <ChevronUp className="size-3.5 text-zinc-600 shrink-0" />
          : <ChevronDown className="size-3.5 text-zinc-600 shrink-0" />
        }
      </button>

      {/* ── Expanded detail ── */}
      {expanded && (
        <div className="px-4 pb-4 pt-1 border-t border-zinc-800/40 space-y-3">
          {/* Key fields grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-1.5 mt-2">
            <DetailRow label="Entry"      value={trade.entry_datetime ? formatDateTime(trade.entry_datetime) : null} />
            <DetailRow label="Exit"       value={trade.exit_datetime  ? formatDateTime(trade.exit_datetime)  : "—"}  />
            <DetailRow label="Risk"       value={trade.risk_percent ? `${trade.risk_percent}%` : null} />
            <DetailRow label="Trend"      value={trade.trend_direction} />
            <DetailRow label="Opp. TF"   value={trade.opportunity_timeframe} />
            <DetailRow label="Entry TF"  value={trade.entry_timeframe} />
            <DetailRow label="Session"   value={trade.session} />
            <DetailRow label="Emotion"   value={trade.emotion} />
            <DetailRow label="Status"    value={trade.status} />
          </div>

          {/* Notes */}
          {trade.notes && (
            <div className="rounded-md border border-zinc-800/60 bg-zinc-900/40 px-3 py-2.5">
              <p className="text-[10px] uppercase tracking-wider text-zinc-600 mb-1">Notes</p>
              <p className="text-xs text-zinc-300 leading-relaxed">{trade.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
