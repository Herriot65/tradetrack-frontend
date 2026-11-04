import { effectiveStatus, tradeAmount, setupLabel, sessionLabel, breakEvenThresholdR } from './analytics.js';

export const BREAKDOWN_FIELDS = [
  ['setup', 'Setup'], ['emotions', 'Emotion'], ['mistakes', 'Mistake'],
  ['session', 'Session'], ['entry_timeframe', 'Entry timeframe'],
  ['opportunity_timeframe', 'Opportunity timeframe'], ['reference_timeframe', 'Reference timeframe'],
  ['trend_direction', 'Trend'], ['side', 'Side'],
];
const label = value => typeof value === 'object' && value !== null ? value.label ?? value.name : value;
export function categoryLabels(trade, field) {
  if (field === 'setup') return [setupLabel(trade.setup) || 'Unassigned'];
  if (field === 'session') return [trade.session ? sessionLabel(trade.session) : 'Unassigned'];
  const value = trade[field];
  return [...new Set((Array.isArray(value) ? value : [value]).map(label).filter(v => v !== null && v !== undefined && v !== '').map(String))];
}
function quantile(values, p) {
  const index = (values.length - 1) * p, lower = Math.floor(index);
  return values[lower] + (values[Math.ceil(index)] - values[lower]) * (index - lower);
}
export function buildBreakdown(trades, field, journal = {}) {
  const groups = new Map();
  let excluded = 0, unassigned = 0;
  for (const trade of trades) {
    const value = tradeAmount(trade, 'R', Number(journal.startingCapital ?? journal.starting_capital ?? 0));
    const status = effectiveStatus(trade, breakEvenThresholdR(journal));
    if (trade.pnl_r == null || status === 'OPEN' || value === null || !Number.isFinite(value)) { excluded++; continue; }
    const labels = categoryLabels(trade, field);
    if (!labels.length) { unassigned++; continue; }
    for (const name of labels) {
      if (!groups.has(name)) groups.set(name, []);
      groups.get(name).push({value, status});
    }
  }
  const rows = [...groups].map(([name, trades]) => {
    const values = trades.map(t => t.value).sort((a,b) => a-b);
    const n = values.length, total = values.reduce((a,b) => a+b,0);
    const wins = trades.filter(t => t.status === 'WIN'), losses = trades.filter(t => t.status === 'LOSS');
    return {name, n, total, mean:total/n, wins:wins.length, losses:losses.length,
      be:n-wins.length-losses.length, winRate:wins.length/n*100,
      avgWin:wins.length ? wins.reduce((s,t)=>s+t.value,0)/wins.length : null,
      avgLoss:losses.length ? losses.reduce((s,t)=>s+t.value,0)/losses.length : null,
      min:values[0], q1:quantile(values,.25), median:quantile(values,.5), q3:quantile(values,.75), max:values[n-1]};
  }).sort((a,b)=>b.mean-a.mean || b.n-a.n || a.name.localeCompare(b.name));
  return {rows, excluded, unassigned};
}
