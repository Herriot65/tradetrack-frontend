// Isolated visual QA: real routes/components, synthetic API boundary, no live account.
import { useCallback, useState } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "../src/App";
import { AuthContext } from "../src/auth/AuthContext";
import { JournalContext } from "../src/journals/JournalContext";
import { TooltipProvider } from "../src/components/ui/tooltip";
import api from "../src/api/axios";
import { setUserTimezone } from "../src/lib/timezone";
import "../src/index.css";

const screen = new URLSearchParams(location.search).get("screen") || "dashboard";
const targets = {
  dashboard: "/dashboard",
  empty: "/dashboard",
  trades: "/journal/1?tab=trades",
  analytics: "/journal/1?tab=analytics",
  fields: "/journal/1?tab=custom-fields",
  trade: "/journal/1?tab=trades",
  settings: "/dashboard",
  create: "/dashboard",
  login: "/login",
  register: "/register",
  missing: "/missing-route",
  landing: "/",
};
history.replaceState({}, "", targets[screen]);
setUserTimezone("Africa/Tunis");
const faults = [];
addEventListener("error", (event) => faults.push(event.message));
addEventListener("unhandledrejection", (event) => faults.push(String(event.reason)));
const initialJournals = [
  {
    id: 1,
    name: "Trading Journal",
    journalType: "trading",
    currency: "USD",
    startingCapital: 10000,
    starting_capital: "10000",
    breakEvenMethod: "ratio",
    breakEvenValue: 0,
    display_unit: "R",
  },
  {
    id: 2,
    name: "Strategy Backtest",
    journalType: "backtest",
    currency: "USD",
    startingCapital: 25000,
    display_unit: "R",
  },
];
const rows = Array.from({ length: 65 }, (_, index) => {
  const r = index % 5 === 0 ? 0 : index % 3 === 0 ? -1 : 1.5;
  return {
    id: index + 1,
    asset: { id: (index % 3) + 1, symbol: ["EURUSD", "GBPUSD", "XAUUSD"][index % 3] },
    side: index % 2 ? "SELL" : "BUY",
    entry_datetime: new Date(Date.UTC(2026, 9, 30 - index, 10, 15)).toISOString(),
    exit_datetime: new Date(Date.UTC(2026, 9, 30 - index, 11, 45)).toISOString(),
    pnl_r: String(r),
    risk_percent: "1",
    capital_basis: "10000",
    risk_amount: "100",
    pnl_amount: String(r * 100),
    effective_status: r === 0 ? "BE" : r > 0 ? "WIN" : "LOSS",
    status: null,
    setup: { id: 1, label: "Breakout" },
    emotions: [{ id: 1, label: "Calm" }],
    mistakes: [],
    screenshots: [],
    custom_fields: {},
    trade_score: 7.5,
    notes: "A documented trading decision.",
  };
});
const requests = [];
api.defaults.adapter = async (config) => {
  const reply = (data) => ({ data, status: 200, statusText: "OK", headers: {}, config });
  if (config.url.endsWith("/trades/")) {
    const params = config.params || {};
    requests.push(params);
    const filtered = rows.filter(
      (row) =>
        (!params.status || row.effective_status === params.status) &&
        (!params.search || row.asset.symbol.toLowerCase().includes(params.search.toLowerCase())),
    );
    const field = (params.ordering || "-entry_datetime").split(",")[0],
      descending = field.startsWith("-"),
      key = descending ? field.slice(1) : field;
    const value = (row) =>
      key === "asset__symbol"
        ? row.asset.symbol
        : key === "display_pnl_r"
          ? Number(row.pnl_r)
          : key === "pnl_percent"
            ? Number(row.pnl_amount) / 100
            : Number.isFinite(Number(row[key]))
              ? Number(row[key])
              : row[key];
    filtered.sort(
      (a, b) => (value(a) < value(b) ? -1 : value(a) > value(b) ? 1 : 0) * (descending ? -1 : 1),
    );
    const size = Number(params.page_size || 20),
      start = (Number(params.page || 1) - 1) * size;
    return reply({ count: filtered.length, results: filtered.slice(start, start + size) });
  }
  if (/\/trades\/\d+\/$/.test(config.url))
    return reply(rows.find((row) => config.url.includes(`/trades/${row.id}/`)) || rows[0]);
  if (config.url.endsWith("/assets/"))
    return reply([
      { id: 1, symbol: "EURUSD" },
      { id: 2, symbol: "GBPUSD" },
      { id: 3, symbol: "XAUUSD" },
    ]);
  if (config.url.endsWith("/emotion-tags/")) return reply([{ id: 1, label: "Calm" }]);
  if (config.url.endsWith("/setup-tags/")) return reply([{ id: 1, label: "Breakout" }]);
  if (config.url.endsWith("/custom-fields/"))
    return reply([
      { id: 1, section: "setup", label: "Market condition", field_type: "text", options: [] },
    ]);
  return reply([]);
};
function Fixture() {
  const [journals, setJournals] = useState(screen === "empty" ? [] : initialJournals);
  const [active, setActive] = useState(initialJournals[0]);
  const selectJournal = useCallback((journal) => setActive(journal), []);
  const updateJournal = useCallback(async (id, payload) => {
    const next = {
      ...initialJournals.find((journal) => journal.id === id),
      ...payload,
      ...(payload.displayUnit ? { display_unit: payload.displayUnit } : {}),
    };
    setJournals((current) => current.map((journal) => (journal.id === id ? next : journal)));
    setActive(next);
    return next;
  }, []);
  return (
    <BrowserRouter>
      <TooltipProvider>
        <AuthContext.Provider
          value={{
            user: {
              email: "design-qa@example.com",
              first_name: "Alex",
              last_name: "Morgan",
              timezone: "Africa/Tunis",
            },
            loading: false,
            isAuthenticated: true,
            logout: () => {},
            login: async () => {},
            updatePreferences: async (preferences) => {
              if (window.__rejectPreferences) throw new Error("Preference save failed");
              (window.__preferenceWrites ||= []).push(preferences);
            },
          }}
        >
          <JournalContext.Provider
            value={{
              journals,
              workspaces: journals,
              activeJournal: active,
              activeWorkspace: active,
              selectJournal,
              selectWorkspace: selectJournal,
              loading: false,
              analyticsVersion: 0,
              updateJournal,
              createJournal: async () => initialJournals[0],
              deleteJournal: async () => {},
              setSyntheticData: async () => {},
            }}
          >
            <App />
          </JournalContext.Provider>
        </AuthContext.Provider>
      </TooltipProvider>
    </BrowserRouter>
  );
}
createRoot(document.getElementById("root")).render(<Fixture />);

const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const button = (label) =>
  [...document.querySelectorAll("button")].find(
    (node) =>
      node.getClientRects().length &&
      (node.textContent.trim() === label || node.getAttribute("aria-label") === label),
  );
const check = (condition, message) => {
  if (!condition) throw new Error(message);
};
async function inspect() {
  const checks = [];
  try {
    await document.fonts.ready;
    await pause(1500);
    if (screen === "analytics") {
      button("All")?.click();
      await pause(300);
      check(document.querySelector('[data-testid="analytics-kpis"]'), "Analytics metrics missing");
      checks.push("Actual analytics and charts rendered");
    }
    if (screen === "trade") {
      button("New Trade")?.click();
      await pause(300);
      const sheet = document.querySelector('[data-slot="sheet-content"]');
      check(
        sheet && getComputedStyle(sheet).position === "fixed",
        "Trade sheet is not fixed/visible",
      );
      button("Star rating")?.click();
      await pause(100);
      check(
        document.querySelector('input[aria-label="Trade quality stars"]'),
        "Star selector failed",
      );
      document.getElementById("trade-form").requestSubmit();
      await pause(150);
      check(
        document.getElementById("trade-form").textContent.includes("Asset is required"),
        "Required-field validation missing",
      );
      checks.push("New trade opens; rating mode and required validation work");
    }
    if (screen === "trades") {
      check(document.querySelectorAll("tbody tr").length === 20, "Pagination lost rows");
      button("Wins")?.click();
      await pause(350);
      check(
        requests.some((params) => params.status === "WIN"),
        "Status filter did not reach API",
      );
      const table = document.querySelector("table"),
        before = requests.length;
      const input = document.querySelector('input[aria-label="Search assets"]');
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(
        input,
        "GBPUSD",
      );
      input.dispatchEvent(new Event("input", { bubbles: true }));
      await pause(500);
      check(
        requests.length === before + 1 && requests.at(-1).search === "GBPUSD",
        "Search debounce/request regressed",
      );
      check(document.querySelector("table") === table, "Search unmounted the table");
      const units = document.querySelector('[aria-label="Table display units"]');
      units.querySelectorAll("button")[1].click();
      await pause(350);
      check(
        document.querySelector("thead").textContent.includes("PnL ($)"),
        "Display unit switch failed",
      );
      [...document.querySelectorAll("th")].find((node) => node.textContent.includes("PnL")).click();
      await pause(200);
      check(requests.at(-1).ordering.startsWith("-pnl_amount"), "Global table sorting regressed");
      checks.push("20-row table; status, debounced search, stable table, units and sorting work");
    }
    if (screen === "create") {
      button("New Journal")?.click();
      await pause(300);
      check(document.querySelector('[role="dialog"]'), "Journal creation dialog missing");
      checks.push("Journal creation dialog opens");
    }
    if (screen === "settings") {
      button("Account menu")?.dispatchEvent(
        new PointerEvent("pointerdown", { bubbles: true, button: 0, pointerType: "mouse" }),
      );
      await pause(100);
      [...document.querySelectorAll('[role="menuitem"]')]
        .find((node) => node.textContent.trim() === "Settings")
        ?.click();
      await pause(300);
      check(document.querySelector('[role="dialog"]'), "Account settings dialog missing");
      checks.push("Account menu and settings open");
    }
    check(document.querySelector("h1,h2,[data-slot='card-title']"), "Page content missing");
    check(document.documentElement.scrollWidth <= innerWidth + 1, "Unexpected page overflow");
    if (innerWidth < 768 && document.querySelector(".nx-shell")) {
      button("Open navigation")?.click();
      await pause(100);
      check(
        document.querySelector(".nx-shell").dataset.mobileOpen === "true",
        "Mobile navigation failed",
      );
      dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
      await pause(100);
      checks.push("Mobile navigation opens and closes");
    }
    check(!faults.length, `Browser errors: ${faults.join("; ")}`);
    checks.push("No page overflow or runtime errors");
  } catch (error) {
    faults.push(error.message);
  }
  const report = document.createElement("script");
  report.type = "application/json";
  report.id = "nexora-qa-report";
  report.textContent = JSON.stringify({ screen, width: innerWidth, checks, errors: faults });
  document.body.append(report);
}
inspect();
