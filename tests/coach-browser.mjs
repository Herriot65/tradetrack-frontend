// Exercise the real Coach UI with deterministic API responses; no paid AI calls.
import assert from "node:assert/strict";
import { preview } from "vite";
import { mkdir } from "node:fs/promises";
import { pathToFileURL } from "node:url";
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : "playwright");
const server = await preview({ preview: { host: "127.0.0.1", port: 4198, strictPort: true } });
let browser, page;
try {
  browser = await chromium.launch({ headless: true, channel: "chrome" });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await context.addInitScript(() => { localStorage.setItem("access", "test-access"); localStorage.setItem("last_journal_id", "1"); });
  page = await context.newPage();
  page.setDefaultTimeout(10000);
  const errors = []; page.on("pageerror", err => errors.push(err.message));
  let configured = false, tasks = [], chatPayload, chatJournal;
  const journals = [{ id: 1, name: "Live journal", starting_capital: 10000, currency: "USD" }, { id: 2, name: "Backtest journal", starting_capital: 10000, currency: "USD" }];
  await page.route("**/api/**", async route => {
    const request = route.request(), path = new URL(request.url()).pathname, method = request.method();
    const headers = { "access-control-allow-origin": "*", "access-control-allow-headers": "authorization,content-type", "access-control-allow-methods": "GET,POST,PATCH,DELETE,OPTIONS" };
    const reply = (status, json) => route.fulfill({ status, headers, ...(status === 204 ? {} : { json }) });
    if (method === "OPTIONS") return reply(204);
    if (path === "/api/auth/me/") return reply(200, { id: 1, email: "coach@example.test", first_name: "Alex", timezone: "America/New_York" });
    if (path === "/api/journals/") return reply(200, journals);
    if (path.endsWith("/coach/chat/")) {
      if (method === "GET") return reply(200, { configured, persistent_memory: false });
      chatPayload = request.postDataJSON(); chatJournal = path;
      return reply(200, { output: "Your recorded mistakes include entering early. What would help you wait for confirmation?", evidence: [{ id: 7, symbol: "EURUSD" }], screenshots_analyzed: 0 });
    }
    if (path.endsWith("/trades/7/")) return reply(200, { id: 7, asset: { symbol: "EURUSD" }, side: "BUY", pnl_r: "-1", entry_datetime: "2026-11-06T12:00:00Z", notes: "Old note mirror", notes_document: { version: 1, general: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Entered before confirmation", marks: [{ type: "bold" }] }] }] }, sections: [{ id: "after", title: "After entry", content: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Wait for a clear signal next time" }] }] } }] }, screenshots: [] });
    if (path.endsWith("/coach/tasks/")) {
      if (method === "GET") return reply(200, tasks);
      const task = { ...request.postDataJSON(), id: 1, next_run_at: "2099-01-01T18:00:00Z", latest_run: null };
      tasks.push(task); return reply(201, task);
    }
    if (path.endsWith("/coach/tasks/1/")) {
      if (method === "DELETE") { tasks = []; return reply(204); }
      tasks[0] = { ...tasks[0], ...request.postDataJSON() }; return reply(200, tasks[0]);
    }
    if (path.endsWith("/coach/tasks/1/run/")) {
      tasks[0].latest_run = { id: 1, status: "completed", output: "What is your session risk limit?", created_at: new Date().toISOString() };
      return reply(200, tasks[0].latest_run);
    }
    if (path.endsWith("/coach/tasks/1/history/")) return reply(200, tasks[0].latest_run ? [tasks[0].latest_run] : []);
    return reply(200, []);
  });
  await page.goto("http://127.0.0.1:4198/coach");
  await page.getByRole("heading", { name: "What would you like to work on?" }).waitFor();
  await page.getByText("Connect AI to bring your coach to life").waitFor();
  assert.equal(await page.getByRole("button", { name: "Send message" }).isDisabled(), true);
  configured = true; await page.reload();
  await page.getByText("AI configured", { exact: false }).waitFor();
  await page.getByRole("button", { name: "Understand my losses", exact: false }).click();
  assert.match(await page.getByLabel("Ask your coach", { exact: true }).inputValue(), /losing trades/);
  await page.getByRole("button", { name: "Adjust output" }).click();
  await page.getByLabel("Response length").selectOption("detailed");
  await page.getByRole("button", { name: "Full report", exact: true }).click();
  await page.getByLabel("Current goal", { exact: false }).fill("Wait for confirmation");
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await page.getByRole("button", { name: "Send message" }).click();
  await page.getByText("Your recorded mistakes include entering early.", { exact: false }).waitFor();
  assert.equal(chatPayload.configuration.detail, "detailed");
  assert.equal(chatPayload.configuration.sections.length, 5);
  assert.equal(chatPayload.configuration.goal, "Wait for confirmation");
  assert.equal(chatPayload.configuration.timezone, "America/New_York");
  assert.match(chatJournal, /journals\/1/);
  await page.getByText("Supporting trades (1)").click();
  await page.getByRole("button", { name: "#7 · EURUSD", exact: true }).click();
  await page.getByText("Entered before confirmation", { exact: true }).waitFor();
  await page.getByText("Wait for a clear signal next time", { exact: true }).waitFor();
  assert.equal(await page.getByText("Old note mirror", { exact: true }).count(), 0);
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await page.getByRole("button", { name: "Schedule this", exact: false }).click();
  await page.getByLabel("Task name").fill("Morning intention");
  await page.getByLabel("What should the coach do?").fill("Ask me three questions to prepare for my session.");
  await page.getByLabel("Repeat", { exact: false }).selectOption("daily");
  await page.getByLabel("Start date").fill("2099-01-01");
  await page.getByRole("button", { name: "Save task", exact: true }).click();
  await page.getByText("Morning intention", { exact: true }).waitFor().catch(async error => { console.error(await page.locator("body").innerText()); throw error; });
  assert.equal(tasks[0].frequency, "daily");
  assert.equal(tasks[0].timezone, "America/New_York");
  assert.match(tasks[0].instructions, /three questions/);
  await page.getByRole("button", { name: "Pause Morning intention", exact: true }).click();
  await page.getByRole("button", { name: "Resume Morning intention", exact: true }).waitFor();
  assert.equal(tasks[0].enabled, false);
  await page.getByRole("button", { name: "Run now", exact: true }).click();
  await page.getByText("Last run: completed", { exact: false }).waitFor();
  await page.getByRole("button", { name: "View history", exact: false }).click();
  await page.getByText("What is your session risk limit?", { exact: true }).waitFor();
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await page.getByRole("button", { name: "Edit Morning intention", exact: true }).click();
  await page.getByLabel("Task name").fill("Pre-session questions");
  await page.getByRole("button", { name: "Save task", exact: true }).click();
  await page.getByText("Pre-session questions", { exact: true }).waitFor();
  await page.getByRole("button", { name: "Delete Pre-session questions", exact: true }).click();
  await page.getByRole("button", { name: "Delete task", exact: true }).click();
  await page.getByRole("heading", { name: "Make coaching a habit" }).waitFor();
  await page.getByRole("button", { name: "Conversation", exact: true }).click();
  await mkdir("artifacts/coach", { recursive: true });
  await page.screenshot({ path: "artifacts/coach/desktop.png", fullPage: true });
  // The current navigation stays available; only the navbar switches accounts.
  const nav = page.getByRole("navigation", { name: "Main sections", exact: true });
  for (const name of ["Overview", "Journal", "Analytics", "AI Coach"]) assert.equal(await nav.getByRole("link", { name, exact: true }).count(), 1);
  assert.equal(await page.locator("#app-navigation").getByRole("button", { name: "Switch journal", exact: true }).count(), 0);
  assert.equal(await nav.getByRole("link", { name: "AI Coach", exact: true }).getAttribute("aria-current"), "page");
  // Switching journals clears the conversation and stays on the coach page.
  await page.getByRole("button", { name: "Switch journal", exact: true }).click();
  await page.getByRole("menuitem", { name: /Backtest journal/ }).click();
  await page.getByRole("heading", { name: "What would you like to work on?" }).waitFor();
  assert.match(page.url(), /\/coach$/);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForFunction(() => document.documentElement.scrollWidth <= innerWidth);
  await page.waitForFunction(() => document.getElementById("app-navigation").inert);
  await page.screenshot({ path: "artifacts/coach/mobile.png", fullPage: true, animations: "disabled" });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  assert.deepEqual(errors, []);
  console.log("PASS: setup state, chat, output configuration, evidence, free-form scheduling, pause, manual run, history, edit, delete, journal isolation, mobile layout");
} catch (error) {
  console.error(await page?.locator("body").innerText());
  await page?.screenshot({ path: "/tmp/coach-failure.png", fullPage: true });
  throw error;
} finally { await browser?.close(); await server.close(); }
