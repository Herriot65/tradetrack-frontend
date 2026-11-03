import {
  endOfDay,
  endOfMonth,
  format,
  isValid,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfYear,
  subMonths,
} from "date-fns";

export const RANGE_OPTIONS = [
  { value: "YTD", label: "YTD" },
  { value: "3M", label: "3M" },
  { value: "12M", label: "12M" },
  { value: "ALL", label: "All" },
  { value: "CUSTOM", label: "Custom" },
];

export const UNIT_OPTIONS = [
  { value: "R", label: "R" },
  { value: "USD", label: "$" },
  { value: "PCT", label: "%" },
];

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const MONTH_SHORT = MONTH_NAMES.map((name) => name.slice(0, 3));

export function round(value, digits = 2) {
  if (!Number.isFinite(value)) return 0;
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

export function assetSymbol(asset) {
  if (typeof asset === "object" && asset !== null) {
    return asset.symbol ?? asset.label ?? String(asset.id ?? "");
  }
  return String(asset ?? "");
}

export function setupLabel(setup) {
  if (typeof setup === "object" && setup !== null) {
    return setup.label ?? setup.name ?? "";
  }
  return String(setup ?? "");
}

export function sessionLabel(session) {
  return String(session || "Unassigned");
}

export function parseTradeDate(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : parseISO(value);
  return isValid(date) ? date : null;
}

export function breakEvenThresholdR(journal) {
  const value = Number(journal?.breakEvenValue ?? journal?.break_even_value ?? 0);
  if (!Number.isFinite(value) || value <= 0) return 0;

  const method = journal?.breakEvenMethod ?? journal?.break_even_method ?? "ratio";
  if (method !== "profit") return value;

  const capital = Number(
    journal?.startingCapital ?? journal?.starting_capital ?? 0,
  );
  if (!Number.isFinite(capital) || capital <= 0) return 0;
  return round((value / capital) * 100, 2);
}

export function getRangeBounds(range, customRange = {}, now = new Date()) {
  const today = startOfDay(now);
  const end = endOfDay(today);

  if (range === "YTD") {
    return { start: startOfYear(today), end, label: "YTD" };
  }
  if (range === "3M") {
    return { start: startOfDay(subMonths(today, 3)), end, label: "Last 3 months" };
  }
  if (range === "12M") {
    return { start: startOfDay(subMonths(today, 12)), end, label: "Last 12 months" };
  }
  if (range === "CUSTOM") {
    const start = parseTradeDate(customRange?.start);
    const customEnd = parseTradeDate(customRange?.end);
    const normalizedEnd = customEnd ? endOfDay(customEnd) : end;
    return {
      start: start ? startOfDay(start) : null,
      end: normalizedEnd,
      label: "Custom range",
      customStart: start ? startOfDay(start) : null,
      customEnd: normalizedEnd,
    };
  }
  return { start: null, end: null, label: "All time" };
}

export function dateKey(date) {
  return format(date, "yyyy-MM-dd");
}

export function monthKey(year, month) {
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

export function monthLabel(year, month, short = false) {
  return `${short ? MONTH_SHORT[month] : MONTH_NAMES[month]} ${year}`;
}

export function filterTrades(trades = [], { range = "ALL", customRange, assets = [] } = {}) {
  const { start, end } = getRangeBounds(range, customRange);
  const assetSet = new Set(assets);

  return trades.filter((trade) => {
    const date = parseTradeDate(trade?.entry_datetime);
    if (!date) return false;
    if (start && date < start) return false;
    if (end && date > end) return false;
    if (assetSet.size > 0 && !assetSet.has(assetSymbol(trade?.asset))) return false;
    return true;
  });
}

export function effectiveStatus(trade, threshold = 0) {
  if (trade?.status) return trade.status;
  if (trade?.pnl_r === null || trade?.pnl_r === undefined) return "OPEN";
  const pnl = Number(trade.pnl_r);
  if (!Number.isFinite(pnl)) return "OPEN";
  if (threshold > 0 && Math.abs(pnl) <= threshold) return "BE";
  if (pnl > 0) return "WIN";
  if (pnl < 0) return "LOSS";
  return "BE";
}

export function riskPercent(trade) {
  const value = Number(trade?.risk_percent ?? trade?.riskPercent);
  return Number.isFinite(value) && value > 0 ? value : null;
}

export function riskAmount(trade, startingCapital = 0) {
  const explicit = trade?.risk_amount ?? trade?.riskAmount;
  if (explicit != null && Number.isFinite(Number(explicit)) && Number(explicit) > 0) return Number(explicit);
  const percent = riskPercent(trade);
  return percent !== null && startingCapital > 0 ? startingCapital * percent / 100 : null;
}

export function availableUnits(trades, startingCapital = 0) {
  const closed = trades.filter(t => t.pnl_r != null);
  const dollars = closed.length > 0 && closed.every(t => riskAmount(t, startingCapital) !== null);
  return UNIT_OPTIONS.filter(o => o.value === "R" || (dollars && (o.value !== "PCT" || startingCapital > 0)));
}

export function tradeAmount(trade, unit = "R", startingCapital = 0) {
  const pnlR = Number(trade?.pnl_r ?? 0);
  if (!Number.isFinite(pnlR)) return 0;
  if (unit === "R") return pnlR;
  const risk = riskAmount(trade, startingCapital);
  if (risk === null || (unit === "PCT" && startingCapital <= 0)) return null;
  const dollars = pnlR * risk;
  return unit === "PCT" ? dollars / startingCapital * 100 : dollars;
}

const MINUS = "\u2212";

function valueSign(number, signed) {
  if (number < 0) return MINUS;
  return signed && number > 0 ? "+" : "";
}

export function formatValue(value, unit = "R", { signed = true, compact = false } = {}) {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) {
    return "\u2014";
  }
  const number = Number(value);
  const sign = valueSign(number, signed);
  const abs = Math.abs(number);

  if (unit === "USD") {
    const body = compact && abs >= 1000
      ? `${(abs / 1000).toFixed(abs >= 10000 ? 0 : 1)}k`
      : abs.toLocaleString(undefined, {
          minimumFractionDigits: Number.isInteger(abs) ? 0 : 2,
          maximumFractionDigits: 2,
        });
    return `${sign}$${body}`;
  }
  if (unit === "PCT") return `${sign}${abs.toFixed(1)}%`;
  return `${sign}${abs.toFixed(2)}R`;
}

export function formatAxisTick(value, unit = "R") {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) {
    return "\u2014";
  }
  const number = Number(value);
  const abs = Math.abs(number);
  const sign = number < 0 ? MINUS : "";

  if (unit === "USD") {
    if (abs >= 1000) return `${sign}$${(abs / 1000).toFixed(abs >= 10000 ? 0 : 1)}k`;
    return `${sign}$${abs.toLocaleString(undefined, {
      minimumFractionDigits: Number.isInteger(abs) ? 0 : 1,
      maximumFractionDigits: 1,
    })}`;
  }

  const digits = Number.isInteger(round(abs, 6)) ? 0 : 1;
  return `${sign}${abs.toFixed(digits)}${unit === "PCT" ? "%" : "R"}`;
}

export function formatRatio(value, digits = 2) {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) {
    return "\u2014";
  }
  const number = Number(value);
  return number < 0
    ? `${MINUS}${Math.abs(number).toFixed(digits)}`
    : number.toFixed(digits);
}

export function formatPercent(value, digits = 1) {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) {
    return "\u2014";
  }
  const number = Number(value);
  return `${number < 0 ? MINUS : ""}${Math.abs(number).toFixed(digits)}%`;
}

export function formatDateLabel(value, pattern = "MMM d, yyyy") {
  const date = value instanceof Date ? value : parseTradeDate(value);
  if (!date) return "\u2014";
  return format(date, pattern);
}

function emptyBucket(extra = {}) {
  return {
    count: 0,
    wins: 0,
    losses: 0,
    breakEven: 0,
    totalR: 0,
    net: 0,
    ...extra,
  };
}

function summarizeBucket(bucket) {
  const decided = bucket.wins + bucket.losses;
  return {
    ...bucket,
    totalR: round(bucket.totalR),
    net: round(bucket.net),
    winRate: bucket.count > 0 ? round((bucket.wins / bucket.count) * 100) : 0,
    decidedWinRate: decided > 0 ? round((bucket.wins / decided) * 100) : 0,
    expectancy: bucket.count > 0 ? round(bucket.net / bucket.count) : 0,
    avgR: bucket.count > 0 ? round(bucket.totalR / bucket.count) : 0,
  };
}

function sortedTrades(trades) {
  return [...trades].sort((a, b) => {
    const aDate = parseTradeDate(a.entry_datetime)?.getTime() ?? 0;
    const bDate = parseTradeDate(b.entry_datetime)?.getTime() ?? 0;
    if (aDate !== bDate) return aDate - bDate;
    return Number(a.id ?? 0) - Number(b.id ?? 0);
  });
}

export function computeAnalytics(
  trades = [],
  {
    unit = "R",
    startingCapital = 0,
    breakEvenThreshold = 0,
  } = {},
) {
  const closed = sortedTrades(
    trades.filter((trade) => trade?.pnl_r !== null && trade?.pnl_r !== undefined),
  );

  const rows = closed.map((trade, index) => {
    const pnlR = Number(trade.pnl_r) || 0;
    const date = parseTradeDate(trade.entry_datetime);
    return {
      ...trade,
      seq: index + 1,
      pnlR,
      value: tradeAmount(trade, unit, startingCapital),
      status: effectiveStatus(trade, breakEvenThreshold),
      assetLabel: assetSymbol(trade.asset),
      setupLabel: setupLabel(trade.setup),
      sessionLabel: sessionLabel(trade.session),
      sideLabel: String(trade.side ?? "").toUpperCase(),
      date,
      dateKey: date ? dateKey(date) : "",
    };
  });

  const wins = rows.filter((trade) => trade.status === "WIN");
  const losses = rows.filter((trade) => trade.status === "LOSS");
  const breakEven = rows.filter((trade) => trade.status === "BE");

  const totalR = round(rows.reduce((sum, trade) => sum + trade.pnlR, 0));
  const net = round(rows.reduce((sum, trade) => sum + trade.value, 0));
  const grossProfitR = round(wins.reduce((sum, trade) => sum + trade.pnlR, 0));
  const grossLossR = round(losses.reduce((sum, trade) => sum + trade.pnlR, 0));
  const grossProfit = round(wins.reduce((sum, trade) => sum + trade.value, 0));
  const grossLoss = round(losses.reduce((sum, trade) => sum + trade.value, 0));

  const closedCount = rows.length;
  const decidedCount = wins.length + losses.length;
  const winRate = closedCount > 0 ? round((wins.length / closedCount) * 100) : 0;
  const decidedWinRate = decidedCount > 0 ? round((wins.length / decidedCount) * 100) : 0;
  const avgR = closedCount > 0 ? round(totalR / closedCount) : 0;
  const expectancy = closedCount > 0 ? round(net / closedCount) : 0;
  const avgWinR = wins.length > 0 ? round(grossProfitR / wins.length) : 0;
  const avgLossR = losses.length > 0 ? round(grossLossR / losses.length) : 0;
  const avgWin = wins.length > 0 ? round(grossProfit / wins.length) : 0;
  const avgLoss = losses.length > 0 ? round(grossLoss / losses.length) : 0;
  const profitFactor = grossLoss < 0 ? round(grossProfit / Math.abs(grossLoss)) : null;
  const payoff = wins.length && losses.length
    ? round((grossProfit / wins.length) / Math.abs(grossLoss / losses.length))
    : null;

  let cumulative = 0;
  let peak = 0;
  let maxDrawdown = 0;
  let currentWinStreak = 0;
  let currentLossStreak = 0;
  let maxWinStreak = 0;
  let maxLossStreak = 0;
  const winStreaks = [];
  const lossStreaks = [];

  const equityCurve = [];
  const drawdownCurve = [];
  const firstDate = rows[0]?.date;
  if (firstDate) {
    const startDate = new Date(firstDate);
    startDate.setDate(startDate.getDate() - 1);
    equityCurve.push({
      seq: 0,
      date: startDate,
      label: "Start",
      equity: 0,
      value: 0,
      drawdown: 0,
    });
    drawdownCurve.push({
      seq: 0,
      date: startDate,
      label: "Start",
      equity: 0,
      value: 0,
      drawdown: 0,
    });
  }

  rows.forEach((trade) => {
    cumulative += trade.value;
    if (cumulative > peak) peak = cumulative;
    const drawdown = round(cumulative - peak);
    if (drawdown < maxDrawdown) maxDrawdown = drawdown;

    equityCurve.push({
      seq: trade.seq,
      date: trade.date,
      label: trade.assetLabel,
      equity: round(cumulative),
      value: round(cumulative),
      drawdown,
      tradeValue: round(trade.value),
    });
    drawdownCurve.push({
      seq: trade.seq,
      date: trade.date,
      label: trade.assetLabel,
      equity: round(cumulative),
      value: drawdown,
      drawdown,
    });

    if (trade.status === "WIN") {
      currentWinStreak += 1;
      if (currentWinStreak > maxWinStreak) maxWinStreak = currentWinStreak;
    } else if (trade.status === "LOSS") {
      if (currentWinStreak > 0) winStreaks.push(currentWinStreak);
      currentWinStreak = 0;
      currentLossStreak += 1;
      if (currentLossStreak > maxLossStreak) maxLossStreak = currentLossStreak;
    } else {
      return;
    }

    if (trade.status === "WIN" && currentLossStreak > 0) {
      lossStreaks.push(currentLossStreak);
      currentLossStreak = 0;
    }
  });

  if (currentWinStreak > 0) winStreaks.push(currentWinStreak);
  if (currentLossStreak > 0) lossStreaks.push(currentLossStreak);

  const maxDrawdownSigned = round(maxDrawdown);
  const recoveryFactor = maxDrawdownSigned !== 0
    ? round(net / Math.abs(maxDrawdownSigned), 1)
    : null;

  const byDay = Array.from({ length: 7 }, (_, index) =>
    emptyBucket({ key: index, label: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][index] }),
  );
  const byHour = Array.from({ length: 24 }, (_, index) =>
    emptyBucket({ key: index, label: `${String(index).padStart(2, "0")}:00` }),
  );
  const dayHour = Array.from({ length: 7 }, () =>
    Array.from({ length: 24 }, () => emptyBucket()),
  );
  const byAsset = new Map();
  const bySetup = new Map();
  const bySession = new Map();
  const byMonth = new Map();
  const calendar = {};

  rows.forEach((trade) => {
    const dayIndex = trade.date ? (trade.date.getDay() + 6) % 7 : null;
    if (dayIndex !== null) {
      const day = byDay[dayIndex];
      day.count += 1;
      day.totalR += trade.pnlR;
      day.net += trade.value;
      if (trade.status === "WIN") day.wins += 1;
      else if (trade.status === "LOSS") day.losses += 1;
      else if (trade.status === "BE") day.breakEven += 1;
    }

    if (trade.date) {
      const hourIndex = trade.date.getHours();
      const hour = byHour[hourIndex];
      hour.count += 1;
      hour.totalR += trade.pnlR;
      hour.net += trade.value;
      if (trade.status === "WIN") hour.wins += 1;
      else if (trade.status === "LOSS") hour.losses += 1;
      else if (trade.status === "BE") hour.breakEven += 1;

      if (dayIndex !== null) {
        const cell = dayHour[dayIndex][hourIndex];
        cell.count += 1;
        cell.totalR += trade.pnlR;
        cell.net += trade.value;
        if (trade.status === "WIN") cell.wins += 1;
        else if (trade.status === "LOSS") cell.losses += 1;
        else if (trade.status === "BE") cell.breakEven += 1;
      }
    }

    const assetKey = trade.assetLabel || "Unassigned";
    if (!byAsset.has(assetKey)) byAsset.set(assetKey, emptyBucket({ label: assetKey }));
    const asset = byAsset.get(assetKey);
    asset.count += 1;
    asset.totalR += trade.pnlR;
    asset.net += trade.value;
    if (trade.status === "WIN") asset.wins += 1;
    else if (trade.status === "LOSS") asset.losses += 1;
    else if (trade.status === "BE") asset.breakEven += 1;

    const setupKey = trade.setupLabel || "Unassigned";
    if (!bySetup.has(setupKey)) bySetup.set(setupKey, emptyBucket({ label: setupKey }));
    const setup = bySetup.get(setupKey);
    setup.count += 1;
    setup.totalR += trade.pnlR;
    setup.net += trade.value;
    if (trade.status === "WIN") setup.wins += 1;
    else if (trade.status === "LOSS") setup.losses += 1;
    else if (trade.status === "BE") setup.breakEven += 1;

    const sessionKey = trade.sessionLabel || "Unassigned";
    if (!bySession.has(sessionKey)) bySession.set(sessionKey, emptyBucket({ label: sessionKey }));
    const session = bySession.get(sessionKey);
    session.count += 1;
    session.totalR += trade.pnlR;
    session.net += trade.value;
    if (trade.status === "WIN") session.wins += 1;
    else if (trade.status === "LOSS") session.losses += 1;
    else if (trade.status === "BE") session.breakEven += 1;

    if (trade.date) {
      const key = monthKey(trade.date.getFullYear(), trade.date.getMonth());
      if (!byMonth.has(key)) {
        byMonth.set(
          key,
          emptyBucket({
            year: trade.date.getFullYear(),
            month: trade.date.getMonth(),
            label: monthLabel(trade.date.getFullYear(), trade.date.getMonth(), true),
          }),
        );
      }
      const month = byMonth.get(key);
      month.count += 1;
      month.totalR += trade.pnlR;
      month.net += trade.value;
      if (trade.status === "WIN") month.wins += 1;
      else if (trade.status === "LOSS") month.losses += 1;
      else if (trade.status === "BE") month.breakEven += 1;

      if (!calendar[trade.dateKey]) {
        calendar[trade.dateKey] = emptyBucket({ date: trade.dateKey, trades: [] });
      }
      const day = calendar[trade.dateKey];
      day.trades.push({ ...trade, asset: trade.assetLabel, r: trade.pnlR, original: trade });
      day.count += 1;
      day.totalR += trade.pnlR;
      day.net += trade.value;
      if (trade.status === "WIN") day.wins += 1;
      else if (trade.status === "LOSS") day.losses += 1;
      else if (trade.status === "BE") day.breakEven += 1;
    }
  });

  Object.keys(calendar).forEach((key) => {
    calendar[key] = summarizeBucket(calendar[key]);
  });

  const months = [...byMonth.values()]
    .map(summarizeBucket)
    .sort((a, b) => (a.year - b.year) || (a.month - b.month));

  const distributionBuckets = [
    { label: "<\u22121", min: -Infinity, max: -1, tone: "loss" },
    { label: "\u22121", min: -1, max: -0.5, tone: "loss" },
    { label: "\u22120.5", min: -0.5, max: 0, tone: "loss" },
    { label: "BE", be: true, tone: "neutral" },
    ...Array.from({ length: 7 }, (_, i) => ({ label: String(i / 2), min: i / 2, max: (i + 1) / 2, tone: "profit" })),
    { label: "3.5+", min: 3.5, max: Infinity, tone: "profit" },
  ];
  const distribution = distributionBuckets.map((bucket) => {
    const count = rows.filter((trade) => {
      if (bucket.be) return trade.status === "BE";
      if (trade.status === "BE") return false;
      if (bucket.min === -Infinity) return trade.pnlR < bucket.max;
      if (bucket.max === Infinity) return trade.pnlR >= bucket.min;
      return trade.pnlR >= bucket.min && trade.pnlR < bucket.max;
    }).length;
    return { ...bucket, count };
  });

  const recentTrades = [...rows]
    .sort((a, b) => (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0))
    .slice(0, 8);

  return {
    unit,
    rows,
    recentTrades,
    equityCurve,
    drawdownCurve,
    rPerTrade: rows.map((trade) => ({
      id: trade.id,
      original: trade,
      seq: trade.seq,
      date: trade.date,
      dateKey: trade.dateKey,
      asset: trade.assetLabel,
      side: trade.sideLabel,
      r: trade.pnlR,
      value: trade.value,
      status: trade.status,
    })),
    byDay: byDay.map(summarizeBucket),
    byHour: byHour.map(summarizeBucket),
    dayHour: dayHour.map((row) => row.map(summarizeBucket)),
    assets: [...byAsset.values()].map(summarizeBucket).sort((a, b) => b.net - a.net),
    setups: [...bySetup.values()].map(summarizeBucket).sort((a, b) => b.net - a.net),
    sessions: [...bySession.values()].map(summarizeBucket).sort((a, b) => b.net - a.net),
    months,
    calendar,
    distribution,
    summary: {
      unit,
      closedCount,
      totalTrades: trades.length,
      openPositions: trades.filter((trade) => trade?.pnl_r === null || trade?.pnl_r === undefined).length,
      wins: wins.length,
      losses: losses.length,
      breakEven: breakEven.length,
      decidedCount,
      totalR,
      net,
      avgR,
      expectancy,
      winRate,
      decidedWinRate,
      grossProfitR,
      grossLossR,
      grossProfit,
      grossLoss,
      avgWinR,
      avgLossR,
      avgWin,
      avgLoss,
      profitFactor,
      payoff,
      maxDrawdown: maxDrawdownSigned,
      recoveryFactor,
      maxWinStreak,
      maxLossStreak,
      avgWinStreak: winStreaks.length
        ? round(winStreaks.reduce((sum, value) => sum + value, 0) / winStreaks.length, 1)
        : 0,
      avgLossStreak: lossStreaks.length
        ? round(lossStreaks.reduce((sum, value) => sum + value, 0) / lossStreaks.length, 1)
        : 0,
    },
  };
}

export function niceNumber(value, roundResult = false) {
  if (!Number.isFinite(value) || value === 0) return 0;
  const exponent = Math.floor(Math.log10(Math.abs(value)));
  const fraction = Math.abs(value) / 10 ** exponent;
  let niceFraction;

  if (roundResult) {
    if (fraction < 1.5) niceFraction = 1;
    else if (fraction < 3) niceFraction = 2;
    else if (fraction < 7) niceFraction = 5;
    else niceFraction = 10;
  } else if (fraction <= 1) niceFraction = 1;
  else if (fraction <= 2) niceFraction = 2;
  else if (fraction <= 5) niceFraction = 5;
  else niceFraction = 10;

  return niceFraction * 10 ** exponent;
}

export function niceTicks(min, max, count = 5) {
  const safeMin = Number.isFinite(min) ? min : 0;
  const safeMax = Number.isFinite(max) ? max : 0;
  if (safeMin === safeMax) {
    const padding = safeMin === 0 ? 1 : Math.abs(safeMin) * 0.25;
    return niceTicks(safeMin - padding, safeMax + padding, count);
  }

  const step = niceNumber((safeMax - safeMin) / Math.max(1, count - 1), true);
  if (!step) return [safeMin, safeMax];

  let niceMin = Math.floor(safeMin / step) * step;
  let niceMax = Math.ceil(safeMax / step) * step;
  if (safeMin >= 0) niceMin = 0;
  if (safeMax <= 0) niceMax = 0;
  const ticks = [];
  const total = Math.round((niceMax - niceMin) / step);

  for (let index = 0; index <= total; index += 1) {
    ticks.push(round(niceMin + index * step, 6));
  }
  return ticks;
}

export function buildDonutSegments(values = [], gapRatio = 2.5 / (2 * Math.PI * 50)) {
  const total = values.reduce((sum, value) => sum + Math.max(0, Number(value) || 0), 0);
  if (total <= 0) return [];
  const gap = Math.min(0.08, Math.max(0, gapRatio));

  let cursor = 0;
  return values.map((rawValue) => {
    const value = Math.max(0, Number(rawValue) || 0);
    const ratio = value / total;
    const segment = {
      value,
      ratio,
      start: cursor,
      end: cursor + ratio,
      length: Math.max(0, ratio - gap),
    };
    cursor += ratio;
    return segment;
  });
}

export function heatmapTone(value, maxAbs, count = 1, metric = "netR") {
  if (!count) return { background: "var(--surface-raised)", color: "var(--ink-muted)", intensity: 0 };
  const number = Number(value) || 0;
  const intensity = metric === "trades"
    ? 0.15 + 0.85 * Math.min(1, count / Math.max(1, maxAbs))
    : 0.18 + 0.82 * Math.min(1, Math.abs(number) / Math.max(maxAbs, Number.EPSILON));
  const token = metric === "trades" || number === 0 ? "ink-muted" : number > 0 ? "profit" : "loss";
  return {
    background: `color-mix(in srgb, var(--${token}) ${intensity * 100}%, var(--surface-card))`,
    color: "var(--ink)", intensity,
  };
}

export function assertBreakdownTotals(analytics) {
  for (const key of ["assets", "byDay", "byHour", "months"]) {
    const sum = analytics[key].reduce((n, row) => n + row.totalR, 0);
    if (Math.abs(sum - analytics.summary.totalR) > 0.00001) throw new Error(`${key} does not match Net R`);
  }
}

export function buildCalendarGrid(year, month) {
  const first = startOfMonth(new Date(year, month, 1));
  const last = endOfMonth(first);
  const mondayOffset = (first.getDay() + 6) % 7;
  const cells = [];

  for (let index = 0; index < 42; index += 1) {
    const date = new Date(first);
    date.setDate(first.getDate() - mondayOffset + index);
    cells.push({
      date,
      day: date.getDate(),
      inMonth: date >= first && date <= last,
      key: dateKey(date),
    });
  }

  return { cells, first, last, mondayOffset };
}

export function buildCalendarWeeks(year, month, calendar = {}) {
  const { cells } = buildCalendarGrid(year, month);
  return Array.from({ length: 6 }, (_, index) => {
    const weekCells = cells.slice(index * 7, index * 7 + 7);
    const entries = weekCells
      .filter((cell) => cell.inMonth)
      .map((cell) => calendar[cell.key])
      .filter(Boolean);
    return {
      cells: weekCells,
      net: round(entries.reduce((sum, entry) => sum + entry.net, 0)),
      count: entries.reduce((sum, entry) => sum + entry.count, 0),
    };
  });
}

export function summarizeCalendarMonth(calendar = {}, year, month) {
  const prefix = `${year}-${String(month + 1).padStart(2, "0")}-`;
  return Object.entries(calendar).reduce(
    (summary, [key, entry]) => {
      if (!key.startsWith(prefix)) return summary;
      summary.net += entry.net;
      summary.count += entry.count;
      summary.tradingDays += 1;
      if (entry.net > 0) summary.greenDays += 1;
      return summary;
    },
    { net: 0, count: 0, tradingDays: 0, greenDays: 0 },
  );
}

export function rangeMonthBounds({ start, end }, trades = []) {
  const dates = trades
    .map((trade) => parseTradeDate(trade.entry_datetime))
    .filter(Boolean)
    .sort((a, b) => a - b);

  const minDate = start ?? dates[0] ?? startOfMonth(new Date());
  const maxDate = end ?? dates[dates.length - 1] ?? new Date();

  return {
    minYear: minDate.getFullYear(),
    minMonth: minDate.getMonth(),
    maxYear: maxDate.getFullYear(),
    maxMonth: maxDate.getMonth(),
  };
}

export function compareMonth(aYear, aMonth, bYear, bMonth) {
  return (aYear - bYear) || (aMonth - bMonth);
}

export function toCsvValue(value) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function tradesToCsv(trades = [], { unit = "R", startingCapital = 0, breakEvenThreshold = 0 } = {}) {
  const header = [
    "Date",
    "Asset",
    "Side",
    "Setup",
    "Session",
    "Status",
    "Risk %",
    "P&L R",
    `P&L ${unit}`,
  ].join(",");

  const lines = trades.map((trade) => {
    const date = parseTradeDate(trade.entry_datetime);
    return [
      date ? format(date, "yyyy-MM-dd HH:mm") : "",
      assetSymbol(trade.asset),
      trade.side ?? "",
      setupLabel(trade.setup),
      trade.session ?? "",
      effectiveStatus(trade, breakEvenThreshold),
      trade.risk_percent ?? "",
      trade.pnl_r ?? "",
      tradeAmount(trade, unit, startingCapital),
    ].map(toCsvValue).join(",");
  });

  return [header, ...lines].join("\n");
}

export { MONTH_NAMES, MONTH_SHORT };

// Session definitions: Tokyo 09:00-18:00, London 08:00-17:00,
// New York 08:00-17:00 local time. Intl resolves each date's DST offset.
export function sessionBands(date = new Date(), timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone) {
  function hourInZone(instant, zone) {
    return Number(new Intl.DateTimeFormat("en-GB", { timeZone: zone, hour: "2-digit", hourCycle: "h23" }).format(instant));
  }
  const noon = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 12));
  const offset = zone => ((hourInZone(noon, zone) - 12 + 36) % 24) - 12;
  const localOffset = offset(timeZone);
  const tokyoStart = (9 - offset("Asia/Tokyo") + localOffset + 24) % 24;
  const londonStart = (8 - offset("Europe/London") + localOffset + 24) % 24;
  const nyStart = (8 - offset("America/New_York") + localOffset + 24) % 24;
  const active = (hour, start) => (hour - start + 24) % 24 < 9;
  const labels = Array.from({length:24}, (_,h) => {
    const london = active(h,londonStart), ny = active(h,nyStart);
    return london && ny ? "LDN + NY" : ny ? "New York" : london ? "London" : active(h,tokyoStart) ? "Asia" : "";
  });
  return labels.reduce((bands,label,hour) => {
    const last = bands.at(-1);
    if (last && last.label === label) last.end = hour + 1;
    else bands.push({label,start:hour,end:hour+1});
    return bands;
  }, []);
}
