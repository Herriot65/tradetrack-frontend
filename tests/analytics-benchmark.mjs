// Synthetic CPU benchmark; excludes fetching and rendering. Run with Node.
import { computeAnalytics } from '../src/lib/analytics.js';
import { setUserTimezone } from '../src/lib/timezone.js';
setUserTimezone('America/New_York');
const trades = Array.from({length: 2000}, (_, i) => ({
  id: i, pnl_r: i % 3 ? 1.5 : -1, risk_percent: 1, asset: 'EURUSD',
  entry_datetime: new Date(Date.UTC(2025, 0, 1) + ((i * 137) % 2000) * 3600000).toISOString(),
  exit_datetime: '2026-01-01T00:00:00Z',
}));
computeAnalytics(trades);
const samples = Array.from({length:5}, () => {
  const start = performance.now(); const result = computeAnalytics(trades);
  if (result.rows.length !== 2000) throw new Error('Missing rows');
  return Math.round(performance.now() - start);
});
console.log(JSON.stringify({trades:trades.length,samples_ms:samples,median_ms:[...samples].sort((a,b)=>a-b)[2]}));
