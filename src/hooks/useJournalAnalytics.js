import { useCallback, useMemo, useState } from "react";
import { useAuth } from "@/auth/useAuth";
import { getUserTimezone, zonedDate } from "@/lib/timezone";

import { fetchHubTrades } from "@/api/hub.api";
import {
  assetSymbol,
  availableUnits,
  assertBreakdownTotals,
  breakEvenThresholdR,
  computeAnalytics,
  filterTrades,
  getRangeBounds,
  monthKey,
  rangeMonthBounds,
  sessionLabel,
  setupLabel,
} from "@/lib/analytics";
import { useWorkspace } from "@/workspaces/useWorkspace";

import { useAsyncQuery } from "./useAsyncQuery";

const EMPTY_FILTERS = { assets: [], setups: [], sessions: [] };

function normalizeFilters(filters = EMPTY_FILTERS) {
  return {
    assets: filters.assets ?? [],
    setups: filters.setups ?? [],
    sessions: filters.sessions ?? [],
  };
}

function tradeMatchesFilters(trade, filters) {
  const asset = assetSymbol(trade?.asset);
  const setup = setupLabel(trade?.setup) || "Unassigned";
  const session = sessionLabel(trade?.session);

  if (filters.assets.length && !filters.assets.includes(asset)) return false;
  if (filters.setups.length && !filters.setups.includes(setup)) return false;
  if (filters.sessions.length && !filters.sessions.includes(session)) return false;
  return true;
}

function buildOptions(trades) {
  const assets = new Set();
  const setups = new Set();
  const sessions = new Set();

  trades.forEach((trade) => {
    const asset = assetSymbol(trade?.asset);
    if (asset) assets.add(asset);
    setups.add(setupLabel(trade?.setup) || "Unassigned");
    sessions.add(sessionLabel(trade?.session));
  });

  return {
    assets: [...assets].sort((a, b) => a.localeCompare(b)),
    setups: [...setups].sort((a, b) => a.localeCompare(b)),
    sessions: [...sessions].sort((a, b) => a.localeCompare(b)),
  };
}

export function useJournalAnalytics({
  range = "YTD",
  customRange,
  filters: rawFilters,
  assets,
  unit = "R",
  openMonth = null,
  journal = null,
} = {}) {
  const auth = useAuth();
  const timezone = auth?.user?.timezone || getUserTimezone();
  const [now] = useState(() => Date.now());
  const { activeWorkspace, analyticsVersion } = useWorkspace();
  const workspaceId = activeWorkspace?.id ?? journal?.id;
  const filters = useMemo(
    () => normalizeFilters(rawFilters ?? { ...EMPTY_FILTERS, assets: assets ?? [] }),
    [rawFilters, assets],
  );

  const queryFn = useCallback(
    () => fetchHubTrades(workspaceId, { years: [] }),
    [workspaceId],
  );

  const { data: allTrades, loading, error, refetch } = useAsyncQuery(
    queryFn,
    [workspaceId, analyticsVersion],
    { enabled: !!workspaceId, keepPreviousData: true },
  );

  const startingCapital = Number(
    journal?.startingCapital ?? journal?.starting_capital ?? 0,
  );
  const breakEvenThreshold = breakEvenThresholdR(journal);

  const rangeBounds = useMemo(
    () => getRangeBounds(range, customRange, zonedDate(now,timezone)),
    [range, customRange, timezone, now],
  );

  const dateFilteredTrades = useMemo(
    () => filterTrades(allTrades ?? [], { range, customRange, now:zonedDate(now,timezone) }),
    [allTrades, range, customRange, timezone, now],
  );

  const availableOptions = useMemo(
    () => buildOptions(dateFilteredTrades),
    [dateFilteredTrades],
  );

  const filteredTrades = useMemo(
    () => dateFilteredTrades.filter((trade) => tradeMatchesFilters(trade, filters)),
    [dateFilteredTrades, filters],
  );

  const unitOptions = useMemo(() => availableUnits(filteredTrades, startingCapital), [filteredTrades, startingCapital]);
  const effectiveUnit = unitOptions.some(o => o.value === unit) ? unit : "R";

  const analytics = useMemo(
    () =>
      computeAnalytics(filteredTrades, {
        unit: effectiveUnit,
        startingCapital,
        breakEvenThreshold,
      }),
    [filteredTrades, effectiveUnit, startingCapital, breakEvenThreshold],
  );

  if (import.meta.env.DEV) assertBreakdownTotals(analytics);

  const monthAnalytics = useMemo(() => {
    if (!openMonth || !filteredTrades.length) return null;
    const monthTrades = filteredTrades.filter((trade) => {
      if (!trade?.entry_datetime) return false;
      const date = zonedDate(trade.entry_datetime,timezone);
      if (Number.isNaN(date.getTime())) return false;
      if (date.getFullYear() !== openMonth.year || date.getMonth() !== openMonth.month) {
        return false;
      }
      return tradeMatchesFilters(trade, filters);
    });

    return {
      year: openMonth.year,
      month: openMonth.month,
      key: monthKey(openMonth.year, openMonth.month),
      ...computeAnalytics(monthTrades, {
        unit: effectiveUnit,
        startingCapital,
        breakEvenThreshold,
      }),
    };
  }, [
    filteredTrades,
    breakEvenThreshold,
    filters,
    openMonth,
    startingCapital,
    effectiveUnit,
    timezone,
  ]);

  const monthBounds = useMemo(
    () => rangeMonthBounds(rangeBounds, filteredTrades),
    [filteredTrades, rangeBounds],
  );

  return {
    unitOptions,
    allTrades: allTrades ?? [],
    filteredTrades,
    dateFilteredTrades,
    filters,
    availableOptions,
    availableAssets: availableOptions.assets,
    availableSetups: availableOptions.setups,
    availableSessions: availableOptions.sessions,
    analytics,
    monthAnalytics,
    monthBounds,
    rangeBounds,
    loading,
    error,
    refetch,
    hasData: (allTrades?.length ?? 0) > 0,
    hasRangeData: filteredTrades.length > 0 && analytics.summary.closedCount > 0,
  };
}
