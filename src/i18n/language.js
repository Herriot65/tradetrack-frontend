import french from "./fr.js";

export const LANGUAGE_STORAGE_KEY = "nexora_language";
export const LANGUAGES = [
  { value: "en-US", code: "US", label: "English (US)" },
  { value: "fr-FR", code: "FR", label: "Français (FR)" },
];

function supported(value) {
  return LANGUAGES.some((option) => option.value === value);
}
function readLanguage() {
  try {
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return supported(saved) ? saved : "en-US";
  } catch {
    return "en-US";
  }
}
let language = readLanguage();
const listeners = new Set();
export function getLanguage() {
  return language;
}
export function subscribeLanguage(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
function applyLanguage(value) {
  if (!supported(value)) return;
  const changed = language !== value;
  language = value;
  if (typeof document !== "undefined") document.documentElement.lang = language;
  if (changed) listeners.forEach((listener) => listener());
}
export function setLanguage(value) {
  if (!supported(value)) return;
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, value);
  } catch {
    // The selection still works when browser storage is unavailable.
  }
  applyLanguage(value);
}
export function translate(source, values = {}) {
  if (typeof source !== "string") return source;
  const message = language === "fr-FR" ? (french[source] ?? source) : source;
  return message.replace(/\{(\w+)\}/g, (match, key) =>
    Object.hasOwn(values, key) ? String(values[key]) : match,
  );
}
if (typeof window !== "undefined") {
  applyLanguage(language);
  window.addEventListener("storage", (event) => {
    if (event.key === LANGUAGE_STORAGE_KEY || event.key === null) {
      applyLanguage(supported(event.newValue) ? event.newValue : "en-US");
    }
  });
}
