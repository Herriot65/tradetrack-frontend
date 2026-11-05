import { getLanguage, translate } from "../i18n/language.js";
import { fr, enUS } from "date-fns/locale";
import { format, parseISO } from "date-fns";
import { zonedDate } from "./timezone";

export function formatNumber(value, decimals = 2) {
  if (value === null || value === undefined) return "—";
  return Number(value).toLocaleString(getLanguage(), {
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
    return format(zonedDate(value), getLanguage() === "fr-FR" ? "d MMM yyyy HH:mm" : "MMM d, yyyy HH:mm", { locale: getLanguage() === "fr-FR" ? fr : enUS });
  } catch {
    return value;
  }
}

export function formatDate(value) {
  if (!value) return "—";
  try {
    return format(parseISO(value), getLanguage() === "fr-FR" ? "d MMM yyyy" : "MMM d, yyyy", { locale: getLanguage() === "fr-FR" ? fr : enUS });
  } catch {
    return value;
  }
}

export function formatTradePeriod(entry, exit) {
  if (!entry) return "—";
  const entryLabel = formatDateTime(entry);
  const exitLabel = exit ? formatDateTime(exit) : translate("Open");
  return `${entryLabel} → ${exitLabel}`;
}
