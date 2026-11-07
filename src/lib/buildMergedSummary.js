// The filtered trade summary already contains exact counts and cross-year sequences.
// Yearly percentages cannot recover counts, streaks, or combined drawdowns.
export function buildMergedSummary(base) {
  return base ?? null;
}
