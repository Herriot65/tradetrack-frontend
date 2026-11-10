import { getUserTimezone } from "@/lib/timezone";

export const SECTION_OPTIONS = [["statistics", "Statistics"], ["strengths", "What went well"], ["mistakes", "Mistakes & patterns"], ["goals", "Goal progress"], ["actions", "Next actions"]];
export const fieldClass = "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40";
export const localDate = (timezone = getUserTimezone()) => {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const value = type => parts.find(part => part.type === type).value;
  return `${value("year")}-${value("month")}-${value("day")}`;
};
export const defaultConfiguration = (timezone = getUserTimezone()) => ({ period: "week", detail: "brief", sections: [], goal: "", instrument: "", screenshots: false, timezone });

export const apiError = (error) => {
  const data = error?.response?.data;
  if (!data) return error.message || "Something went wrong. Please try again.";
  if (typeof data.detail === "string") return data.detail;
  return Object.entries(data).map(([key, value]) => `${key}: ${typeof value === "string" ? value : JSON.stringify(value)}`).join(" · ");
};

