// To activate mock data: add VITE_USE_MOCK=true to .env.local
// To switch to the real API: remove the var (or set it to false)
export const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

// ─── Dashboard Summary ────────────────────────────────────────────────────────

export const MOCK_DASHBOARD_SUMMARY = {
  total_trades: 30,
  win_rate: 60.71,
  total_r: 26.0,
  profit_factor: 3.6,
  max_drawdown_r: -1.0,
  average_r: 0.93,
};

// ─── Equity Curve ─────────────────────────────────────────────────────────────

export const MOCK_EQUITY_CURVE = {
  weekly: [
    { date: "2025-01-10", equity_r: 1.0 },
    { date: "2025-01-17", equity_r: 4.0 },
    { date: "2025-01-24", equity_r: 3.0 },
    { date: "2025-01-31", equity_r: 4.5 },
    { date: "2025-02-07", equity_r: 6.0 },
    { date: "2025-02-14", equity_r: 7.0 },
    { date: "2025-02-21", equity_r: 6.0 },
    { date: "2025-02-28", equity_r: 8.0 },
    { date: "2025-03-07", equity_r: 11.0 },
    { date: "2025-03-14", equity_r: 10.0 },
    { date: "2025-03-21", equity_r: 12.0 },
    { date: "2025-03-28", equity_r: 11.0 },
    { date: "2025-04-04", equity_r: 12.5 },
    { date: "2025-04-11", equity_r: 16.5 },
    { date: "2025-04-18", equity_r: 15.5 },
    { date: "2025-04-25", equity_r: 17.5 },
    { date: "2025-05-02", equity_r: 19.0 },
    { date: "2025-05-09", equity_r: 20.5 },
    { date: "2025-05-16", equity_r: 19.5 },
    { date: "2025-05-23", equity_r: 22.5 },
    { date: "2025-05-30", equity_r: 23.5 },
    { date: "2025-06-06", equity_r: 25.5 },
    { date: "2025-06-13", equity_r: 26.0 },
  ],
  monthly: [
    { date: "2025-01-31", equity_r: 4.5 },
    { date: "2025-02-28", equity_r: 8.0 },
    { date: "2025-03-31", equity_r: 11.0 },
    { date: "2025-04-30", equity_r: 19.0 },
    { date: "2025-05-31", equity_r: 23.5 },
    { date: "2025-06-13", equity_r: 26.0 },
  ],
  yearly: [
    { date: "2025-01-31", equity_r: 4.5 },
    { date: "2025-02-28", equity_r: 8.0 },
    { date: "2025-03-31", equity_r: 11.0 },
    { date: "2025-04-30", equity_r: 19.0 },
    { date: "2025-05-31", equity_r: 23.5 },
    { date: "2025-06-13", equity_r: 26.0 },
  ],
};

// ─── Win / Loss Distribution ──────────────────────────────────────────────────

export const MOCK_WIN_LOSS_DISTRIBUTION = {
  wins: 17,
  losses: 10,
  break_even: 1,
};

// ─── PnL by Setup ─────────────────────────────────────────────────────────────

export const MOCK_PNL_BY_SETUP = [
  { setup: "POI Reversal",         total_r: 9.5  },
  { setup: "BOS + OB Retest",      total_r: 8.5  },
  { setup: "FVG Fill",             total_r: 5.0  },
  { setup: "Liquidity Sweep + OB", total_r: 5.0  },
  { setup: "MSS + FVG",            total_r: 3.0  },
  { setup: "Equal Lows Hunt",      total_r: -1.0 },
  { setup: "IFVG",                 total_r: -4.0 },
];

// ─── Mock Catalogs ────────────────────────────────────────────────────────────
// IDs are index + 1 — must stay in sync with DEFAULT_*_OBJECTS in useJournalCatalog.js.
// Used by expandTrade() to convert legacy string fields to {id, symbol/label} objects.

const MOCK_ASSET_CATALOG = [
  { id: 1,  symbol: "EURUSD" }, { id: 2,  symbol: "GBPUSD" },
  { id: 3,  symbol: "USDJPY" }, { id: 4,  symbol: "AUDUSD" },
  { id: 5,  symbol: "USDCAD" }, { id: 6,  symbol: "USDCHF" },
  { id: 7,  symbol: "NZDUSD" }, { id: 8,  symbol: "XAUUSD" },
  { id: 9,  symbol: "XAGUSD" }, { id: 10, symbol: "NAS100" },
  { id: 11, symbol: "US30"   }, { id: 12, symbol: "US500"  },
  { id: 13, symbol: "GER40"  }, { id: 14, symbol: "UK100"  },
];
const MOCK_EMOTION_CATALOG = [
  { id: 1,  label: "Calm"        }, { id: 2,  label: "Confident"  },
  { id: 3,  label: "Anxious"     }, { id: 4,  label: "Fearful"    },
  { id: 5,  label: "FOMO"        }, { id: 6,  label: "Disciplined" },
  { id: 7,  label: "Impatient"   }, { id: 8,  label: "Excited"    },
  { id: 9,  label: "Frustrated"  }, { id: 10, label: "Neutral"    },
];
const MOCK_MISTAKE_CATALOG = [
  { id: 1, label: "Chased entry"    }, { id: 2, label: "Moved SL"         },
  { id: 3, label: "FOMO trade"      }, { id: 4, label: "Overtraded"       },
  { id: 5, label: "Ignored plan"    }, { id: 6, label: "Poor risk sizing" },
  { id: 7, label: "Exited too early" },
];
const MOCK_SETUP_CATALOG = [
  { id: 1, label: "Break of Structure"   }, { id: 2, label: "Order Block"         },
  { id: 3, label: "Fair Value Gap"       }, { id: 4, label: "Liquidity Grab"      },
  { id: 5, label: "Supply & Demand Zone" }, { id: 6, label: "Trendline Bounce"    },
  { id: 7, label: "Support / Resistance" }, { id: 8, label: "Breaker Block"       },
];

// Expand a raw (legacy string) mock trade to the new API response shape.
// If the trade is already in expanded API shape (asset is an object), skip re-expansion —
// locally-created/updated trades from resolvePayloadToTrade arrive pre-expanded.
function expandTrade(trade) {
  if (trade.asset != null && typeof trade.asset === "object") return trade;
  const assetObj = MOCK_ASSET_CATALOG.find((a) => a.symbol === trade.asset)
    ?? { id: 0, symbol: trade.asset ?? "UNKNOWN" };
  const emotionLabels = Array.isArray(trade.emotions)
    ? trade.emotions
    : trade.emotion ? [trade.emotion] : [];
  const emotions = emotionLabels
    .map((l) => MOCK_EMOTION_CATALOG.find((e) => e.label === l) ?? { id: 0, label: l });
  const mistakes = (trade.mistakes ?? [])
    .map((l) => MOCK_MISTAKE_CATALOG.find((m) => m.label === l) ?? { id: 0, label: l });
  const setup = trade.setup
    ? (MOCK_SETUP_CATALOG.find((s) => s.label === trade.setup) ?? { id: 0, label: trade.setup })
    : null;
  return { ...trade, asset: assetObj, emotions, mistakes, setup };
}

// Read the journal's catalog from localStorage (handles both old string and new object formats).
function readCatalogFromStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return fallback;
    return data.map((item, i) =>
      typeof item === "string" ? { id: i + 1, label: item } : item
    );
  } catch { return fallback; }
}
function readAssetCatalogFromStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return fallback;
    return data.map((item, i) =>
      typeof item === "string" ? { id: i + 1, symbol: item } : item
    );
  } catch { return fallback; }
}

// Resolve a submitted payload (with asset_id, emotion_ids, etc.) back to expanded objects
// so locally-created trades display correctly in the table without a real backend.
function resolvePayloadToTrade(journalId, payload) {
  const assetCatalog   = readAssetCatalogFromStorage(`journal_assets_${journalId}`,      MOCK_ASSET_CATALOG);
  const emotionCatalog = readCatalogFromStorage(`journal_emotion_tags_${journalId}`,     MOCK_EMOTION_CATALOG);
  const mistakeCatalog = readCatalogFromStorage(`journal_mistake_tags_${journalId}`,     MOCK_MISTAKE_CATALOG);
  const setupCatalog   = readCatalogFromStorage(`journal_setups_${journalId}`,           MOCK_SETUP_CATALOG);

  return {
    ...payload,
    asset:    assetCatalog.find((a) => a.id === payload.asset_id) ?? null,
    emotions: (payload.emotion_ids ?? []).map((id) => emotionCatalog.find((e) => e.id === id)).filter(Boolean),
    mistakes: (payload.mistake_ids ?? []).map((id) => mistakeCatalog.find((m) => m.id === id)).filter(Boolean),
    setup:    payload.setup_id ? (setupCatalog.find((s) => s.id === payload.setup_id) ?? null) : null,
  };
}

// ─── Trades ───────────────────────────────────────────────────────────────────
// Stored with legacy string fields; expandTrade() converts to the current API shape at read time.
// pnl_r and risk_percent are strings to match Django DRF DecimalField output.

const MOCK_TRADES = [
  { id: 30, asset: "US30",    side: "BUY",  status: "WIN",  trend_direction: "BULLISH", opportunity_timeframe: "D1", entry_timeframe: "H4",  setup: "POI Reversal",         session: "New York",       risk_percent: "1.00", pnl_r: "1.50",  entry_datetime: "2025-06-12T13:30:00Z", exit_datetime: "2025-06-12T18:00:00Z", emotion: "Confident", notes: null, created_at: "2025-06-12T13:30:00Z", updated_at: "2025-06-12T18:05:00Z" },
  { id: 29, asset: "GBPUSD",  side: "SELL", status: "OPEN", trend_direction: "BEARISH", opportunity_timeframe: "D1", entry_timeframe: "H4",  setup: "FVG Fill",             session: "London/NY Overlap", risk_percent: "1.00", pnl_r: null,    entry_datetime: "2025-06-09T14:00:00Z", exit_datetime: null,                   emotion: "Calm",      notes: "Clean FVG fill at 1.2750 resistance. SL above 1.2810.", created_at: "2025-06-09T14:00:00Z", updated_at: "2025-06-09T14:00:00Z" },
  { id: 28, asset: "AUDUSD",  side: "BUY",  status: "LOSS", trend_direction: "BULLISH", opportunity_timeframe: "H4", entry_timeframe: "H1",  setup: "Equal Lows Hunt",      session: "Asian",          risk_percent: "0.75", pnl_r: "-1.00", entry_datetime: "2025-06-09T02:00:00Z", exit_datetime: "2025-06-09T06:30:00Z", emotion: "Anxious",   notes: "Entered too early — should have waited for a cleaner structure break.", created_at: "2025-06-09T02:00:00Z", updated_at: "2025-06-09T06:35:00Z" },
  { id: 27, asset: "EURUSD",  side: "BUY",  status: "OPEN", trend_direction: "BULLISH", opportunity_timeframe: "H4", entry_timeframe: "H1",  setup: "BOS + OB Retest",      session: "London",         risk_percent: "1.00", pnl_r: null,    entry_datetime: "2025-06-04T09:30:00Z", exit_datetime: null,                   emotion: "Calm",      notes: null, created_at: "2025-06-04T09:30:00Z", updated_at: "2025-06-04T09:30:00Z" },
  { id: 26, asset: "XAUUSD",  side: "BUY",  status: "WIN",  trend_direction: "BULLISH", opportunity_timeframe: "H4", entry_timeframe: "H1",  setup: "Liquidity Sweep + OB", session: "London",         risk_percent: "1.50", pnl_r: "2.00",  entry_datetime: "2025-06-02T09:30:00Z", exit_datetime: "2025-06-02T14:00:00Z", emotion: "Calm",      notes: null, created_at: "2025-06-02T09:30:00Z", updated_at: "2025-06-02T14:05:00Z" },
  { id: 25, asset: "USDJPY",  side: "SELL", status: "WIN",  trend_direction: "BEARISH", opportunity_timeframe: "H4", entry_timeframe: "M15", setup: "MSS + FVG",            session: "Asian",          risk_percent: "0.75", pnl_r: "1.00",  entry_datetime: "2025-05-26T01:00:00Z", exit_datetime: "2025-05-27T04:00:00Z", emotion: null,        notes: null, created_at: "2025-05-26T01:00:00Z", updated_at: "2025-05-27T04:05:00Z" },
  { id: 24, asset: "NAS100",  side: "BUY",  status: "WIN",  trend_direction: "BULLISH", opportunity_timeframe: "W1", entry_timeframe: "D1",  setup: "BOS + OB Retest",      session: "New York",       risk_percent: "2.00", pnl_r: "3.00",  entry_datetime: "2025-05-19T14:30:00Z", exit_datetime: "2025-05-20T18:00:00Z", emotion: "Confident", notes: "Weekly OB held perfectly. Textbook retest.", created_at: "2025-05-19T14:30:00Z", updated_at: "2025-05-20T18:05:00Z" },
  { id: 23, asset: "XAUUSD",  side: "SELL", status: "LOSS", trend_direction: "BEARISH", opportunity_timeframe: "H4", entry_timeframe: "H1",  setup: "IFVG",                 session: "New York",       risk_percent: "1.00", pnl_r: "-1.00", entry_datetime: "2025-05-12T15:00:00Z", exit_datetime: "2025-05-13T10:00:00Z", emotion: "Anxious",   notes: null, created_at: "2025-05-12T15:00:00Z", updated_at: "2025-05-13T10:05:00Z" },
  { id: 22, asset: "GBPUSD",  side: "SELL", status: "WIN",  trend_direction: "BEARISH", opportunity_timeframe: "D1", entry_timeframe: "H4",  setup: "FVG Fill",             session: "London",         risk_percent: "1.00", pnl_r: "2.50",  entry_datetime: "2025-05-08T09:00:00Z", exit_datetime: "2025-05-09T12:00:00Z", emotion: "Calm",      notes: null, created_at: "2025-05-08T09:00:00Z", updated_at: "2025-05-09T12:05:00Z" },
  { id: 21, asset: "EURUSD",  side: "BUY",  status: "LOSS", trend_direction: "BULLISH", opportunity_timeframe: "H4", entry_timeframe: "H1",  setup: "BOS + OB Retest",      session: "London",         risk_percent: "1.00", pnl_r: "-1.00", entry_datetime: "2025-05-05T09:30:00Z", exit_datetime: "2025-05-05T13:00:00Z", emotion: "FOMO",      notes: "Chased the move. OB was already mitigated on the lower TF.", created_at: "2025-05-05T09:30:00Z", updated_at: "2025-05-05T13:05:00Z" },
  { id: 20, asset: "AUDUSD",  side: "SELL", status: "WIN",  trend_direction: "BEARISH", opportunity_timeframe: "H4", entry_timeframe: "M15", setup: "MSS + FVG",            session: "Asian",          risk_percent: "0.75", pnl_r: "1.50",  entry_datetime: "2025-04-28T03:00:00Z", exit_datetime: "2025-04-28T08:30:00Z", emotion: "Calm",      notes: null, created_at: "2025-04-28T03:00:00Z", updated_at: "2025-04-28T08:35:00Z" },
  { id: 19, asset: "US30",    side: "SELL", status: "WIN",  trend_direction: "BEARISH", opportunity_timeframe: "D1", entry_timeframe: "H4",  setup: "POI Reversal",         session: "New York",       risk_percent: "1.50", pnl_r: "2.00",  entry_datetime: "2025-04-21T14:30:00Z", exit_datetime: "2025-04-22T18:00:00Z", emotion: "Confident", notes: null, created_at: "2025-04-21T14:30:00Z", updated_at: "2025-04-22T18:05:00Z" },
  { id: 18, asset: "GBPUSD",  side: "BUY",  status: "LOSS", trend_direction: "BULLISH", opportunity_timeframe: "H4", entry_timeframe: "H1",  setup: "Equal Lows Hunt",      session: "London",         risk_percent: "1.00", pnl_r: "-1.00", entry_datetime: "2025-04-14T09:30:00Z", exit_datetime: "2025-04-14T14:00:00Z", emotion: null,        notes: null, created_at: "2025-04-14T09:30:00Z", updated_at: "2025-04-14T14:05:00Z" },
  { id: 17, asset: "XAUUSD",  side: "BUY",  status: "WIN",  trend_direction: "BULLISH", opportunity_timeframe: "W1", entry_timeframe: "D1",  setup: "Liquidity Sweep + OB", session: "London",         risk_percent: "2.00", pnl_r: "4.00",  entry_datetime: "2025-04-07T09:00:00Z", exit_datetime: "2025-04-08T14:00:00Z", emotion: "Confident", notes: "Best trade of Q2. Weekly sweep into a pristine OB — held conviction through the session pullback.", created_at: "2025-04-07T09:00:00Z", updated_at: "2025-04-08T14:05:00Z" },
  { id: 16, asset: "EURUSD",  side: "SELL", status: "WIN",  trend_direction: "BEARISH", opportunity_timeframe: "D1", entry_timeframe: "H1",  setup: "FVG Fill",             session: "London",         risk_percent: "1.00", pnl_r: "1.50",  entry_datetime: "2025-04-01T09:30:00Z", exit_datetime: "2025-04-01T15:00:00Z", emotion: "Calm",      notes: null, created_at: "2025-04-01T09:30:00Z", updated_at: "2025-04-01T15:05:00Z" },
  { id: 15, asset: "USDJPY",  side: "BUY",  status: "LOSS", trend_direction: "BULLISH", opportunity_timeframe: "H4", entry_timeframe: "H4",  setup: "IFVG",                 session: "Asian",          risk_percent: "1.00", pnl_r: "-1.00", entry_datetime: "2025-03-24T00:00:00Z", exit_datetime: "2025-03-25T06:00:00Z", emotion: "Anxious",   notes: null, created_at: "2025-03-24T00:00:00Z", updated_at: "2025-03-25T06:05:00Z" },
  { id: 14, asset: "NAS100",  side: "BUY",  status: "WIN",  trend_direction: "BULLISH", opportunity_timeframe: "W1", entry_timeframe: "D1",  setup: "BOS + OB Retest",      session: "New York",       risk_percent: "1.50", pnl_r: "2.00",  entry_datetime: "2025-03-17T14:30:00Z", exit_datetime: "2025-03-18T18:00:00Z", emotion: "Confident", notes: null, created_at: "2025-03-17T14:30:00Z", updated_at: "2025-03-18T18:05:00Z" },
  { id: 13, asset: "XAUUSD",  side: "BUY",  status: "LOSS", trend_direction: "BULLISH", opportunity_timeframe: "H4", entry_timeframe: "H1",  setup: "MSS + FVG",            session: "New York",       risk_percent: "1.00", pnl_r: "-1.00", entry_datetime: "2025-03-10T15:00:00Z", exit_datetime: "2025-03-10T19:00:00Z", emotion: null,        notes: null, created_at: "2025-03-10T15:00:00Z", updated_at: "2025-03-10T19:05:00Z" },
  { id: 12, asset: "GBPUSD",  side: "SELL", status: "WIN",  trend_direction: "BEARISH", opportunity_timeframe: "D1", entry_timeframe: "H1",  setup: "POI Reversal",         session: "London",         risk_percent: "1.00", pnl_r: "3.00",  entry_datetime: "2025-03-06T10:00:00Z", exit_datetime: "2025-03-07T14:00:00Z", emotion: "Confident", notes: null, created_at: "2025-03-06T10:00:00Z", updated_at: "2025-03-07T14:05:00Z" },
  { id: 11, asset: "EURUSD",  side: "BUY",  status: "BE",   trend_direction: "BULLISH", opportunity_timeframe: "H4", entry_timeframe: "M15", setup: "BOS + OB Retest",      session: "London",         risk_percent: "1.00", pnl_r: "0.00",  entry_datetime: "2025-03-03T09:30:00Z", exit_datetime: "2025-03-03T14:00:00Z", emotion: "Calm",      notes: "Moved to BE after +1R, price reversed and closed flat.", created_at: "2025-03-03T09:30:00Z", updated_at: "2025-03-03T14:05:00Z" },
  { id: 10, asset: "AUDUSD",  side: "BUY",  status: "WIN",  trend_direction: "BULLISH", opportunity_timeframe: "H4", entry_timeframe: "H1",  setup: "FVG Fill",             session: "Asian",          risk_percent: "0.75", pnl_r: "2.00",  entry_datetime: "2025-02-24T02:00:00Z", exit_datetime: "2025-02-24T09:00:00Z", emotion: "Calm",      notes: null, created_at: "2025-02-24T02:00:00Z", updated_at: "2025-02-24T09:05:00Z" },
  { id: 9,  asset: "US30",    side: "BUY",  status: "LOSS", trend_direction: "RANGE",   opportunity_timeframe: "D1", entry_timeframe: "H1",  setup: "IFVG",                 session: "New York",       risk_percent: "1.00", pnl_r: "-1.00", entry_datetime: "2025-02-17T15:00:00Z", exit_datetime: "2025-02-18T14:00:00Z", emotion: "Anxious",   notes: "Traded against the higher TF range — should have sat out.", created_at: "2025-02-17T15:00:00Z", updated_at: "2025-02-18T14:05:00Z" },
  { id: 8,  asset: "XAUUSD",  side: "SELL", status: "WIN",  trend_direction: "BEARISH", opportunity_timeframe: "H4", entry_timeframe: "M15", setup: "Equal Lows Hunt",      session: "New York",       risk_percent: "0.50", pnl_r: "1.00",  entry_datetime: "2025-02-10T15:30:00Z", exit_datetime: "2025-02-10T19:00:00Z", emotion: "Calm",      notes: null, created_at: "2025-02-10T15:30:00Z", updated_at: "2025-02-10T19:05:00Z" },
  { id: 7,  asset: "USDJPY",  side: "SELL", status: "WIN",  trend_direction: "BEARISH", opportunity_timeframe: "D1", entry_timeframe: "H4",  setup: "BOS + OB Retest",      session: "Asian",          risk_percent: "1.00", pnl_r: "2.50",  entry_datetime: "2025-02-06T23:00:00Z", exit_datetime: "2025-02-07T08:00:00Z", emotion: "Confident", notes: null, created_at: "2025-02-06T23:00:00Z", updated_at: "2025-02-07T08:05:00Z" },
  { id: 6,  asset: "GBPUSD",  side: "BUY",  status: "LOSS", trend_direction: "BULLISH", opportunity_timeframe: "W1", entry_timeframe: "D1",  setup: "Liquidity Sweep + OB", session: "London",         risk_percent: "1.50", pnl_r: "-1.00", entry_datetime: "2025-02-03T09:30:00Z", exit_datetime: "2025-02-03T16:00:00Z", emotion: null,        notes: null, created_at: "2025-02-03T09:30:00Z", updated_at: "2025-02-03T16:05:00Z" },
  { id: 5,  asset: "EURUSD",  side: "SELL", status: "WIN",  trend_direction: "BEARISH", opportunity_timeframe: "H4", entry_timeframe: "H1",  setup: "MSS + FVG",            session: "London/NY Overlap", risk_percent: "1.00", pnl_r: "1.50",  entry_datetime: "2025-01-27T14:00:00Z", exit_datetime: "2025-01-27T18:30:00Z", emotion: "Calm",      notes: null, created_at: "2025-01-27T14:00:00Z", updated_at: "2025-01-27T18:35:00Z" },
  { id: 4,  asset: "NAS100",  side: "SELL", status: "LOSS", trend_direction: "BEARISH", opportunity_timeframe: "H4", entry_timeframe: "H1",  setup: "IFVG",                 session: "New York",       risk_percent: "1.00", pnl_r: "-1.00", entry_datetime: "2025-01-20T15:30:00Z", exit_datetime: "2025-01-21T14:00:00Z", emotion: "Anxious",   notes: null, created_at: "2025-01-20T15:30:00Z", updated_at: "2025-01-21T14:05:00Z" },
  { id: 3,  asset: "XAUUSD",  side: "BUY",  status: "WIN",  trend_direction: "BULLISH", opportunity_timeframe: "D1", entry_timeframe: "H1",  setup: "POI Reversal",         session: "London",         risk_percent: "1.50", pnl_r: "3.00",  entry_datetime: "2025-01-14T10:00:00Z", exit_datetime: "2025-01-14T16:00:00Z", emotion: "Confident", notes: null, created_at: "2025-01-14T10:00:00Z", updated_at: "2025-01-14T16:05:00Z" },
  { id: 2,  asset: "GBPUSD",  side: "SELL", status: "LOSS", trend_direction: "BEARISH", opportunity_timeframe: "D1", entry_timeframe: "H4",  setup: "FVG Fill",             session: "London",         risk_percent: "1.00", pnl_r: "-1.00", entry_datetime: "2025-01-09T10:00:00Z", exit_datetime: "2025-01-10T09:30:00Z", emotion: null,        notes: null, created_at: "2025-01-09T10:00:00Z", updated_at: "2025-01-10T09:35:00Z" },
  { id: 1,  asset: "EURUSD",  side: "BUY",  status: "WIN",  trend_direction: "BULLISH", opportunity_timeframe: "H4", entry_timeframe: "H1",  setup: "BOS + OB Retest",      session: "London",         risk_percent: "1.00", pnl_r: "2.00",  entry_datetime: "2025-01-06T09:30:00Z", exit_datetime: "2025-01-06T15:45:00Z", emotion: "Calm",      notes: "Clean BOS on H1 into a fresh OB. Textbook entry.", created_at: "2025-01-06T09:30:00Z", updated_at: "2025-01-06T15:50:00Z" },
  // ── 2024 ──────────────────────────────────────────────────────────────────────
  { id: 31, asset: "EURUSD",  side: "BUY",  status: "WIN",  trend_direction: "BULLISH", opportunity_timeframe: "H4", entry_timeframe: "H1",  setup: "BOS + OB Retest",      session: "London",         risk_percent: "1.00", pnl_r: "2.00",  entry_datetime: "2024-01-08T09:30:00Z", exit_datetime: "2024-01-08T15:00:00Z", emotion: "Calm",      notes: null, created_at: "2024-01-08T09:30:00Z", updated_at: "2024-01-08T15:05:00Z" },
  { id: 32, asset: "XAUUSD",  side: "SELL", status: "LOSS", trend_direction: "BEARISH", opportunity_timeframe: "H4", entry_timeframe: "H1",  setup: "IFVG",                 session: "New York",       risk_percent: "1.00", pnl_r: "-1.00", entry_datetime: "2024-01-22T15:00:00Z", exit_datetime: "2024-01-22T19:30:00Z", emotion: "Anxious",   notes: "IFVG invalidated by a strong momentum candle. Should have skipped.", created_at: "2024-01-22T15:00:00Z", updated_at: "2024-01-22T19:35:00Z" },
  { id: 33, asset: "NAS100",  side: "BUY",  status: "WIN",  trend_direction: "BULLISH", opportunity_timeframe: "W1", entry_timeframe: "D1",  setup: "BOS + OB Retest",      session: "New York",       risk_percent: "2.00", pnl_r: "3.00",  entry_datetime: "2024-02-05T14:30:00Z", exit_datetime: "2024-02-06T18:00:00Z", emotion: "Confident", notes: "Weekly OB held. Held through NY session pullback.", created_at: "2024-02-05T14:30:00Z", updated_at: "2024-02-06T18:05:00Z" },
  { id: 34, asset: "GBPUSD",  side: "SELL", status: "LOSS", trend_direction: "BEARISH", opportunity_timeframe: "D1", entry_timeframe: "H4",  setup: "FVG Fill",             session: "London",         risk_percent: "1.00", pnl_r: "-1.00", entry_datetime: "2024-02-19T09:30:00Z", exit_datetime: "2024-02-19T14:00:00Z", emotion: null,        notes: null, created_at: "2024-02-19T09:30:00Z", updated_at: "2024-02-19T14:05:00Z" },
  { id: 35, asset: "USDJPY",  side: "SELL", status: "WIN",  trend_direction: "BEARISH", opportunity_timeframe: "D1", entry_timeframe: "H4",  setup: "POI Reversal",         session: "Asian",          risk_percent: "1.00", pnl_r: "1.50",  entry_datetime: "2024-03-04T00:00:00Z", exit_datetime: "2024-03-04T08:00:00Z", emotion: "Calm",      notes: null, created_at: "2024-03-04T00:00:00Z", updated_at: "2024-03-04T08:05:00Z" },
  { id: 36, asset: "AUDUSD",  side: "BUY",  status: "WIN",  trend_direction: "BULLISH", opportunity_timeframe: "H4", entry_timeframe: "H1",  setup: "MSS + FVG",            session: "Asian",          risk_percent: "0.75", pnl_r: "2.00",  entry_datetime: "2024-03-18T02:00:00Z", exit_datetime: "2024-03-18T09:00:00Z", emotion: "Calm",      notes: null, created_at: "2024-03-18T02:00:00Z", updated_at: "2024-03-18T09:05:00Z" },
  { id: 37, asset: "US30",    side: "BUY",  status: "LOSS", trend_direction: "RANGE",   opportunity_timeframe: "D1", entry_timeframe: "H1",  setup: "Equal Lows Hunt",      session: "New York",       risk_percent: "1.00", pnl_r: "-1.00", entry_datetime: "2024-03-25T14:30:00Z", exit_datetime: "2024-03-25T18:00:00Z", emotion: "FOMO",      notes: "Entered into a range expansion. Stopped out at the high of the range.", created_at: "2024-03-25T14:30:00Z", updated_at: "2024-03-25T18:05:00Z" },
  { id: 38, asset: "XAUUSD",  side: "BUY",  status: "WIN",  trend_direction: "BULLISH", opportunity_timeframe: "W1", entry_timeframe: "D1",  setup: "Liquidity Sweep + OB", session: "London",         risk_percent: "2.00", pnl_r: "4.00",  entry_datetime: "2024-04-08T09:00:00Z", exit_datetime: "2024-04-09T14:00:00Z", emotion: "Confident", notes: "Gold weekly sweep — same setup as the best trade I had in 2025.", created_at: "2024-04-08T09:00:00Z", updated_at: "2024-04-09T14:05:00Z" },
  { id: 39, asset: "EURUSD",  side: "BUY",  status: "BE",   trend_direction: "BULLISH", opportunity_timeframe: "H4", entry_timeframe: "M15", setup: "BOS + OB Retest",      session: "London",         risk_percent: "1.00", pnl_r: "0.00",  entry_datetime: "2024-04-22T09:30:00Z", exit_datetime: "2024-04-22T14:00:00Z", emotion: "Calm",      notes: "Moved SL to BE at +1R, price reversed and closed flat.", created_at: "2024-04-22T09:30:00Z", updated_at: "2024-04-22T14:05:00Z" },
  { id: 40, asset: "GBPUSD",  side: "SELL", status: "WIN",  trend_direction: "BEARISH", opportunity_timeframe: "D1", entry_timeframe: "H1",  setup: "POI Reversal",         session: "London",         risk_percent: "1.00", pnl_r: "2.50",  entry_datetime: "2024-05-06T09:00:00Z", exit_datetime: "2024-05-07T12:00:00Z", emotion: "Confident", notes: null, created_at: "2024-05-06T09:00:00Z", updated_at: "2024-05-07T12:05:00Z" },
  { id: 41, asset: "NAS100",  side: "SELL", status: "LOSS", trend_direction: "BEARISH", opportunity_timeframe: "H4", entry_timeframe: "H1",  setup: "IFVG",                 session: "New York",       risk_percent: "1.00", pnl_r: "-1.00", entry_datetime: "2024-05-20T15:30:00Z", exit_datetime: "2024-05-20T19:00:00Z", emotion: "Anxious",   notes: null, created_at: "2024-05-20T15:30:00Z", updated_at: "2024-05-20T19:05:00Z" },
  { id: 42, asset: "XAUUSD",  side: "BUY",  status: "WIN",  trend_direction: "BULLISH", opportunity_timeframe: "H4", entry_timeframe: "H1",  setup: "FVG Fill",             session: "London",         risk_percent: "1.00", pnl_r: "1.50",  entry_datetime: "2024-06-03T09:30:00Z", exit_datetime: "2024-06-03T15:00:00Z", emotion: "Calm",      notes: null, created_at: "2024-06-03T09:30:00Z", updated_at: "2024-06-03T15:05:00Z" },
  { id: 43, asset: "USDJPY",  side: "BUY",  status: "LOSS", trend_direction: "BULLISH", opportunity_timeframe: "H4", entry_timeframe: "H4",  setup: "MSS + FVG",            session: "Asian",          risk_percent: "1.00", pnl_r: "-1.00", entry_datetime: "2024-06-17T00:00:00Z", exit_datetime: "2024-06-17T08:00:00Z", emotion: "Anxious",   notes: null, created_at: "2024-06-17T00:00:00Z", updated_at: "2024-06-17T08:05:00Z" },
  { id: 44, asset: "EURUSD",  side: "BUY",  status: "WIN",  trend_direction: "BULLISH", opportunity_timeframe: "D1", entry_timeframe: "H1",  setup: "BOS + OB Retest",      session: "London",         risk_percent: "1.00", pnl_r: "2.00",  entry_datetime: "2024-07-01T09:30:00Z", exit_datetime: "2024-07-01T16:00:00Z", emotion: "Calm",      notes: null, created_at: "2024-07-01T09:30:00Z", updated_at: "2024-07-01T16:05:00Z" },
  { id: 45, asset: "US30",    side: "BUY",  status: "WIN",  trend_direction: "BULLISH", opportunity_timeframe: "H4", entry_timeframe: "H1",  setup: "Liquidity Sweep + OB", session: "New York",       risk_percent: "1.50", pnl_r: "1.50",  entry_datetime: "2024-07-15T14:30:00Z", exit_datetime: "2024-07-15T18:00:00Z", emotion: "Confident", notes: null, created_at: "2024-07-15T14:30:00Z", updated_at: "2024-07-15T18:05:00Z" },
  { id: 46, asset: "AUDUSD",  side: "SELL", status: "LOSS", trend_direction: "BEARISH", opportunity_timeframe: "H4", entry_timeframe: "M15", setup: "Equal Lows Hunt",      session: "Asian",          risk_percent: "0.75", pnl_r: "-1.00", entry_datetime: "2024-07-29T02:00:00Z", exit_datetime: "2024-07-29T07:30:00Z", emotion: null,        notes: null, created_at: "2024-07-29T02:00:00Z", updated_at: "2024-07-29T07:35:00Z" },
  { id: 47, asset: "XAUUSD",  side: "BUY",  status: "WIN",  trend_direction: "BULLISH", opportunity_timeframe: "W1", entry_timeframe: "D1",  setup: "POI Reversal",         session: "London",         risk_percent: "2.00", pnl_r: "3.00",  entry_datetime: "2024-08-12T09:00:00Z", exit_datetime: "2024-08-13T14:00:00Z", emotion: "Confident", notes: null, created_at: "2024-08-12T09:00:00Z", updated_at: "2024-08-13T14:05:00Z" },
  { id: 48, asset: "GBPUSD",  side: "BUY",  status: "LOSS", trend_direction: "BULLISH", opportunity_timeframe: "H4", entry_timeframe: "H1",  setup: "FVG Fill",             session: "London",         risk_percent: "1.00", pnl_r: "-1.00", entry_datetime: "2024-08-26T09:30:00Z", exit_datetime: "2024-08-26T14:00:00Z", emotion: "Anxious",   notes: null, created_at: "2024-08-26T09:30:00Z", updated_at: "2024-08-26T14:05:00Z" },
  { id: 49, asset: "NAS100",  side: "BUY",  status: "WIN",  trend_direction: "BULLISH", opportunity_timeframe: "W1", entry_timeframe: "D1",  setup: "BOS + OB Retest",      session: "New York",       risk_percent: "1.50", pnl_r: "2.00",  entry_datetime: "2024-09-09T14:30:00Z", exit_datetime: "2024-09-10T18:00:00Z", emotion: "Confident", notes: null, created_at: "2024-09-09T14:30:00Z", updated_at: "2024-09-10T18:05:00Z" },
  { id: 50, asset: "EURUSD",  side: "SELL", status: "WIN",  trend_direction: "BEARISH", opportunity_timeframe: "D1", entry_timeframe: "H1",  setup: "MSS + FVG",            session: "London/NY Overlap", risk_percent: "1.00", pnl_r: "1.50",  entry_datetime: "2024-09-23T14:00:00Z", exit_datetime: "2024-09-23T18:30:00Z", emotion: "Calm",      notes: null, created_at: "2024-09-23T14:00:00Z", updated_at: "2024-09-23T18:35:00Z" },
];

// ─── Mock API functions ───────────────────────────────────────────────────────

import {
  applyLocalStore,
  createLocalTrade,
  updateLocalTrade,
  deleteLocalTrade,
} from "./localTradesStore";

function allTrades(workspaceId) {
  // Expand legacy string fields to {id, symbol/label} objects for all trades
  return applyLocalStore(MOCK_TRADES, workspaceId).map(expandTrade);
}

export function mockCreateTrade(workspaceId, payload) {
  // Resolve submitted IDs back to objects so the trade displays correctly in the table
  const trade = resolvePayloadToTrade(workspaceId, payload);
  return Promise.resolve(createLocalTrade(workspaceId, trade));
}

export function mockUpdateTrade(workspaceId, id, patch) {
  const resolvedPatch = resolvePayloadToTrade(workspaceId, patch);
  updateLocalTrade(workspaceId, id, resolvedPatch);
  const updated = allTrades(workspaceId).find((t) => t.id === id) ?? null;
  return Promise.resolve(updated);
}

export function mockDeleteTrade(workspaceId, id) {
  deleteLocalTrade(workspaceId, id);
  return Promise.resolve();
}

export function mockFetchCareerData(workspaceId) {
  const map = {};
  allTrades(workspaceId).forEach((t) => {
    if (!t.pnl_r) return;
    const d = new Date(t.entry_datetime);
    const y = d.getFullYear();
    const m = d.getMonth();
    if (!map[y]) map[y] = {};
    if (!map[y][m]) map[y][m] = [];
    map[y][m].push(t);
  });

  const years = Object.keys(map).map(Number).sort((a, b) => b - a);

  const yearSummaries = years.map((year) => {
    const trades = Object.values(map[year]).flat();
    const wins = trades.filter((t) => t.status === "WIN").length;
    const totalR = trades.reduce((s, t) => s + parseFloat(t.pnl_r), 0);
    const grossProfit = trades.filter((t) => parseFloat(t.pnl_r) > 0).reduce((s, t) => s + parseFloat(t.pnl_r), 0);
    const grossLoss = Math.abs(trades.filter((t) => parseFloat(t.pnl_r) < 0).reduce((s, t) => s + parseFloat(t.pnl_r), 0));
    return {
      year,
      trades: trades.length,
      wins,
      losses: trades.filter((t) => t.status === "LOSS").length,
      winRate: trades.length > 0 ? Math.round((wins / trades.length) * 1000) / 10 : 0,
      totalR: Math.round(totalR * 100) / 100,
      profitFactor: grossLoss === 0 ? grossProfit : Math.round((grossProfit / grossLoss) * 100) / 100,
    };
  });

  const heatmap = {};
  years.forEach((year) => {
    heatmap[year] = {};
    Object.entries(map[year]).forEach(([m, trades]) => {
      const r = trades.reduce((s, t) => s + parseFloat(t.pnl_r), 0);
      heatmap[year][Number(m)] = Math.round(r * 100) / 100;
    });
  });

  return Promise.resolve({ yearSummaries, heatmap, years });
}

export function mockFetchHubTrades(workspaceId, { years = [] } = {}) {
  let results = allTrades(workspaceId);
  if (years.length > 0) {
    results = results.filter((t) =>
      years.includes(new Date(t.entry_datetime).getFullYear())
    );
  }
  return Promise.resolve(
    [...results].sort((a, b) => new Date(a.entry_datetime) - new Date(b.entry_datetime))
  );
}

const PAGE_SIZE = 20;

export function mockFetchDashboardSummary(_workspaceId) {
  return Promise.resolve(MOCK_DASHBOARD_SUMMARY);
}

export function mockFetchEquityCurve(_workspaceId, period = "weekly") {
  return Promise.resolve(MOCK_EQUITY_CURVE[period] ?? MOCK_EQUITY_CURVE.weekly);
}

export function mockFetchWinLossDistribution(_workspaceId) {
  return Promise.resolve(MOCK_WIN_LOSS_DISTRIBUTION);
}

export function mockFetchPnlBySetup(_workspaceId) {
  return Promise.resolve(MOCK_PNL_BY_SETUP);
}

export function mockFetchTrades(workspaceId, params = {}) {
  const { page = 1, search = "" } = params;
  const q = search.toLowerCase();
  const all = allTrades(workspaceId);
  const filtered = q
    ? all.filter(
        (t) =>
          t.asset?.symbol?.toLowerCase().includes(q) ||
          t.setup?.label?.toLowerCase().includes(q)
      )
    : all;
  const start = (page - 1) * PAGE_SIZE;
  return Promise.resolve({
    count: filtered.length,
    results: filtered.slice(start, start + PAGE_SIZE),
  });
}

export function mockFetchTrade(workspaceId, id) {
  return Promise.resolve(allTrades(workspaceId).find((t) => t.id === Number(id)) ?? null);
}
