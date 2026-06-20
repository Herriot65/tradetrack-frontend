// Returns the effective status for a trade.
// Manual `trade.status` takes priority over the automatic derivation from pnl_r.
export function deriveStatus(trade) {
  if (trade.status) return trade.status;
  if (trade.pnl_r == null) return "OPEN";
  const r = parseFloat(trade.pnl_r);
  if (isNaN(r)) return "OPEN";
  if (r > 0) return "WIN";
  if (r < 0) return "LOSS";
  return "BE";
}
