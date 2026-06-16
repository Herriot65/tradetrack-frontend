import { useCallback, useRef, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { toPng } from "html-to-image";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatPercent, formatR } from "@/lib/formatters";

import HubEquityCurve from "./HubEquityCurve";
import PerformanceCalendar from "./PerformanceCalendar";
import ProfitLossDonut from "./ProfitLossDonut";
import RPerTradeChart from "./RPerTradeChart";
import WinLossDonut from "./WinLossDonut";

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

// ─── Stats panel ──────────────────────────────────────────────────────────────

function StatRow({ label, value, valueClass = "text-zinc-200" }) {
  return (
    <div className="flex items-baseline justify-between gap-2 py-1.5 border-b border-zinc-800/40 last:border-0">
      <span className="text-xs text-zinc-500">{label}</span>
      <span className={`text-xs font-semibold tabular-nums ${valueClass}`}>{value}</span>
    </div>
  );
}

function MonthStatsPanel({ summary, monthName, year }) {
  const {
    totalTrades, openPositions, closedPositions,
    wins, losses, breakEven,
    winRate, maxDrawdownR, totalR, floatingProfit,
    grossProfit, grossLoss,
  } = summary;

  const avgWinR  = wins   > 0 ? formatR(Math.round((grossProfit / wins)   * 100) / 100) : "—";
  const avgLossR = losses > 0 ? formatR(-Math.round((grossLoss  / losses) * 100) / 100) : "—";

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-[10px] uppercase tracking-widest text-zinc-600">{year}</p>
        <h2 className="text-2xl font-bold tracking-tight text-zinc-100 leading-none mt-0.5">
          {monthName}
        </h2>
      </div>

      <div className="rounded-lg border border-zinc-800/60 bg-zinc-900/60 px-4 py-1">
        <StatRow label="Total Trades"     value={totalTrades} />
        <StatRow label="Open Positions"   value={openPositions}
          valueClass={openPositions > 0 ? "text-amber-400" : "text-zinc-400"} />
        <StatRow label="Closed Positions" value={closedPositions} />
        <StatRow label="Wins"             value={wins}        valueClass="text-emerald-400" />
        <StatRow label="Losses"           value={losses}      valueClass="text-red-400" />
        {breakEven > 0 && <StatRow label="Break Even" value={breakEven} valueClass="text-zinc-400" />}
        <StatRow label="Avg Win (R)"      value={avgWinR}     valueClass="text-emerald-400" />
        <StatRow label="Avg Loss (R)"     value={avgLossR}    valueClass="text-red-400" />
        <StatRow label="Win Rate"         value={formatPercent(winRate)} />
        <StatRow label="Max Drawdown"     value={formatR(-maxDrawdownR)}  valueClass="text-red-400" />
        <StatRow
          label="Floating Profit"
          value={floatingProfit !== 0 ? formatR(floatingProfit) : "—"}
          valueClass={floatingProfit > 0 ? "text-emerald-400" : "text-zinc-500"}
        />
        <StatRow
          label="Net R"
          value={formatR(totalR)}
          valueClass={totalR >= 0 ? "text-emerald-400" : "text-red-400"}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <WinLossDonut   wins={wins} losses={losses} breakEven={breakEven} />
        <ProfitLossDonut grossProfit={grossProfit} grossLoss={grossLoss} totalR={totalR} />
      </div>
    </div>
  );
}

// ─── Loading skeleton ──────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
      <div className="flex flex-col gap-4">
        <Skeleton className="h-52 rounded-xl" />
        <Skeleton className="h-44 rounded-xl" />
      </div>
      <div className="flex flex-col gap-4">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-64 rounded-xl" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-36 rounded-xl" />
          <Skeleton className="h-36 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

// ─── Dialog ───────────────────────────────────────────────────────────────────

export default function MonthDetailDialog({ open, onClose, year, month, monthAnalytics, loading }) {
  const monthName   = month != null ? MONTH_NAMES[month] : null;
  const contentRef  = useRef(null);
  const [saving, setSaving] = useState(false);

  const handleSavePng = useCallback(async () => {
    if (!contentRef.current) return;
    setSaving(true);
    try {
      const dataUrl = await toPng(contentRef.current, {
        backgroundColor: "#09090b",
        pixelRatio: 2,
      });
      const link = document.createElement("a");
      link.download = `${monthName}-${year}-performance.png`;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.error("PNG export failed:", e);
    } finally {
      setSaving(false);
    }
  }, [monthName, year]);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent
        className="
          w-[96vw] max-w-[96vw]
          sm:max-w-4xl lg:max-w-6xl xl:max-w-[88vw]
          max-h-[92vh] overflow-y-auto
          bg-zinc-950 border-zinc-800/80
          p-0
        "
      >
        {/* Header — outside the PNG capture zone */}
        <DialogHeader className="flex flex-row items-center justify-between gap-4 px-6 pt-5 pb-4 border-b border-zinc-800/60">
          <div>
            <DialogTitle className="text-[10px] font-medium uppercase tracking-widest text-zinc-500">
              {year} · Monthly Detail
            </DialogTitle>
            <p className="text-2xl font-bold tracking-tight text-zinc-100 leading-none mt-1">
              {monthName}
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleSavePng}
            disabled={saving || !monthAnalytics}
            className="shrink-0 border-zinc-700 bg-zinc-900/60 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
          >
            {saving
              ? <Loader2 className="size-3.5 animate-spin" />
              : <Download className="size-3.5" />
            }
            {saving ? "Saving…" : "Save PNG"}
          </Button>
        </DialogHeader>

        {/* Capturable content area */}
        <div ref={contentRef} className="px-6 pb-6 pt-5 bg-zinc-950">
          {loading ? (
            <LoadingSkeleton />
          ) : monthAnalytics ? (
            <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
              {/* LEFT: charts */}
              <div className="flex flex-col gap-5">
                <HubEquityCurve
                  data={monthAnalytics.equityCurve}
                  title={`Equity — ${monthName} ${year}`}
                  height={200}
                />
                <PerformanceCalendar
                  year={year}
                  month={month}
                  calendarData={monthAnalytics.calendarData}
                />
                <RPerTradeChart
                  data={monthAnalytics.rPerTrade}
                  title={`R per Trade — ${monthName}`}
                  height={180}
                />
              </div>

              {/* RIGHT: stats + donuts */}
              <MonthStatsPanel
                summary={monthAnalytics.summary}
                monthName={monthName}
                year={year}
              />
            </div>
          ) : (
            <p className="py-12 text-center text-sm text-zinc-600">No trades for this month.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
