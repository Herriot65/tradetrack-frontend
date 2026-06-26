/**
 * Merges backend career data into the client-side computed summary,
 * preferring backend values for accuracy.
 *
 * Three modes depending on selectedYears:
 *   [] (all)    → aggregate trades/winRate from all yearSummaries;
 *                 streak/secondary stats from top-level careerData (cross-year streaks)
 *   [year]      → read all fields directly from that year's yearSummaries entry
 *   [y1, y2, …] → aggregate across the selected year entries
 */
export function buildMergedSummary(base, careerData, selectedYears) {
  if (!base || !careerData?.yearSummaries?.length) return base ?? null;

  // ── All years ────────────────────────────────────────────────────────────────
  if (selectedYears.length === 0) {
    const all         = careerData.yearSummaries;
    const totalTrades = all.reduce((s, y) => s + y.total_trades, 0);
    const totalWins   = all.reduce((s, y) => s + Math.round((y.win_rate / 100) * y.total_trades), 0);
    const winRate     = totalTrades > 0 ? Math.round((totalWins / totalTrades) * 10000) / 100 : 0;
    return {
      ...base,
      totalTrades,
      winRate,
      maxWinStreak:         careerData.max_win_streak          ?? base.maxWinStreak,
      maxLossStreak:        careerData.max_loss_streak         ?? base.maxLossStreak,
      maxDrawdownR:         careerData.max_drawdown            ?? base.maxDrawdownR,
      expectancy:           careerData.expectancy              ?? null,
      avgConsecutiveWins:   careerData.avg_consecutive_wins    ?? null,
      avgConsecutiveLosses: careerData.avg_consecutive_losses  ?? null,
      avgWinR:              careerData.avg_win_r               ?? null,
      avgLossR:             careerData.avg_loss_r              ?? null,
    };
  }

  const selected = careerData.yearSummaries.filter((y) => selectedYears.includes(y.year));
  if (!selected.length) return base;

  // ── Single year ──────────────────────────────────────────────────────────────
  if (selectedYears.length === 1) {
    const y = selected[0];
    return {
      ...base,
      totalTrades:          y.total_trades,
      winRate:              y.win_rate,
      maxWinStreak:         y.max_win_streak         ?? base.maxWinStreak,
      maxLossStreak:        y.max_loss_streak        ?? base.maxLossStreak,
      maxDrawdownR:         y.max_drawdown           ?? base.maxDrawdownR,
      expectancy:           y.expectancy             ?? null,
      avgConsecutiveWins:   y.avg_consecutive_wins   ?? null,
      avgConsecutiveLosses: y.avg_consecutive_losses ?? null,
      avgWinR:              y.avg_win_r              ?? null,
      avgLossR:             y.avg_loss_r             ?? null,
    };
  }

  // ── Multiple years ───────────────────────────────────────────────────────────

  const totalTrades = selected.reduce((s, y) => s + y.total_trades, 0);
  const totalWins   = selected.reduce((s, y) => s + Math.round((y.win_rate / 100) * y.total_trades), 0);
  const totalLosses = totalTrades - totalWins;
  const winRate     = totalTrades > 0 ? Math.round((totalWins / totalTrades) * 10000) / 100 : 0;

  // Streaks are bounded per calendar year in per-year entries; take the max.
  const maxWinStreak  = Math.max(...selected.map((y) => y.max_win_streak  ?? 0));
  const maxLossStreak = Math.max(...selected.map((y) => y.max_loss_streak ?? 0));
  const maxDrawdownR  = Math.max(...selected.map((y) => y.max_drawdown    ?? 0));

  // Expectancy: derive from aggregated total_r / total_trades (most accurate).
  const totalR     = Math.round(selected.reduce((s, y) => s + (y.total_r ?? 0), 0) * 100) / 100;
  const expectancy = totalTrades > 0 ? Math.round((totalR / totalTrades) * 100) / 100 : null;

  // Average consecutive streaks: weighted by trade count.
  const avgConsecutiveWins   = totalTrades > 0
    ? Math.round(selected.reduce((s, y) => s + (y.avg_consecutive_wins   ?? 0) * y.total_trades, 0) / totalTrades * 10) / 10
    : null;
  const avgConsecutiveLosses = totalTrades > 0
    ? Math.round(selected.reduce((s, y) => s + (y.avg_consecutive_losses ?? 0) * y.total_trades, 0) / totalTrades * 10) / 10
    : null;

  // Avg win / loss R: weighted by the respective trade counts.
  const avgWinR = totalWins > 0
    ? Math.round(selected.reduce((s, y) => {
        const wc = Math.round((y.win_rate / 100) * y.total_trades);
        return s + (y.avg_win_r ?? 0) * wc;
      }, 0) / totalWins * 100) / 100
    : null;
  const avgLossR = totalLosses > 0
    ? Math.round(selected.reduce((s, y) => {
        const lc = y.total_trades - Math.round((y.win_rate / 100) * y.total_trades);
        return s + (y.avg_loss_r ?? 0) * lc;
      }, 0) / totalLosses * 100) / 100
    : null;

  return {
    ...base,
    totalTrades,
    winRate,
    maxWinStreak,
    maxLossStreak,
    maxDrawdownR,
    expectancy,
    avgConsecutiveWins,
    avgConsecutiveLosses,
    avgWinR,
    avgLossR,
  };
}
