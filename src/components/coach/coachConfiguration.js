import { getUserTimezone } from "@/lib/timezone";

export const SECTION_OPTIONS = [["statistics", "Statistics"], ["strengths", "What went well"], ["mistakes", "Mistakes & patterns"], ["goals", "Goal progress"], ["actions", "Next actions"]];
export const PERIODS = [["day", "Today"], ["week", "Last 7 days"], ["month", "Last 30 days"], ["custom", "Custom dates"]];
export const TRADE_SCOPES = [["all", "All trades"], ["closed", "Closed trades"], ["LOSS", "Losing trades"], ["WIN", "Winning trades"], ["BE", "Break-even trades"], ["OPEN", "Open trades"]];
export const fieldClass = "w-full min-w-0 rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40";
export const localDate = (timezone = getUserTimezone(), date = new Date()) => {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
  const value = type => parts.find(part => part.type === type).value;
  return `${value("year")}-${value("month")}-${value("day")}`;
};
export const defaultConfiguration = (timezone = getUserTimezone()) => ({ period: "week", detail: "brief", sections: [], goal: "", instrument: "", trade_status: "all", screenshots: false, timezone });

export const COACH_STARTERS = [
  { id: "review", title: "Review my week", description: "Keep the good habits. Find one thing to improve.", prompt: "Review my last 7 days of trading. Use my recorded trades and journal notes. Give me what went well, one supported pattern to improve, and one practical next action.", configuration: { period: "week", trade_status: "all", sections: ["strengths", "mistakes", "actions"] } },
  { id: "prepare", title: "Prepare for my session", description: "Check your plan, risk limits, and mindset.", prompt: "Help me prepare for my next trading session. Ask me three focused questions about my plan, risk limits, and mindset. Don't assume you know my trading rules or live market conditions.", configuration: { period: "day", trade_status: "all", sections: [] } },
  { id: "losses", title: "Understand my losses", description: "Separate a losing outcome from a poor decision.", prompt: "Examine my losing trades in the selected period. Use my journal notes and tags to identify supported patterns. Distinguish a losing outcome from poor process, and suggest one improvement.", configuration: { trade_status: "LOSS", sections: ["mistakes", "actions"] } },
  { id: "risk", title: "Check my risk discipline", description: "Look for changes in risk and position management.", prompt: "Examine my recorded risk per trade and decision notes for the selected period. Highlight changes in risk-taking and any documented rule breaks. Ask for my risk rules if they aren't recorded. Do not invent a risk limit or infer discipline from profit alone.", configuration: { trade_status: "all", sections: [] } },
  { id: "reflect", title: "Reflect on my trading", description: "Talk through the decisions behind your results.", prompt: "Help me reflect on my recent trading. Read my journal notes and ask me one useful question to explore my decision-making.", configuration: { sections: [], trade_status: "all" } },
  { id: "goal", title: "Check my goal progress", description: "See whether your actions match your commitment.", prompt: "Check my progress toward the goal in my settings using evidence from my trades and journal. If I haven't supplied a goal, help me choose one habit I can control. Don't treat a profitable outcome as proof that I followed my process.", configuration: { sections: ["goals", "actions"], trade_status: "all" } },
];
export const TASK_TEMPLATES = [
  { id: "prepare", title: "Session preparation", instructions: COACH_STARTERS[1].prompt, frequency: "daily", local_time: "08:30", configuration: { period: "day", sections: [] } },
  { id: "reflect", title: "End-of-day reflection", instructions: "Help me reflect on today's trading. Use my journal if available. Ask three short questions about what I followed, what I learned, and what I will do differently next time.", frequency: "daily", local_time: "18:00", configuration: { period: "day", sections: [] } },
  { id: "discipline", title: "Weekly discipline check", instructions: COACH_STARTERS[3].prompt, frequency: "weekly", local_time: "18:00", configuration: { period: "week", sections: ["mistakes", "actions"] } },
  { id: "report", title: "Monthly full report", instructions: "Create a full report for the last 30 days using the existing statistics and supporting journal evidence. Separate outcomes from decision quality and finish with a short plan for the next period.", frequency: "monthly", local_time: "18:00", configuration: { period: "month", detail: "detailed", sections: SECTION_OPTIONS.map(([key]) => key) } },
];

export function scopeSummary(value) {
  if (value.trade_id) return `Trade #${value.trade_id}`;
  const period = value.period === "custom" ? `${value.start_date || "Start"} – ${value.end_date || "End"}` : PERIODS.find(([key]) => key === value.period)?.[1];
  return [period, TRADE_SCOPES.find(([key]) => key === (value.trade_status || "all"))?.[1], value.instrument].filter(Boolean).join(" · ");
}
export function configurationError(value) {
  if (value.period !== "custom") return "";
  if (!value.start_date || !value.end_date) return "Choose both dates for your analysis.";
  if (value.end_date < value.start_date) return "The end date must be on or after the start date.";
  if ((Date.parse(value.end_date) - Date.parse(value.start_date)) / 86400000 > 366) return "Choose a date range of one year or less.";
  return "";
}
export function scheduleSummary(task) {
  const date = new Date(`${task.start_date}T12:00:00Z`);
  if (!Number.isFinite(+date)) return "Choose a start date to preview your schedule.";
  const weekday = date.toLocaleDateString(undefined, { weekday: "long", timeZone: "UTC" });
  const day = date.getUTCDate();
  const timing = task.frequency === "once" ? `Once on ${task.start_date}` : task.frequency === "daily" ? "Every day, including weekends" : task.frequency === "weekly" ? `Every ${weekday}` : `Monthly on day ${day}${day > 28 ? " (or the last day of a shorter month)" : ""}`;
  return `${timing} at ${(task.local_time || "18:00").slice(0, 5)} · ${task.timezone}`;
}
export const apiError = (error) => {
  if (error?.response?.status === 429) return "You've reached the request limit for now. Please try again later.";
  if (error?.response?.status === 503) return "Your coach is temporarily unavailable. Your question is still here—please try again shortly.";
  if (error?.code === "ECONNABORTED") return "This is taking longer than expected. Your question is still here; try a narrower question or a shorter period.";
  const data = error?.response?.data;
  if (!data) return "We couldn't connect. Check your connection and try again.";
  if (typeof data.detail === "string") return data.detail;
  function messages(value) { return typeof value === "string" ? [value] : Array.isArray(value) ? value.flatMap(messages) : value && typeof value === "object" ? Object.values(value).flatMap(messages) : []; }
  return messages(data).join(" ") || "Something went wrong. Please try again.";
};
