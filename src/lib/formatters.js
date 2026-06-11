import { format, parseISO } from "date-fns";

export function formatNumber(value, decimals = 2) {
  if (value === null || value === undefined) return "—";
  return Number(value).toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatPercent(value) {
  if (value === null || value === undefined) return "—";
  return `${formatNumber(value, 2)}%`;
}

export function formatR(value) {
  if (value === null || value === undefined) return "—";
  const num = Number(value);
  const prefix = num > 0 ? "+" : "";
  return `${prefix}${formatNumber(num)}R`;
}

export function formatDateTime(value) {
  if (!value) return "—";
  try {
    return format(parseISO(value), "MMM d, yyyy HH:mm");
  } catch {
    return value;
  }
}

export function formatDate(value) {
  if (!value) return "—";
  try {
    return format(parseISO(value), "MMM d, yyyy");
  } catch {
    return value;
  }
}

export function formatTradePeriod(entry, exit) {
  if (!entry) return "—";
  const entryLabel = formatDateTime(entry);
  const exitLabel = exit ? formatDateTime(exit) : "Open";
  return `${entryLabel} → ${exitLabel}`;
}
