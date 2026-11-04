import { TZDate } from "@date-fns/tz";

let timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
export function getUserTimezone() { return timezone; }
export function setUserTimezone(value) {
  timezone = value || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}
export function zonedDate(value = Date.now(), zone = timezone) {
  return new TZDate(value, zone);
}
