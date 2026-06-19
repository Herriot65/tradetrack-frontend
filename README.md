# TradeTrack Analytics — Frontend

A SaaS trading performance dashboard built with React 19 and Vite. Traders can log trades, track multi-year performance, and analyse their edge through an interactive Performance Hub.

---

## Tech Stack

| Layer | Library |
|---|---|
| Framework | React 19 + Vite |
| Styling | Tailwind CSS v3 |
| Components | shadcn/ui (Radix UI primitives) |
| Routing | React Router v7 |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| HTTP | Axios |
| Export | html-to-image |

**Path alias:** `@` → `./src`

---

## Getting Started

```bash
npm install
npm run dev        # dev server (localhost:5173)
npm run build      # production build
npm run preview    # preview production build
npm run lint       # ESLint
```

### Environment

Create a `.env.local` file at the project root:

```env
VITE_API_BASE_URL=http://localhost:8000/api   # Django backend
VITE_USE_MOCK=true                             # use mock data (no backend needed)
```

If `VITE_API_BASE_URL` is unset it defaults to `http://localhost:8000/api`.  
Set `VITE_USE_MOCK=true` to run the app entirely with local mock data — no backend required.

---

## Project Structure

```
src/
├── api/              # Axios instance + per-domain API functions (workspace-scoped)
│   ├── axios.js      # Base Axios instance with auth interceptor + token refresh
│   ├── analytics.api.js
│   ├── dashboard.api.js
│   ├── hub.api.js
│   ├── trades.api.js
│   └── workspaces.api.js
│
├── auth/             # Auth system
│   ├── AuthContext.jsx
│   ├── AuthProvider.jsx
│   ├── ProtectedRoute.jsx
│   ├── tokenService.js
│   └── useAuth.js
│
├── workspaces/       # Workspace system
│   ├── WorkspaceContext.jsx
│   └── useWorkspace.js
│
├── hooks/            # Data-fetching hooks
│   ├── useAsyncQuery.js        # Base hook: loading/error/cancel/refetch
│   ├── useCareerData.js        # Career-level heatmap + year summaries
│   ├── useHubAnalytics.js      # All Performance Hub analytics (single fetch, client-side filtering)
│   ├── useTrades.js
│   ├── useDashboardSummary.js
│   ├── useEquityCurve.js
│   ├── usePnlBySetup.js
│   └── useWinLossDistribution.js
│
├── components/
│   ├── ui/           # shadcn/ui primitives (Button, Card, Input, Badge, Dialog, …)
│   ├── forms/        # LoginForm, RegisterForm, PasswordInput, FieldError, FormErrorBanner
│   ├── landing/      # Landing page sections (Hero, Features, Pricing, …)
│   ├── dashboard/    # DashboardLayout, WorkspaceSwitcher, WorkspaceFormDialog
│   ├── hub/          # All Performance Hub widgets (see below)
│   └── journal/      # Trading journal components
│
├── pages/
│   ├── Landing.jsx
│   ├── Login.jsx
│   ├── Register.jsx
│   ├── Dashboard.jsx       # Workspace selector home
│   ├── Workspace.jsx       # Trading journal (per-workspace)
│   └── PerformanceHub.jsx  # Performance Hub analytics
│
├── schemas/          # Zod validation schemas (login, register, workspace)
├── mocks/            # Mock data + mock API functions
└── lib/              # formatters.js, tradeLabels.js, utils.js (cn helper)
```

---

## Authentication

`AuthProvider` wraps the entire app in `main.jsx`. On mount it reads `localStorage` for an access token and calls `GET /api/auth/me/` to rehydrate the user. `tokenService.js` owns all `localStorage` reads/writes for `access` and `refresh` keys.

The Axios instance attaches `Authorization: Bearer <token>` to every request and intercepts 401 responses: it attempts one silent refresh via `POST /api/auth/refresh/`; if that also fails it clears tokens and redirects to `/login`.

`ProtectedRoute` redirects unauthenticated users to `/login`. The `useAuth` hook exposes `{ user, login, logout, loading, isAuthenticated }`.

---

## Workspace System

`WorkspaceProvider` sits inside `AuthProvider`. When auth resolves to `true` it fetches `GET /api/workspaces/`, restores the last-used workspace from `localStorage` (`last_workspace_id`), and falls back to the first workspace.

`useWorkspace()` exposes `{ workspaces, activeWorkspace, loading, selectWorkspace, createWorkspace, renameWorkspace, deleteWorkspace }`.

All dashboard, analytics, and trade API calls are workspace-scoped — they embed `workspaceId` in the URL path. No call fires if `activeWorkspace` is null.

---

## Pages & Routes

| Route | Page | Description |
|---|---|---|
| `/` | Landing | Marketing landing page |
| `/login` | Login | Auth — JWT login |
| `/register` | Register | Auth — account creation |
| `/dashboard` | Dashboard | Workspace selector grid |
| `/workspace/:workspaceId` | Workspace | Trading journal for the active workspace |
| `/workspace/:workspaceId/hub` | PerformanceHub | Multi-year analytics hub |

---

## Trading Journal (`/workspace/:id`)

The workspace page is a pure trading journal — no charts or KPIs.

- Trades fetched via `useTrades()`, grouped by entry date into a timeline
- **Filters:** live search (asset / setup, server-side) + status pills (All / Open / Wins / Losses / Break Even)
- Each trade card shows: side (BUY/SELL), asset, setup, session, R multiple, status — with a coloured left-border accent (emerald = WIN, red = LOSS, amber = OPEN, grey = BE)
- Click any card to **expand** inline: entry/exit datetimes, risk %, trend direction, timeframes, emotion, and notes

---

## Performance Hub (`/workspace/:id/hub`)

A centralised analytics command centre. All trade data is fetched once and filtered client-side — year selection never triggers a network round-trip.

### KPI Strip (8 cards)

Total R · Win Rate · Total Trades · Avg R · Max Drawdown · Profit Factor · Max Win Streak · Max Loss Streak

Cards have a coloured left-border accent and value text matching metric sentiment (emerald / red / zinc).

### Year View (2-column layout)

**Left column — time-series charts:**
- **Equity Curve** — AreaChart with gradient fill; smart X-axis (year boundaries for multi-year, month boundaries for single-year); mask toggle (eye icon) hides exact R values
- **Drawdown Chart** — Red area chart showing running peak-to-trough drawdown; Y-axis always shows at least −2R range
- **R per Trade** — Bar chart, one bar per closed trade; green = win, red = loss, zero baseline
- **Asset Breakdown** — Horizontal bar chart showing net R per asset, sorted best to worst

**Right column — summary panels:**
- Annual Performance table (filters to selected years)
- Monthly Heatmap (12 × N grid; filters to selected years; click a cell to open month detail)
- Win/Loss donut + Profit/Loss donut

### Year Selection

`HubHeader` provides an **All** button + individual year pills (multi-select toggle). Selecting years narrows the equity curve, drawdown, R-per-trade, asset chart, annual table, and heatmap simultaneously.

### Month Detail Dialog

Clicking a heatmap cell opens a full-screen dialog for that month:
- Equity curve + performance calendar + R-per-trade (left column)
- Stats panel + Win/Loss donut + Profit/Loss donut (right column)
- **Save as PNG** button exports the dialog content at 2× resolution via `html-to-image`

**Performance Calendar** — full month grid; days are coloured by net R (green/red/grey); open-position days show amber with an "OPEN" label.

---

## Data Fetching Pattern

`useAsyncQuery(fetchFn, deps, { enabled })` is the base async hook — handles loading/error state, cancellation, and a `refetch()` callback. Pass `enabled: false` to suppress the fetch.

All domain hooks pull `workspaceId` from `useWorkspace()` and pass it as the first argument to their API function.

### API Contract (workspace-scoped)

```
GET/POST              /api/workspaces/
GET/PATCH/DELETE      /api/workspaces/{id}/

GET  /api/workspaces/{id}/dashboard/summary/
GET  /api/workspaces/{id}/analytics/equity-curve/?period=weekly|monthly|yearly
GET  /api/workspaces/{id}/analytics/win-loss-distribution/
GET  /api/workspaces/{id}/analytics/pnl-by-setup/

GET/POST              /api/workspaces/{id}/trades/
GET/PATCH/DELETE      /api/workspaces/{id}/trades/{tradeId}/
```

---

## Mock Data

Set `VITE_USE_MOCK=true` to run without a backend.

Mock dataset: **50 trades** across two years:
- **2025** — 28 closed trades + 2 open positions (Jan–Jun)
- **2024** — 20 closed trades (Jan–Sep)

Mock functions mirror real API signatures so API files delegate with a single `if (USE_MOCK)` guard.

---

## Formatting Utilities

`src/lib/formatters.js` exports:

| Function | Output example |
|---|---|
| `formatR(value)` | `+2.50R` / `-1.00R` |
| `formatPercent(value)` | `60.71%` |
| `formatNumber(value)` | `1,234` |
| `formatDate(iso)` | `Jun 12, 2025` |
| `formatDateTime(iso)` | `Jun 12, 2025 13:30` |
| `formatTradePeriod(iso)` | Period label |
