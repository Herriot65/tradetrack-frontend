import assert from "node:assert/strict";
import { preview } from "vite";
import { mkdir } from "node:fs/promises";
import { pathToFileURL } from "node:url";
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : "playwright");
const server = await preview({ preview: { host: "127.0.0.1", port: 4207, strictPort: true } });
let browser;
try {
  browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : { channel: "chrome" }) });
  const context = await browser.newContext({ viewport: { width: 1280, height: 1000 } });
  await context.addInitScript(() => localStorage.setItem("last_journal_id", "1"));
  const page = await context.newPage();
  const errors = [], writes = [];
  page.on("pageerror", error => errors.push(error.message));
  let failSave = false;
  let state = { provider: "server", server_provider: "groq", server_model: "qwen/qwen3.8-27b", server_configured: false, providers: [
    { id: "openai", label: "OpenAI", model: "gpt-4.1-mini", default_model: "gpt-4.1-mini", has_key: false },
    { id: "gemini", label: "Gemini", model: "gemini-2.5-flash", default_model: "gemini-2.5-flash", has_key: false },
    { id: "groq", label: "Groq", model: "qwen/qwen3.8-27b", default_model: "qwen/qwen3.8-27b", has_key: false },
  ] };
  await page.route("**/api/**", async route => {
    const request = route.request(), path = new URL(request.url()).pathname, method = request.method();
    const headers = { "access-control-allow-origin": "*", "access-control-allow-headers": "authorization,content-type", "access-control-allow-methods": "GET,POST,PATCH,OPTIONS" };
    const reply = (status, json) => route.fulfill({ status, headers, json });
    if (method === "OPTIONS") return route.fulfill({ status: 204, headers });
    if (path === "/api/auth/csrf/") return reply(200, { csrfToken: "csrf" });
    if (path === "/api/auth/token/refresh/") return reply(200, { access: "test-access" });
    if (path === "/api/auth/me/") return reply(200, { id: 1, email: "coach@example.test", first_name: "Alex", timezone: "UTC" });
    if (path === "/api/auth/coach-settings/") {
      if (method === "PATCH") {
        const payload = request.postDataJSON(); writes.push(payload);
        if (failSave) { failSave = false; return reply(400, { api_key: [`invalid ${payload.api_key}`] }); }
        state.provider = payload.provider;
        const selected = state.providers.find(item => item.id === payload.provider);
        if (selected) {
          selected.model = payload.model || selected.default_model;
          if (payload.api_key) selected.has_key = true;
          if (payload.remove_key) selected.has_key = false;
        }
      }
      return reply(200, state);
    }
    if (path === "/api/journals/") return reply(200, [{ id: 1, name: "Test journal", currency: "USD", starting_capital: 10000 }]);
    if (path.endsWith("/coach/chat/")) {
      const selected = state.providers.find(item => item.id === state.provider);
      return reply(200, method === "GET" ? { configured: selected?.has_key || false, model: selected?.model, provider: state.provider } : { output: "Prepare your risk plan.", evidence: [] });
    }
    return reply(200, []);
  });
  const open = async () => {
    await page.getByRole("button", { name: "Account menu", exact: true }).click();
    await page.getByRole("menuitem", { name: "Settings", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "Account settings", exact: true });
    await dialog.getByLabel("AI provider", { exact: true }).waitFor();
    return dialog;
  };
  const choose = async (dialog, name) => {
    await dialog.getByLabel("AI provider", { exact: true }).click();
    await page.getByRole("option", { name, exact: true }).click();
  };
  await page.goto("http://127.0.0.1:4207/coach");
  await page.getByText("Your coach is being set up").waitFor();
  let dialog = await open();
  await choose(dialog, "Groq");
  await dialog.getByLabel("AI model", { exact: true }).fill("custom/groq-model");
  await dialog.getByLabel("API key", { exact: true }).fill("fake-groq-key");
  assert.equal(await dialog.getByLabel("API key", { exact: true }).getAttribute("type"), "password");
  await dialog.getByRole("button", { name: "Save AI settings", exact: true }).click();
  await dialog.getByText("AI Coach settings saved.", { exact: true }).waitFor();
  assert.deepEqual(writes.at(-1), { provider: "groq", model: "custom/groq-model", api_key: "fake-groq-key" });
  assert.equal(await dialog.getByLabel("API key", { exact: true }).inputValue(), "");
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  await page.getByText("Coach ready", { exact: false }).waitFor();
  dialog = await open();
  await choose(dialog, "Gemini");
  assert.equal(await dialog.getByLabel("AI model", { exact: true }).inputValue(), "gemini-2.5-flash");
  await dialog.getByLabel("API key", { exact: true }).fill("fake-gemini-key");
  await dialog.getByRole("button", { name: "Save AI settings", exact: true }).click();
  await dialog.getByText("AI Coach settings saved.", { exact: true }).waitFor();
  await choose(dialog, "Groq");
  assert.equal(await dialog.getByLabel("AI model", { exact: true }).inputValue(), "custom/groq-model");
  await dialog.getByRole("button", { name: "Save AI settings", exact: true }).click();
  await dialog.getByText("AI Coach settings saved.", { exact: true }).waitFor();
  assert.equal(Object.hasOwn(writes.at(-1), "api_key"), false);
  failSave = true;
  await dialog.getByLabel("API key", { exact: true }).fill("fake-retry-secret");
  await dialog.getByRole("button", { name: "Save AI settings", exact: true }).click();
  await dialog.getByRole("alert").filter({ hasText: "Enter a valid API key without spaces." }).waitFor();
  assert.equal(await dialog.getByLabel("API key", { exact: true }).inputValue(), "fake-retry-secret");
  assert.doesNotMatch(await dialog.innerText(), /fake-retry-secret/);
  await dialog.getByLabel("API key", { exact: true }).fill("");
  await mkdir("artifacts/coach-settings", { recursive: true });
  for (const width of [1280, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    await dialog.getByLabel("AI model", { exact: true }).scrollIntoViewIfNeeded();
    await page.screenshot({ path: `artifacts/coach-settings/settings-${width}.png` });
    await page.waitForFunction(() => document.documentElement.scrollWidth <= innerWidth + 1, null, { timeout: 3000 });
    await page.screenshot({ path: `artifacts/coach-settings/settings-${width}.png` });
  }
  await dialog.getByRole("button", { name: "Remove saved key", exact: true }).click();
  await dialog.getByText("Saved API key removed.", { exact: true }).waitFor();
  assert.equal(state.providers.find(item => item.id === "groq").has_key, false);
  await choose(dialog, "Use server default");
  assert.equal(await dialog.getByLabel("AI model", { exact: true }).isDisabled(), true);
  assert.equal(await dialog.getByLabel("API key", { exact: true }).count(), 0);
  await dialog.getByRole("button", { name: "Save AI settings", exact: true }).click();
  await dialog.getByText("AI Coach settings saved.", { exact: true }).waitFor();
  assert.deepEqual(writes.at(-1), { provider: "server" });
  assert.doesNotMatch(await page.evaluate(() => JSON.stringify({ ...localStorage, ...sessionStorage })), /fake-(groq-key|gemini-key|retry-secret)/);
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  await page.reload();
  dialog = await open();
  await choose(dialog, "Gemini");
  await dialog.getByRole("button", { name: "Remove saved key", exact: true }).waitFor();
  assert.equal(await dialog.getByLabel("API key", { exact: true }).inputValue(), "");
  assert.deepEqual(errors, []);
  console.log("PASS: provider/model/key settings, switching, reload, safe errors, removal, server fallback, coach status refresh, and 320/390/1280px layouts");
} finally {
  await browser?.close();
  await new Promise(resolve => server.httpServer.close(resolve));
}
