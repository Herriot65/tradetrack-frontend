import { useSyncExternalStore } from "react";

const STORAGE_KEY = "nexora-theme";
const media = window.matchMedia("(prefers-color-scheme: dark)");
const listeners = new Set();
const normalize = (value) => ["light", "dark", "system"].includes(value) ? value : "system";
function readPreference() {
  try {
    return normalize(localStorage.getItem(STORAGE_KEY));
  } catch {
    return "system";
  }
}
let preference = readPreference();

function applyTheme() {
  const resolved = preference === "system" ? (media.matches ? "dark" : "light") : preference;
  document.documentElement.classList.toggle("dark", resolved === "dark");
  document.documentElement.classList.toggle("light", resolved === "light");
  document.documentElement.style.colorScheme = resolved;
}
function notify() {
  applyTheme();
  listeners.forEach((listener) => listener());
}
export function setTheme(value) {
  preference = normalize(value);
  try {
    localStorage.setItem(STORAGE_KEY, preference);
  } catch {
    // Keep the selected theme usable when browser storage is unavailable.
  }
  notify();
}
function onStorage(event) {
  if (event.storageArea === localStorage && (event.key === STORAGE_KEY || event.key === null)) {
    preference = readPreference();
    notify();
  }
}
function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
export function useTheme() {
  return [useSyncExternalStore(subscribe, () => preference), setTheme];
}

applyTheme();
media.addEventListener("change", applyTheme);
window.addEventListener("storage", onStorage);
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    media.removeEventListener("change", applyTheme);
    window.removeEventListener("storage", onStorage);
  });
}
