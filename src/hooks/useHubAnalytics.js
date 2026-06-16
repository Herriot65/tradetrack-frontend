import { useCallback, useMemo } from "react";

import { fetchHubTrades } from "@/api/hub.api";
import { useWorkspace } from "@/workspaces/useWorkspace";

import { useAsyncQuery } from "./useAsyncQuery";

// Separates open trades from closed, computes all chart/stat data from closed trades only.
function computeAnalytics(allTrades) {
  const openTrades   = allTrades.filter((t) => t.pnl_r === null);
  const trades       = allTrades.filter((t) => t.pnl_r !== null);
  const openPositions   = openTrades.length;
  const closedPositions = trades.length;
  const floatingProfit  = 0; // no real-time unrealized P&L in mock

  const empty = {
    rPerTrade: [],
    equityCurve: [],
    winLoss: { wins: 0, losses: 0, breakEven: 0 },
    summary: {
      totalTrades: allTrades.length,
      openPositions,
      closedPositions,
      floatingProfit,
      wins: 0,
      losses: 0,
      breakEven: 0,
      totalR: 0,
      avgR: 0,
      winRate: 0,
      maxDrawdownR: 0,
      profitFactor: 0,
      grossProfit: 0,
      grossLoss: 0,
    },
  };

  if (!trades.length) return empty;

  const rPerTrade = trades.map((t, i) => ({
    seq: i + 1,
    r: parseFloat(t.pnl_r),
    asset: t.asset,
    date: t.entry_datetime.slice(0, 10),
    status: t.status,
  }));

  let cum = 0;
  const equityCurve = trades.map((t) => {
    cum += parseFloat(t.pnl_r);
    return { date: t.entry_datetime.slice(0, 10), equity_r: Math.round(cum * 100) / 100 };
  });

  const wins      = trades.filter((t) => t.status === "WIN").length;
  const losses    = trades.filter((t) => t.status === "LOSS").length;
  const breakEven = trades.filter((t) => t.status === "BE").length;

  const totalR = Math.round(cum * 100) / 100;
  const avgR   = Math.round((totalR / trades.length) * 100) / 100;
  const winRate = Math.round((wins / trades.length) * 10000) / 100;

  let peak = 0, running = 0, maxDrawdownR = 0;
  trades.forEach((t) => {
    running += parseFloat(t.pnl_r);
    if (running > peak) peak = running;
    const dd = peak - running;
    if (dd > maxDrawdownR) maxDrawdownR = dd;
  });
  maxDrawdownR = Math.round(maxDrawdownR * 100) / 100;

  const grossProfit = trades.filter((t) => parseFloat(t.pnl_r) > 0).reduce((s, t) => s + parseFloat(t.pnl_r), 0);
  const grossLoss   = Math.abs(trades.filter((t) => parseFloat(t.pnl_r) < 0).reduce((s, t) => s + parseFloat(t.pnl_r), 0));
  const profitFactor = grossLoss === 0 ? Math.round(grossProfit * 100) / 100 : Math.round((grossProfit / grossLoss) * 100) / 100;

  return {
    rPerTrade,
    equityCurve,
    winLoss: { wins, losses, breakEven },
    summary: {
      totalTrades: allTrades.length,
      openPositions,
      closedPositions,
      floatingProfit,
      wins,
      losses,
      breakEven,
      totalR,
      avgR,
      winRate,
      maxDrawdownR,
      profitFactor,
      grossProfit: Math.round(grossProfit * 100) / 100,
      grossLoss:   Math.round(grossLoss   * 100) / 100,
    },
  };
}

// selectedYears: number[] (empty = all years)
// openMonth: { year: number, month: number } | null
export function useHubAnalytics({ selectedYears = [], openMonth = null }) {
  const { activeWorkspace } = useWorkspace();
  const workspaceId = activeWorkspace?.id;

  // Always fetch ALL trades — filtering happens client-side in useMemo so year-selection
  // changes never trigger a network round-trip.
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
