import { TZDate } from "@date-fns/tz";
// Form values are wall-clock strings in the explicitly selected timezone.
export function parseTradeDateTime(value) {
  if (!value || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?$/.test(value)) return null;
  const normalized = value.length === 16 ? `${value}:00` : value;
  const date = new Date(`${normalized}Z`);
  if (!Number.isFinite(date.getTime())) return null;
  // Reject rolled-over dates such as February 30 or hour 24.
  return date.toISOString().slice(0,19) === normalized.slice(0,19) ? date : null;
}

export function toTradeDateTimeInput(iso, timezone = "UTC") {
  if (!iso) return "";
  const date = new TZDate(iso, timezone);
  return Number.isFinite(date.getTime()) ? date.toISOString().slice(0,23) : "";
}

export function fromTradeDateTimeInput(value, timezone = "UTC") {
  const parsed = parseTradeDateTime(value);
  if (!parsed) return null;
  const date = new TZDate(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate(), parsed.getUTCHours(), parsed.getUTCMinutes(), parsed.getUTCSeconds(), parsed.getUTCMilliseconds(), timezone);
  // Reject nonexistent local times during a daylight-saving forward jump.
  if (toTradeDateTimeInput(date.toISOString(), timezone).slice(0,19) !== parsed.toISOString().slice(0,19)) return null;
  return new Date(date.getTime()).toISOString();
}

export function changeTradeDate(value, date) {
  return `${date.toISOString().slice(0,10)}T${value?.split("T")[1] || "00:00:00"}`;
}

export function changeTradeTime(value, kind, next) {
  const parts=(value?.split("T")[1] || "00:00:00").split(":");
  parts[kind === "hour" ? 0 : 1] = next;
  return `${value?.split("T")[0] || new Date().toISOString().slice(0,10)}T${parts.join(":")}`;
}
