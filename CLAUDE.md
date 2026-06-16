# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start Vite dev server
npm run build     # Production build
npm run lint      # ESLint
npm run preview   # Preview production build locally
```

No test suite is configured yet.

## Environment

The app expects `VITE_API_BASE_URL` to point to the Django backend. If unset, it defaults to `http://localhost:8000/api`.

## Architecture

**Stack:** React 19, Vite, Tailwind CSS v3, shadcn/ui (Radix UI primitives), React Router v7, React Hook Form + Zod, Axios, Recharts.

**Path alias:** `@` maps to `./src` (configured in `vite.config.js`).

### Auth flow

`AuthProvider` (wraps the entire app in `main.jsx`) holds global auth state. On mount it checks `localStorage` for an access token and calls `GET /api/auth/me/` to rehydrate the user. `tokenService.js` owns all `localStorage` read/write for `access` and `refresh` keys.

The Axios instance in `src/api/axios.js` attaches `Authorization: Bearer <token>` on every request and intercepts 401 responses: it attempts one silent token refresh via `POST /api/auth/refresh/`; if that also fails it clears tokens and redirects to `/login`.

`ProtectedRoute` redirects unauthenticated users to `/login`. The `useAuth` hook exposes `{ user, login, logout, loading, isAuthenticated }` from `AuthContext`.

### Workspace flow

`WorkspaceProvider` sits inside `AuthProvider` and watches `isAuthenticated`. When auth resolves to true it calls `GET /api/workspaces/`, restores the last-used workspace from `localStorage` (`last_workspace_id`), and falls back to the first workspace. The `useWorkspace()` hook exposes `{ workspaces, activeWorkspace, loading, selectWorkspace, createWorkspace, renameWorkspace, deleteWorkspace }`.

`DashboardLayout` gates the main content on workspace state: shows a skeleton while workspaces load, a no-workspace onboarding prompt if none exist, and the normal dashboard children otherwise.

All dashboard/analytics/trades API calls are workspace-scoped — they embed `workspaceId` in the URL path. No API call fires if `activeWorkspace` is null (`enabled: !!workspaceId` option in `useAsyncQuery`). Switching workspace (via `WorkspaceSwitcher` in the header) automatically refetches all data because every hook declares `workspaceId` as a dependency.

### Data fetching pattern

`useAsyncQuery(fetchFn, deps, { enabled })` in `src/hooks/useAsyncQuery.js` is the base async hook — handles loading/error state, cancellation, and a `refetch()` callback. Pass `enabled: false` to suppress the fetch (used when `workspaceId` is null). All domain hooks are thin wrappers that pull `workspaceId` from `useWorkspace()` and pass it as the first argument to their API function.

### API contract (workspace-scoped)

```
GET/POST   /api/workspaces/
GET/PATCH/DELETE /api/workspaces/{id}/

GET  /api/workspaces/{id}/dashboard/summary/
GET  /api/workspaces/{id}/analytics/equity-curve/?period=weekly|monthly|yearly
GET  /api/workspaces/{id}/analytics/win-loss-distribution/
GET  /api/workspaces/{id}/analytics/pnl-by-setup/

GET/POST   /api/workspaces/{id}/trades/
GET/PATCH/DELETE /api/workspaces/{id}/trades/{tradeId}/
```

### Directory layout

```
src/
  api/          # Axios instance + per-domain API functions (all workspace-scoped)
  auth/         # AuthContext, AuthProvider, ProtectedRoute, tokenService, useAuth hook
  workspaces/   # WorkspaceContext, WorkspaceProvider, useWorkspace hook
  components/
    ui/          # shadcn/ui primitives (button, input, card, badge, dropdown-menu, …)
    forms/       # Reusable form pieces (LoginForm, RegisterForm, PasswordInput, FieldError, …)
    landing/     # All landing page sections (Hero, Features, Pricing, …)
    dashboard/   # Dashboard widgets + WorkspaceSwitcher + WorkspaceFormDialog
  hooks/         # useAsyncQuery + domain hooks
  lib/           # formatters.js (currency/date/R-multiple helpers), tradeLabels.js, utils.js (cn helper)
  pages/         # Route-level components: Landing, Login, Register, Dashboard
  schemas/       # Zod schemas for forms (loginSchema, registerSchema, workspaceSchema)
```

### Forms

All forms use React Hook Form with `@hookform/resolvers/zod`. Schemas in `src/schemas/` define validation. `FieldError` and `FormErrorBanner` are shared form-error UI components.

### Formatting utilities

`src/lib/formatters.js` exports `formatNumber`, `formatPercent`, `formatR` (R-multiple with sign prefix), `formatDate`, `formatDateTime`, `formatTradePeriod` — use these for any trade/financial value display.
