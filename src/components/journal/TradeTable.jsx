import { useEffect, useMemo, useRef, useState } from "react";
import { Columns3 } from "lucide-react";
import { formatDate } from "@/lib/formatters";
import { deriveStatus } from "@/lib/deriveStatus";

// ─── Column definitions ───────────────────────────────────────────────────────

const COLUMNS = [
  { id: "asset",       label: "Asset",      sortKey: "asset" },
  { id: "entryDate",   label: "Entry",      sortKey: "date"  },
  { id: "exitDate",    label: "Exit",       sortKey: null    },
  { id: "side",        label: "Side",       sortKey: null    },
  { id: "oppTf",       label: "Opp. TF",    sortKey: null    },
  { id: "entryTf",     label: "Entry TF",   sortKey: null    },
  { id: "trend",       label: "Trend",      sortKey: null    },
  { id: "riskPercent", label: "Risk %",     sortKey: null    },
  { id: "pnl",         label: "PnL",        sortKey: "r"     },
  { id: "status",      label: "Status",     sortKey: null    },
  { id: "commission",  label: "Commission", sortKey: null    },
  { id: "swap",        label: "Swap",       sortKey: null    },
];

const DEFAULT_VISIBLE = {
  asset: true, entryDate: true, exitDate: true, side: true,
  oppTf: false, entryTf: false, trend: false, riskPercent: true,
  pnl: true, status: true, commission: false, swap: false,
};

function readCols(journalId) {
  if (!journalId) return DEFAULT_VISIBLE;
  try {
    const raw = localStorage.getItem(`journal_columns_${journalId}`);
    return raw ? { ...DEFAULT_VISIBLE, ...JSON.parse(raw) } : DEFAULT_VISIBLE;
  } catch { return DEFAULT_VISIBLE; }
}

function writeCols(journalId, cols) {
  if (!journalId) return;
  try { localStorage.setItem(`journal_columns_${journalId}`, JSON.stringify(cols)); } catch {}
}

// ─── Style maps ───────────────────────────────────────────────────────────────

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

// ─── Cell helpers ─────────────────────────────────────────────────────────────

function Dash() { return <span className="text-zinc-600">—</span>; }

function StatusBadge({ status }) {
  const c = STATUS_STYLE[status] ?? STATUS_STYLE.BE;
  const label = status === "BE" ? "B/E" : status;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ${c.bg} ${c.text} ${c.ring}`}>
      {label}
    </span>
  );
}

function SidePill({ side }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${SIDE_STYLE[side] ?? ""}`}>
      {side}
    </span>
  );
}

function PnlCell({ pnlR, status }) {
  if (status === "OPEN") return <span className="text-xs font-medium text-amber-400">Open</span>;
  if (pnlR == null) return <Dash />;
  const r = parseFloat(pnlR);
  const color = r > 0 ? "text-emerald-400" : r < 0 ? "text-red-400" : "text-zinc-400";
  return (
    <span className={`tabular-nums font-bold text-sm ${color}`}>
      {r > 0 ? "+" : ""}{pnlR}
    </span>
  );
}

// Shows date on first line, HH:MM on second line
function DateTimeCell({ iso, openLabel }) {
  if (!iso) {
    return openLabel
      ? <span className="text-xs text-amber-400/70">{openLabel}</span>
      : <Dash />;
  }
  const d    = new Date(iso);
  const date = formatDate(iso.slice(0, 10));
  const time = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  return (
    <div className="whitespace-nowrap">
      <div className="text-xs text-zinc-400">{date}</div>
      <div className="text-[10px] tabular-nums text-zinc-600">{time}</div>
    </div>
  );
}

// ─── Column visibility picker ─────────────────────────────────────────────────

function ColPicker({ visibleCols, onToggle }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function down(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", down);
    return () => document.removeEventListener("mousedown", down);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 rounded px-2 py-1 text-xs transition-colors ${
          open
            ? "bg-zinc-800 text-zinc-200"
            : "text-zinc-500 hover:bg-zinc-800/60 hover:text-zinc-300"
        }`}
      >
        <Columns3 className="size-3.5" />
        Columns
      </button>

      {open && (
        <div className="absolute right-0 top-7 z-50 w-44 rounded-md border border-zinc-800 bg-zinc-900 shadow-2xl">
          <p className="border-b border-zinc-800/60 px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
            Visible columns
          </p>
          <div className="max-h-64 overflow-y-auto py-1">
            {COLUMNS.map((col) => (
              <label
                key={col.id}
                className="flex cursor-pointer items-center gap-2.5 px-3 py-1.5 text-sm hover:bg-zinc-800"
              >
                <input
                  type="checkbox"
                  checked={visibleCols[col.id] ?? false}
                  onChange={() => onToggle(col.id)}
                  className="size-3.5 accent-emerald-500"
                />
                <span className="text-zinc-300">{col.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TradeTable({ trades = [], breakEvenMethod = "ratio", onRowClick, journalId }) {
  const [sortField,   setSortField]   = useState("date");
  const [sortDir,     setSortDir]     = useState("desc");
  const [visibleCols, setVisibleCols] = useState(() => readCols(journalId));

  function toggleCol(id) {
    setVisibleCols((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      writeCols(journalId, next);
      return next;
    });
  }

  function handleSort(key) {
    if (sortField === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(key); setSortDir("desc"); }
  }

  const enriched = useMemo(
    () => trades.map((t) => ({ ...t, _status: deriveStatus(t, breakEvenMethod) })),
    [trades, breakEvenMethod]
  );

  const sorted = useMemo(() => [...enriched].sort((a, b) => {
    let va, vb;
    if (sortField === "date") {
      va = a.entry_datetime ?? ""; vb = b.entry_datetime ?? "";
    } else if (sortField === "r") {
      va = a.pnl_r == null ? -Infinity : parseFloat(a.pnl_r);
      vb = b.pnl_r == null ? -Infinity : parseFloat(b.pnl_r);
    } else {
      va = (typeof a.asset === "object" ? (a.asset?.symbol ?? "") : (a.asset ?? "")).toLowerCase();
      vb = (typeof b.asset === "object" ? (b.asset?.symbol ?? "") : (b.asset ?? "")).toLowerCase();
    }
    if (va < vb) return sortDir === "asc" ? -1 : 1;
    if (va > vb) return sortDir === "asc" ? 1 : -1;
    return 0;
  }), [enriched, sortField, sortDir]);

  // Inline Th so it closes over sort state
  function Th({ colId, label, sortKey: sk, className = "" }) {
    const sortable = !!sk;
    const active   = sortable && sortField === sk;
    return (
      <th
        onClick={() => sortable && handleSort(sk)}
        className={`px-3 py-2.5 text-left text-[11px] font-medium uppercase tracking-wider text-zinc-500 ${
          sortable ? "cursor-pointer select-none transition-colors hover:text-zinc-300" : ""
        } ${className}`}
      >
        {label}
        {sortable && (
          <span className={`ml-1 ${active ? "text-emerald-500" : "text-zinc-700"}`}>
            {active ? (sortDir === "asc" ? "↑" : "↓") : "↕"}
          </span>
        )}
      </th>
    );
  }

  const v = visibleCols;

  return (
    <div className="rounded-xl border border-zinc-800/60 [overflow:clip]">
      {/* Column picker toolbar */}
      <div className="flex items-center justify-end border-b border-zinc-800/40 bg-zinc-900/50 px-3 py-2">
        <ColPicker visibleCols={v} onToggle={toggleCol} />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-14 z-10">
            <tr className="border-b border-zinc-800/60 bg-zinc-900/95 backdrop-blur-sm">
              {v.asset       && <Th colId="asset"       label="Asset"      sortKey="asset" />}
              {v.entryDate   && <Th colId="entryDate"   label="Entry"      sortKey="date"  />}
              {v.exitDate    && <Th colId="exitDate"    label="Exit"                       />}
              {v.side        && <Th colId="side"        label="Side"                       />}
              {v.oppTf       && <Th colId="oppTf"       label="Opp. TF"                    />}
              {v.entryTf     && <Th colId="entryTf"     label="Entry TF"                   />}
              {v.trend       && <Th colId="trend"       label="Trend"                      />}
              {v.riskPercent && <Th colId="riskPercent" label="Risk %"                     />}
              {v.pnl         && <Th colId="pnl"         label="PnL"        sortKey="r"  className="text-right" />}
              {v.status      && <Th colId="status"      label="Status"                     />}
              {v.commission  && <Th colId="commission"  label="Commission"                 />}
              {v.swap        && <Th colId="swap"        label="Swap"                       />}
            </tr>
          </thead>

          <tbody className="divide-y divide-zinc-800/30">
            {sorted.map((trade) => (
              <tr
                key={trade.id}
                onClick={() => onRowClick?.(trade)}
                className="cursor-pointer transition-colors duration-100 hover:bg-zinc-800/50"
              >
                {v.asset       && <td className="px-3 py-3.5 text-sm font-semibold text-zinc-100">{typeof trade.asset === "object" ? trade.asset?.symbol : trade.asset}</td>}
                {v.entryDate   && <td className="px-3 py-3.5"><DateTimeCell iso={trade.entry_datetime} /></td>}
                {v.exitDate    && <td className="px-3 py-3.5"><DateTimeCell iso={trade.exit_datetime} openLabel="Open" /></td>}
                {v.side        && <td className="px-3 py-3.5"><SidePill side={trade.side} /></td>}
                {v.oppTf       && <td className="px-3 py-3.5 text-xs text-zinc-400">{trade.opportunity_timeframe ?? <Dash />}</td>}
                {v.entryTf     && <td className="px-3 py-3.5 text-xs text-zinc-400">{trade.entry_timeframe ?? <Dash />}</td>}
                {v.trend       && <td className="px-3 py-3.5 text-xs text-zinc-400">{trade.trend_direction ?? <Dash />}</td>}
                {v.riskPercent && <td className="px-3 py-3.5 text-xs tabular-nums text-zinc-400">{trade.risk_percent != null ? `${trade.risk_percent}%` : <Dash />}</td>}
                {v.pnl         && <td className="px-3 py-3.5 text-right"><PnlCell pnlR={trade.pnl_r} status={trade._status} /></td>}
                {v.status      && <td className="px-3 py-3.5"><StatusBadge status={trade._status} /></td>}
                {v.commission  && <td className="px-3 py-3.5 text-xs tabular-nums text-zinc-400">${trade.commission != null ? trade.commission : "0.00"}</td>}
                {v.swap        && <td className="px-3 py-3.5 text-xs tabular-nums text-zinc-400">${trade.swap != null ? trade.swap : "0.00"}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
