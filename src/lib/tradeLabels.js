export const SIDE_LABELS = {
  BUY: "Buy",
  SELL: "Sell",
};

export const STATUS_LABELS = {
  OPEN: "Open",
  WIN: "Win",
  LOSS: "Loss",
  BE: "Break even",
};

export const TREND_LABELS = {
  BULLISH: "Bullish",
  BEARISH: "Bearish",
  RANGE: "Range",
};

export const TIMEFRAME_LABELS = {
  MN: "Monthly",
  W1: "Weekly",
  D1: "Daily",
  H4: "4H",
  H1: "1H",
  M15: "15m",
  M5: "5m",
};

export function getSideBadgeClass(side) {
  if (side === "BUY") {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-400";
  }
  if (side === "SELL") {
    return "border-rose-500/30 bg-rose-500/10 text-rose-400";
  }
  return "";
}

export function getStatusBadgeClass(status) {
  switch (status) {
    case "WIN":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-400";
    case "LOSS":
      return "border-rose-500/30 bg-rose-500/10 text-rose-400";
    case "BE":
      return "border-zinc-500/30 bg-zinc-500/10 text-zinc-400";
    case "OPEN":
      return "border-sky-500/30 bg-sky-500/10 text-sky-400";
    default:
      return "";
  }
}

export function getPnlClass(value) {
  const num = Number(value);
  if (num > 0) return "text-emerald-400";
  if (num < 0) return "text-rose-400";
  return "text-muted-foreground";
}
