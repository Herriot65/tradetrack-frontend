# Frontend → Backend Handoff (v2)

This document captures the current state of the frontend's data model and what the Django backend must implement to fully replace mock data and local storage. It supersedes the initial v1 handoff after applying the Handoff Resolution corrections.

---

## 1. Architecture Overview

The frontend uses a **journal-centric** model. A **Journal** is the top-level entity that owns Trades, Analytics, and user-defined catalogs. All API routes use the `/journals/` prefix.

**Mock / real toggle:** Set `VITE_USE_MOCK=true` in `.env.local` to use mock data. When unset (or `false`), every API call hits the real backend.

```js
export const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";
```

---

## 2. Entity Shapes

### 2.1 Journal

**Backend-persisted fields:**

| Field | Type | Notes |
|-------|------|-------|
| `id` | integer | PK |
| `name` | string | max 255 chars |
| `journal_type` | `"trading" \| "backtest"` | |
| `starting_capital` | decimal | positive |
| `currency` | string | e.g. `"USD"` |
| `break_even_method` | `"ratio" \| "profit"` | affects BE derivation |
| `created_at` | datetime (ISO 8601) | |
| `updated_at` | datetime (ISO 8601) | |

**Note:** `journal_type`, `starting_capital`, `currency`, and `break_even_method` are currently stored in `localStorage` under `journal_meta_{id}`. They must be moved to the backend so they sync across devices.

---

### 2.2 Trade

#### Core execution fields

| Field | Type | Notes |
|-------|------|-------|
| `id` | integer | PK |
| `asset` | FK → Asset | **not a string** — see §2.3 |
| `side` | `"BUY" \| "SELL"` | |
| `entry_datetime` | datetime (ISO 8601) | required |
| `exit_datetime` | datetime (ISO 8601) \| null | null = still open |
| `risk_percent` | decimal string \| null | e.g. `"1.00"` |
| `pnl_r` | decimal string \| null | R-multiple, e.g. `"1.50"` |
| `commission` | decimal \| null | dollar amount |
| `swap` | decimal \| null | dollar amount |

#### Setup / context fields

| Field | Type | Notes |
|-------|------|-------|
| `opportunity_timeframe` | string \| null | e.g. `"D1"` |
| `entry_timeframe` | string \| null | e.g. `"H1"` |
| `trend_direction` | string \| null | e.g. `"BULLISH"` |
| `setup` | FK → SetupTag \| null | **not a string** — see §2.3 |
| `session` | string \| null | e.g. `"London"` |

#### Psychology fields

| Field | Type | Notes |
|-------|------|-------|
| `emotions` | M2M → EmotionTag | required, at least one |
| `mistakes` | M2M → MistakeTag | optional |
| `notes` | string \| null | free-form text |

#### Status

| Field | Type | Notes |
|-------|------|-------|
| `status` | `"WIN" \| "LOSS" \| "BE" \| "OPEN" \| null` | null = auto-derive |

**Derivation rule** (`src/lib/deriveStatus.js`):
- If `status` is non-null → use as-is (manual override, persists forever once set)
- Else if `exit_datetime` is null → `"OPEN"`
- Else if `pnl_r > 0` → `"WIN"`, `pnl_r < 0` → `"LOSS"`, `pnl_r == 0` → `"BE"`

**Note:** `OPEN` is a real fourth value, not a synonym for `null`. A trade with `status: null` and `exit_datetime: null` is effectively `OPEN`. A trade cannot be manually set to any other status while `exit_datetime` is null and `pnl_r` is null.

#### Audit

| Field | Type |
|-------|------|
| `created_at` | datetime (ISO 8601) |
| `updated_at` | datetime (ISO 8601) |

#### Frontend-only fields (not persisted to the backend)

| Field | Source | Notes |
|-------|--------|-------|
| `notesSections` | TradePanel | 3-section rich-note blobs with embedded images. No API endpoint yet. |

---

### 2.3 Catalog Entities

Four journal-owned catalogs follow the same association pattern: **association, not composition** — deleting a catalog item must never delete or corrupt the trades that reference it. Use soft-delete (`is_archived`) instead of hard-delete.

#### Asset

```python
class Asset(models.Model):
    journal    = models.ForeignKey(Journal, on_delete=models.CASCADE, related_name="assets")
    symbol     = models.CharField(max_length=20)          # stored uppercase
    name       = models.CharField(max_length=100, blank=True)
    is_archived = models.BooleanField(default=False)
```

Trade FK: `asset = models.ForeignKey(Asset, on_delete=models.PROTECT, related_name="trades")`

#### EmotionTag

```python
class EmotionTag(models.Model):
    journal     = models.ForeignKey(Journal, on_delete=models.CASCADE, related_name="emotion_tags")
    label       = models.CharField(max_length=50)
    is_archived = models.BooleanField(default=False)
```

Trade M2M: `emotions = models.ManyToManyField(EmotionTag, through="TradeEmotion")`

#### MistakeTag

```python
class MistakeTag(models.Model):
    journal     = models.ForeignKey(Journal, on_delete=models.CASCADE, related_name="mistake_tags")
    label       = models.CharField(max_length=50)
    is_archived = models.BooleanField(default=False)
```

Trade M2M: `mistakes = models.ManyToManyField(MistakeTag, through="TradeMistake", blank=True)`

#### SetupTag *(v4.1 addition)*

```python
class SetupTag(models.Model):
    journal     = models.ForeignKey(Journal, on_delete=models.CASCADE, related_name="setup_tags")
    label       = models.CharField(max_length=100)
    is_archived = models.BooleanField(default=False)
```

Trade FK: `setup = models.ForeignKey(SetupTag, on_delete=models.PROTECT, null=True, blank=True, related_name="trades")`

**On DELETE for all catalog items:** if referenced by any trade, reject with 409 or auto-archive (recommended). Never cascade-delete the trades. The `PROTECT` on the FK enforces this at the DB level.

---

## 3. API Endpoints

All routes are scoped to a journal. Use `/api/journals/` as the base prefix (not `/api/workspaces/`).

### 3.1 Journals

```
GET    /api/journals/                    → list journals for the authenticated user
POST   /api/journals/                    → create journal
GET    /api/journals/{id}/               → retrieve journal
PATCH  /api/journals/{id}/               → update journal
DELETE /api/journals/{id}/               → delete journal and all its trades
```

**Create request body:**
```json
{
  "name": "Main Account",
  "journal_type": "trading",
  "starting_capital": "10000.00",
  "currency": "USD",
  "break_even_method": "ratio"
}
```

**Response shape:**
```json
{
  "id": 1,
  "name": "Main Account",
  "journal_type": "trading",
  "starting_capital": "10000.00",
  "currency": "USD",
  "break_even_method": "ratio",
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2025-01-01T00:00:00Z"
}
```

---

### 3.2 Catalog CRUD

Same pattern for all four catalogs. `catalogType` = `assets` | `emotion-tags` | `mistake-tags` | `setup-tags`.

```
GET    /api/journals/{id}/assets/
POST   /api/journals/{id}/assets/                       body: { symbol }
PATCH  /api/journals/{id}/assets/{assetId}/             body: { symbol } (rename)
DELETE /api/journals/{id}/assets/{assetId}/             → 409 if referenced, else archive

GET    /api/journals/{id}/emotion-tags/
POST   /api/journals/{id}/emotion-tags/                 body: { label }
PATCH  /api/journals/{id}/emotion-tags/{tagId}/
DELETE /api/journals/{id}/emotion-tags/{tagId}/

GET    /api/journals/{id}/mistake-tags/
POST   /api/journals/{id}/mistake-tags/                 body: { label }
PATCH  /api/journals/{id}/mistake-tags/{tagId}/
DELETE /api/journals/{id}/mistake-tags/{tagId}/

GET    /api/journals/{id}/setup-tags/
POST   /api/journals/{id}/setup-tags/                   body: { label }
PATCH  /api/journals/{id}/setup-tags/{tagId}/
DELETE /api/journals/{id}/setup-tags/{tagId}/
```

**Asset response item:**
```json
{ "id": 1, "symbol": "EURUSD", "name": "", "is_archived": false }
```

**Tag response item (emotion / mistake / setup):**
```json
{ "id": 3, "label": "Calm", "is_archived": false }
```

---

### 3.3 Trades

```
GET    /api/journals/{id}/trades/
POST   /api/journals/{id}/trades/
GET    /api/journals/{id}/trades/{tradeId}/
PATCH  /api/journals/{id}/trades/{tradeId}/
DELETE /api/journals/{id}/trades/{tradeId}/
```

**List query parameters:**

| Param | Type | Default |
|-------|------|---------|
| `page` | integer | 1 |
| `page_size` | integer | 20 |
| `ordering` | string | `-entry_datetime` |
| `status` | string | — |
| `search` | string | — (filters on asset symbol) |

**Create / Update request body:**
```json
{
  "asset_id": 1,
  "side": "BUY",
  "entry_datetime": "2025-06-12T09:30:00Z",
  "exit_datetime": "2025-06-12T14:00:00Z",
  "risk_percent": "1.00",
  "pnl_r": "1.50",
  "commission": "0.00",
  "swap": "0.00",
  "opportunity_timeframe": "D1",
  "entry_timeframe": "H4",
  "trend_direction": "BULLISH",
  "setup_id": 1,
  "session": "London",
  "status": null,
  "emotion_ids": [1, 2],
  "mistake_ids": [],
  "notes": "Clean setup."
}
```

**Read response shape (catalog fields are expanded for display):**
```json
{
  "id": 30,
  "asset": { "id": 1, "symbol": "EURUSD" },
  "side": "BUY",
  "entry_datetime": "2025-06-12T09:30:00Z",
  "exit_datetime": "2025-06-12T14:00:00Z",
  "risk_percent": "1.00",
  "pnl_r": "1.50",
  "commission": "0.00",
  "swap": "0.00",
  "opportunity_timeframe": "D1",
  "entry_timeframe": "H4",
  "trend_direction": "BULLISH",
  "setup": { "id": 1, "label": "Break of Structure" },
  "session": "London",
  "status": null,
  "emotions": [{ "id": 1, "label": "Calm" }, { "id": 2, "label": "Confident" }],
  "mistakes": [],
  "notes": "Clean setup.",
  "created_at": "2025-06-12T09:30:00Z",
  "updated_at": "2025-06-12T14:05:00Z"
}
```

**List response:**
```json
{
  "count": 50,
  "next": null,
  "previous": null,
  "results": [ /* trade objects */ ]
}
```

---

### 3.4 Analytics

```
GET /api/journals/{id}/dashboard/summary/
GET /api/journals/{id}/analytics/equity-curve/?period=weekly|monthly|yearly
GET /api/journals/{id}/analytics/win-loss-distribution/
GET /api/journals/{id}/analytics/pnl-by-setup/
GET /api/journals/{id}/analytics/career/
```

**Dashboard summary:**
```json
{ "total_trades": 30, "win_rate": 60.71, "total_r": 26.0, "profit_factor": 3.6, "max_drawdown_r": -1.0, "average_r": 0.93 }
```

**Equity curve:** `{ "weekly": [{date, equity_r}], "monthly": [...], "yearly": [...] }`

**Win/loss distribution:** `{ "wins": 17, "losses": 10, "break_even": 1 }`

**PnL by setup:** `[{ "setup": "POI Reversal", "total_r": 9.5 }, ...]` sorted descending

**Career data:** `{ "yearSummaries": [...], "heatmap": { year: { monthIndex: totalR } }, "years": [2025, 2024] }`

---

## 4. Frontend API Layer

All API files are in `src/api/`. The route prefix is `/journals/` throughout.

| File | Purpose |
|------|---------|
| `journals.api.js` | Journal CRUD + catalog CRUD stubs |
| `trades.api.js` | Trade CRUD |
| `analytics.api.js` | Equity curve, win/loss, PnL-by-setup |
| `dashboard.api.js` | Dashboard summary |
| `hub.api.js` | Hub trades + career data |

---

## 5. Per-Journal Catalogs — Current State

Catalogs are currently stored **only in `localStorage`** (per journal, by ID). The hook (`src/journals/useJournalCatalog.js`) now stores `{id, symbol/label}` objects and exposes:
- String arrays (`assets`, `emotionTags`, `mistakeTags`, `setups`) — for pickers
- ID maps (`assetMap`, `emotionMap`, `mistakeMap`, `setupMap`) — for submit transformation
- Object arrays (`assetObjects`, `emotionTagObjects`, `mistakeTagObjects`, `setupObjects`) — for display resolution

**localStorage keys:**

| Catalog | Key | Default items |
|---------|-----|---------------|
| Assets | `journal_assets_{id}` | 14 forex/index tickers |
| Emotions | `journal_emotion_tags_{id}` | 10 tags |
| Mistakes | `journal_mistake_tags_{id}` | 7 tags |
| Setups | `journal_setups_{id}` | 8 setups |

**Backend work required:** implement the catalog CRUD endpoints in §3.2. The hook's `src/api/journals.api.js` already has stubs for `fetchCatalog`, `createCatalogItem`, `updateCatalogItem`, `deleteCatalogItem`. When the backend is ready, replace the localStorage reads/writes in `useJournalCatalog.js` with these API calls.

**Default catalog IDs:** Default items get IDs 1..N (index+1). User-added items get `Date.now()` IDs. The mock catalog in `mockData.js` uses the same index+1 scheme for the 50 base trades.

---

## 6. Column Visibility

Stored in `localStorage` key `journal_columns_{id}`. UI state only; no backend needed unless multi-device sync is desired.

**Default visible columns:** `asset`, `entryDate`, `exitDate`, `side`, `riskPercent`, `pnl`, `status`.

---

## 7. Local CRUD (Mock Mode)

The three-layer local store (`src/mocks/localTradesStore.js`) overlays user CRUD changes on top of the 50 static mock trades:

```json
{ "created": [], "updated": { "tradeId": { "...patch..." } }, "deleted": [] }
```

- `createLocalTrade`: receives the form's resolved payload (catalog IDs already expanded to objects by `resolvePayloadToTrade`)
- `updateLocalTrade`: same — patch is pre-expanded
- `deleteLocalTrade`: marks ID as deleted

---

## 8. Auth

```
POST /api/auth/login/       → { access, refresh }
POST /api/auth/register/
GET  /api/auth/me/          → user object (session rehydration on refresh)
POST /api/auth/refresh/     → { access }
POST /api/auth/logout/
```

The Axios instance (`src/api/axios.js`) attaches `Authorization: Bearer <token>` and auto-refreshes on 401.

---

## 9. Known Gaps and Placeholders

| Gap | Current state | Backend task |
|-----|--------------|-------------|
| Catalog sync | localStorage only | Implement §3.2 catalog CRUD; wire `useJournalCatalog` to call API |
| Journal metadata (`journal_type` etc.) | localStorage `journal_meta_{id}` | Add fields to Journal model (§2.1); frontend already collects them in the create form |
| Trade notes / screenshots | `notesSections` in form state only, not persisted | Blob storage + `TradeMedium` model with section title, text, and image URLs |
| `break_even_method` comparison logic | Field collected by frontend, not used in BE derivation yet | Backend `deriveStatus` equivalent must branch on `journal.break_even_method` and `journal.break_even_value` |
| `OPEN` state vs. `exit_datetime: null` | Both used as signals | Treat `exit_datetime: null` as the canonical signal for OPEN; `status: "OPEN"` cannot be manually overridden |
| Pagination | Mock returns page slices; frontend sends `page` param | Implement DRF `PageNumberPagination` |

---

## 10. Switching to the Real API

1. Remove `VITE_USE_MOCK=true` from `.env.local`
2. Set `VITE_API_BASE_URL=http://localhost:8000/api`
3. The local store in `localStorage` has no effect when `USE_MOCK` is false
4. After switching, clear `journal_assets_*`, `journal_emotion_tags_*`, etc. from localStorage — they will be replaced by backend catalog data
