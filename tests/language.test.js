import test from "node:test";
import assert from "node:assert/strict";
import { getLanguage, setLanguage, translate, subscribeLanguage, LANGUAGE_STORAGE_KEY } from "../src/i18n/language.js";
import { formatValue, formatDateLabel, monthLabel } from "../src/lib/analytics.js";

test("language switching validates, persists, interpolates and formats without changing data", () => {
  const saved = new Map();
  globalThis.localStorage = { getItem: key => saved.get(key), setItem: (key, value) => saved.set(key, value) };
  let updates = 0;
  const unsubscribe = subscribeLanguage(() => updates++);
  try {
    setLanguage("en-US");
    assert.equal(translate("Dashboard"), "Dashboard");
    assert.equal(formatValue(1.25), "+1.25R");
    setLanguage("fr-FR");
    assert.equal(getLanguage(), "fr-FR");
    assert.equal(saved.get(LANGUAGE_STORAGE_KEY), "fr-FR");
    assert.equal(translate("Dashboard"), "Tableau de bord");
    assert.equal(translate("Welcome, {name}!", {name: "Alice"}), "Bienvenue, Alice !");
    assert.equal(translate("EURUSD"), "EURUSD");
    assert.equal(translate("Custom journal name"), "Custom journal name");
    assert.equal(formatValue(1.25), "+1,25R");
    assert.equal(monthLabel(2026, 1), "février 2026");
    assert.match(formatDateLabel(new Date(2026, 1, 5)), /5 févr\. 2026/);
    setLanguage("fr-FR");
    setLanguage("invalid");
    assert.equal(updates, 1);
    assert.equal(getLanguage(), "fr-FR");
    // Privacy modes may prohibit storage; the in-memory setting still works.
    globalThis.localStorage.setItem = () => { throw new Error("Storage blocked"); };
    setLanguage("en-US");
    assert.equal(translate("Dashboard"), "Dashboard");
    assert.equal(formatValue(1.25), "+1.25R");
  } finally {
    unsubscribe();
    setLanguage("en-US");
    delete globalThis.localStorage;
  }
});
