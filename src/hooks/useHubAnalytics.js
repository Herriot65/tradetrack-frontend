import { useCallback, useMemo } from "react";

import { fetchHubTrades } from "@/api/hub.api";
import { useWorkspace } from "@/workspaces/useWorkspace";

import { useAsyncQuery } from "./useAsyncQuery";

function computeAnalytics(allTrades) {
  const openTrades      = allTrades.filter((t) => t.pnl_r === null);
  const trades          = allTrades.filter((t) => t.pnl_r !== null);
  const openPositions   = openTrades.length;
  const closedPositions = trades.length;
  const floatingProfit  = 0;

  const empty = {
    rPerTrade:     [],
    equityCurve:   [],
    drawdownCurve: [],
    pnlByAsset:    [],
    calendarData:  {},
    winLoss: { wins: 0, losses: 0, breakEven: 0 },
    summary: {
      totalTrades: allTrades.length,
      openPositions, closedPositions, floatingProfit,
      wins: 0, losses: 0, breakEven: 0,
      totalR: 0, avgR: 0, winRate: 0,
      maxDrawdownR: 0, profitFactor: 0,
      grossProfit: 0, grossLoss: 0,
      maxWinStreak: 0, maxLossStreak: 0,
    },
  };

  if (!trades.length) return empty;

  // ── R per trade ─────────────────────────────────────────────────────────────
  const rPerTrade = trades.map((t, i) => ({
    seq:    i + 1,
    r:      parseFloat(t.pnl_r),
    asset:  t.asset,
    date:   t.entry_datetime.slice(0, 10),
    status: t.status,
  }));

  // ── Equity curve + drawdown curve ───────────────────────────────────────────
  let cum = 0, peak = 0;
  const equityCurve   = [];
  const drawdownCurve = [];

  trades.forEach((t) => {
    cum += parseFloat(t.pnl_r);
    const cumR = Math.round(cum * 100) / 100;
    if (cum > peak) peak = cum;
    const dd = Math.round((cum - peak) * 100) / 100;
    const date = t.entry_datetime.slice(0, 10);
    equityCurve.push({ date, equity_r: cumR });
    drawdownCurve.push({ date, drawdown: dd });
  });

  // ── Win / loss / BE counts ──────────────────────────────────────────────────
  const wins      = trades.filter((t) => t.status === "WIN").length;
  const losses    = trades.filter((t) => t.status === "LOSS").length;
  const breakEven = trades.filter((t) => t.status === "BE").length;

  const totalR   = Math.round(cum * 100) / 100;
  const avgR     = Math.round((totalR / trades.length) * 100) / 100;
  const winRate  = Math.round((wins / trades.length) * 10000) / 100;

  // ── Max drawdown ─────────────────────────────────────────────────────────────
  const maxDrawdownR = Math.round(
    Math.max(...drawdownCurve.map((d) => Math.abs(d.drawdown)), 0) * 100
  ) / 100;

  // ── Gross profit / loss / profit factor ─────────────────────────────────────
  const grossProfit = Math.round(
    trades.filter((t) => parseFloat(t.pnl_r) > 0).reduce((s, t) => s + parseFloat(t.pnl_r), 0) * 100
  ) / 100;
  const grossLoss = Math.round(
    Math.abs(trades.filter((t) => parseFloat(t.pnl_r) < 0).reduce((s, t) => s + parseFloat(t.pnl_r), 0)) * 100
  ) / 100;
  const profitFactor = grossLoss === 0
    ? grossProfit
    : Math.round((grossProfit / grossLoss) * 100) / 100;

  // ── Win / loss streaks ───────────────────────────────────────────────────────
  let maxWinStreak = 0, maxLossStreak = 0, curWin = 0, curLoss = 0;
  trades.forEach((t) => {
    if (t.status === "WIN") {
      curWin++;
      curLoss = 0;
      if (curWin > maxWinStreak) maxWinStreak = curWin;
    } else if (t.status === "LOSS") {
      curLoss++;
      curWin = 0;
      if (curLoss > maxLossStreak) maxLossStreak = curLoss;
    } else {
      curWin = 0;
      curLoss = 0;
    }
  });

  // ── P&L by asset (closed trades only) ───────────────────────────────────────
  const assetMap = {};
  trades.forEach((t) => {
    if (!assetMap[t.asset]) assetMap[t.asset] = 0;
    assetMap[t.asset] = Math.round((assetMap[t.asset] + parseFloat(t.pnl_r)) * 100) / 100;
  });
  const pnlByAsset = Object.entries(assetMap)
    .map(([asset, totalR]) => ({ asset, totalR }))
    .sort((a, b) => b.totalR - a.totalR);

  // ── Calendar data (all trades grouped by day-of-month) ──────────────────────
  const calendarData = {};
  allTrades.forEach((t) => {
    const day = new Date(t.entry_datetime).getDate();
    if (!calendarData[day]) {
      calendarData[day] = { totalR: 0, count: 0, wins: 0, losses: 0, open: 0 };
    }
    calendarData[day].count++;
    if (t.pnl_r !== null) {
      calendarData[day].totalR = Math.round((calendarData[day].totalR + parseFloat(t.pnl_r)) * 100) / 100;
      if (t.status === "WIN")  calendarData[day].wins++;
      else if (t.status === "LOSS") calendarData[day].losses++;
    } else {
      calendarData[day].open++;
    }
  });

  return {
    rPerTrade,
    equityCurve,
    drawdownCurve,
    pnlByAsset,
    calendarData,
    winLoss: { wins, losses, breakEven },
    summary: {
      totalTrades: allTrades.length,
      openPositions, closedPositions, floatingProfit,
      wins, losses, breakEven,
      totalR, avgR, winRate,
      maxDrawdownR, profitFactor,
      grossProfit, grossLoss,
      maxWinStreak, maxLossStreak,
    },
  };
}

export function useHubAnalytics({ selectedYears = [], openMonth = null }) {
  const { activeWorkspace } = useWorkspace();
  const workspaceId = activeWorkspace?.id;

  const queryFn = useCallback(
    () => fetchHubTrades(workspaceId, { years: [] }),
    [workspaceId]
  );

  const { data: allTrades, loading, error, refetch } = useAsyncQuery(
    queryFn,
    [workspaceId],
    { enabled: !!workspaceId }
  );

  const yearAnalytics = useMemo(() => {
    const base = allTrades ?? [];
    const filtered = selectedYears.length === 0
      ? base
      : base.filter((t) => selectedYears.includes(new Date(t.entry_datetime).getFullYear()));
    return computeAnalytics(filtered);
  }, [allTrades, selectedYears]);

  const monthAnalytics = useMemo(() => {
    if (!openMonth || !allTrades) return null;
    const { year, month } = openMonth;
    const monthTrades = allTrades.filter((t) => {
      const d = new Date(t.entry_datetime);
      return d.getFullYear() === year && d.getMonth() === month;
    });
    return computeAnalytics(monthTrades);
  }, [allTrades, openMonth]);

  return { yearAnalytics, monthAnalytics, loading, error, refetch };
}
