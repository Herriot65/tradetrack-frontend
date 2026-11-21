import { useSyncExternalStore } from "react";

const STORAGE_KEY = "nexora-design";
const listeners = new Set();
const normalize = value => ["classic", "3d", "graphite"].includes(value) ? value : "3d";
function readDesign() {
  try { return normalize(localStorage.getItem(STORAGE_KEY)); }
  catch { return "3d"; }
}
let design = readDesign();
function notify() {
  document.documentElement.dataset.design = design;
  listeners.forEach(listener => listener());
}
export function setDesign(value) {
  design = normalize(value);
  try { localStorage.setItem(STORAGE_KEY, design); } catch { /* Keep the in-memory choice. */ }
  notify();
}
function onStorage(event) {
  if (event.key === STORAGE_KEY || event.key === null) {
    design = readDesign();
    notify();
  }
}
function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
export function useDesign() {
  return [useSyncExternalStore(subscribe, () => design), setDesign];
}
notify();
window.addEventListener("storage", onStorage);
if (import.meta.hot) {
  import.meta.hot.dispose(() => window.removeEventListener("storage", onStorage));
}
