import { useMemo, useState } from "react";

import { formatDate } from "@/lib/formatters";
import TradeDetailPanel from "./TradeDetailPanel";

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUS_STYLE = {
  WIN:  { bg: "bg-emerald-500/15", text: "text-emerald-400", ring: "ring-emerald-500/20" },
  LOSS: { bg: "bg-red-500/15",     text: "text-red-400",     ring: "ring-red-500/20"     },
  BE:   { bg: "bg-zinc-700/40",    text: "text-zinc-400",    ring: "ring-zinc-600/20"    },
  OPEN: { bg: "bg-amber-500/15",   text: "text-amber-400",   ring: "ring-amber-500/20"   },
};

const SIDE_STYLE = {
  BUY:  "bg-emerald-500/10 text-emerald-400",
  SELL: "bg-red-500/10 text-red-400",
};

const SORTABLE = ["date", "r", "asset"];

// ─── Status derivation ────────────────────────────────────────────────────────

function deriveStatus(trade, breakEvenMethod = "ratio") {
  if (trade.pnl_r === null || trade.pnl_r === undefined) return "OPEN";
  const r = parseFloat(trade.pnl_r);
  if (isNaN(r)) return "OPEN";
  if (breakEvenMethod === "profit" && trade.pnl != null) {
    const pnl = parseFloat(trade.pnl);
    if (pnl > 0) return "WIN";
    if (pnl < 0) return "LOSS";
    return "BE";
  }
  if (r > 0) return "WIN";
  if (r < 0) return "LOSS";
  return "BE";
}

// ─── Cell components ──────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const c = STATUS_STYLE[status] ?? STATUS_STYLE.BE;
  const label = status === "BE" ? "BREAKEVEN" : status;
  return (
    <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ${c.bg} ${c.text} ${c.ring}`}>
      {label}
    </span>
  );
}

function SidePill({ side }) {
  return (
    <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${SIDE_STYLE[side] ?? ""}`}>
      {side}
    </span>
  );
}

function RCell({ pnlR, status }) {
  if (status === "OPEN") {
    return <span className="text-xs font-medium text-amber-400">Open</span>;
  }
  const r = parseFloat(pnlR);
  const color = r > 0 ? "text-emerald-400" : r < 0 ? "text-red-400" : "text-zinc-400";
  return (
    <span className={`tabular-nums font-bold text-sm ${color}`}>
      {r > 0 ? "+" : ""}{pnlR}R
    </span>
  );
}

function PnlCell({ pnl, status }) {
  if (status === "OPEN" || pnl == null) return <span className="text-zinc-600">—</span>;
  const v = parseFloat(pnl);
  const color = v > 0 ? "text-emerald-400" : v < 0 ? "text-red-400" : "text-zinc-400";
  return <span className={`tabular-nums text-xs ${color}`}>{v > 0 ? "+" : ""}{pnl}</span>;
}

function SortIcon({ field, sortField, sortDir }) {
  if (sortField !== field) return <span className="ml-1 text-zinc-700">↕</span>;
  return <span className="ml-1 text-emerald-500">{sortDir === "asc" ? "↑" : "↓"}</span>;
}

function Null() {
  return <span className="text-zinc-600">—</span>;
}

function dateOf(iso) {
  if (!iso) return null;
  return formatDate(iso.slice(0, 10));
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TradeTable({ trades = [], breakEvenMethod = "ratio" }) {
  const [selectedTrade, setSelectedTrade] = useState(null);
  const [sortField, setSortField]         = useState("date");
  const [sortDir,   setSortDir]           = useState("desc");

  function handleSort(field) {
    if (!SORTABLE.includes(field)) return;
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  }

  const enriched = useMemo(
    () => trades.map((t) => ({ ...t, _derivedStatus: deriveStatus(t, breakEvenMethod) })),
    [trades, breakEvenMethod]
  );

  const sorted = useMemo(() => {
    return [...enriched].sort((a, b) => {
      let va, vb;
      if (sortField === "date") {
        va = a.entry_datetime ?? "";
        vb = b.entry_datetime ?? "";
      } else if (sortField === "r") {
        va = a.pnl_r === null ? -Infinity : parseFloat(a.pnl_r);
        vb = b.pnl_r === null ? -Infinity : parseFloat(b.pnl_r);
      } else {
        va = (a.asset ?? "").toLowerCase();
        vb = (b.asset ?? "").toLowerCase();
      }
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [enriched, sortField, sortDir]);

  function Th({ field, label, className = "" }) {
    const sortable = SORTABLE.includes(field);
    return (
      <th
        onClick={() => sortable && handleSort(field)}
        className={`px-3 py-2.5 text-left text-[11px] font-medium uppercase tracking-wider text-zinc-500 ${
          sortable ? "cursor-pointer select-none transition-colors hover:text-zinc-300" : ""
        } ${className}`}
      >
        {label}
        {sortable && <SortIcon field={field} sortField={sortField} sortDir={sortDir} />}
      </th>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-lg border border-zinc-800/60">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1080px] text-sm">
            <thead>
              <tr className="border-b border-zinc-800/60 bg-zinc-900/60">
                <Th field="asset" label="Asset" />
                <Th field="date"  label="Entry Date" />
                <Th field=""      label="Exit Date" />
                <Th field=""      label="Side" />
                <Th field=""      label="Opp. TF" className="hidden xl:table-cell" />
                <Th field=""      label="Entry TF" className="hidden xl:table-cell" />
                <Th field=""      label="Trend" className="hidden lg:table-cell" />
                <Th field=""      label="Risk %" className="hidden md:table-cell" />
                <Th field="r"     label="R" className="text-right" />
                <Th field=""      label="Status" />
                <Th field=""      label="PnL" className="hidden md:table-cell" />
                <Th field=""      label="Commission" className="hidden lg:table-cell" />
                <Th field=""      label="Swap" className="hidden lg:table-cell" />
              </tr>
            </thead>

            <tbody className="divide-y divide-zinc-800/40">
              {sorted.map((trade) => (
                <tr
                  key={trade.id}
                  onClick={() => setSelectedTrade(trade)}
                  className="cursor-pointer transition-colors hover:bg-zinc-800/25"
                >
                  <td className="px-3 py-3 text-sm font-semibold text-zinc-100">
                    {trade.asset}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-xs text-zinc-400">
                    {dateOf(trade.entry_datetime) ?? <Null />}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-xs text-zinc-400">
                    {trade.exit_datetime ? dateOf(trade.exit_datetime) : (
                      <span className="text-amber-400/70">Open</span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <SidePill side={trade.side} />
                  </td>
                  <td className="hidden px-3 py-3 text-xs text-zinc-400 xl:table-cell">
                    {trade.opportunity_timeframe ?? <Null />}
                  </td>
                  <td className="hidden px-3 py-3 text-xs text-zinc-400 xl:table-cell">
                    {trade.entry_timeframe ?? <Null />}
                  </td>
                  <td className="hidden px-3 py-3 text-xs text-zinc-400 lg:table-cell">
                    {trade.trend_direction ?? <Null />}
                  </td>
                  <td className="hidden px-3 py-3 text-xs tabular-nums text-zinc-400 md:table-cell">
                    {trade.risk_percent ? `${trade.risk_percent}%` : <Null />}
                  </td>
                  <td className="px-3 py-3 text-right">
                    <RCell pnlR={trade.pnl_r} status={trade._derivedStatus} />
                  </td>
                  <td className="px-3 py-3">
                    <StatusBadge status={trade._derivedStatus} />
                  </td>
                  <td className="hidden px-3 py-3 md:table-cell">
                    <PnlCell pnl={trade.pnl} status={trade._derivedStatus} />
                  </td>
                  <td className="hidden px-3 py-3 text-xs tabular-nums text-zinc-400 lg:table-cell">
                    {trade.commission != null ? trade.commission : <Null />}
                  </td>
                  <td className="hidden px-3 py-3 text-xs tabular-nums text-zinc-400 lg:table-cell">
                    {trade.swap != null ? trade.swap : <Null />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <TradeDetailPanel
        trade={selectedTrade}
        open={selectedTrade !== null}
        onClose={() => setSelectedTrade(null)}
      />
    </>
  );
}
