import { createRoot } from "react-dom/client";
import AnalyticsTab from "../src/components/analytics/AnalyticsTab";
import { JournalContext } from "../src/journals/JournalContext";
import api from "../src/api/axios";
import "../src/index.css";
const values = [2, -1, 0, 3, -2, -1, 0, 4];
let rows = values.map((r, i) => ({
  id: i + 1,
  pnl_r: r,
  entry_datetime: `2025-01-${String(i + 1).padStart(2, "0")}T10:00:00`,
  asset: i === 0 ? "GBPJPY" : i % 2 ? "EURUSD" : "USDJPY",
  risk_percent: 2,
}));
rows.push({
  id: 9,
  pnl_r: 7,
  entry_datetime: "2026-09-04T12:00:00",
  asset: "EURUSD",
  risk_percent: 2,
});
// A larger deterministic dataset for design screenshots; unrelated to the saved sample journal.
if (new URLSearchParams(location.search).has("dense")) {
  let seed = 17;
  rows = Array.from({ length: 126 }, (_, i) => {
    seed = (seed * 16807) % 2147483647;
    const random = seed / 2147483647;
    const date = new Date(
      Date.UTC(2025, 0, 2 + i * 2, [2, 8, 9, 10, 13, 14, 15, 16][i % 8], i % 60),
    );
    const result =
      random < 0.08
        ? 0
        : random < 0.48
          ? -Math.round((0.4 + random * 2) * 100) / 100
          : Math.round((0.3 + (random - 0.48) * 7) * 100) / 100;
    return {
      id: i + 1,
      pnl_r: result,
      entry_datetime: date.toISOString(),
      asset: ["EURUSD", "GBPUSD", "USDJPY", "XAUUSD", "NAS100"][i % 5],
      risk_percent: 1,
    };
  });
}
api.defaults.adapter = async (config) => ({
  data: { results: rows, count: rows.length },
  status: 200,
  statusText: "OK",
  headers: {},
  config,
});
const journal = {
  id: 1,
  name: "Test journal",
  startingCapital: 50,
  currency: "USD",
  breakEvenMethod: "ratio",
  breakEvenValue: 0,
};
createRoot(document.getElementById("root")).render(
  <JournalContext.Provider value={{ activeWorkspace: journal, analyticsVersion: 0 }}>
    <main style={{ maxWidth: 1280, margin: "0 auto", padding: 16 }}>
      <AnalyticsTab journal={journal} syntheticEnabled={true} onToggleSynthetic={() => {}} />
    </main>
  </JournalContext.Provider>,
);
