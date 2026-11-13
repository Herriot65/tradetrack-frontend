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
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, hasTouch: true });
  await context.addInitScript(() => { localStorage.setItem("access", "test-access"); localStorage.setItem("last_journal_id", "1"); });
  page = await context.newPage();
  page.setDefaultTimeout(10000);
  const errors = []; page.on("pageerror", err => { errors.push(err.message); console.error("PAGE ERROR:", err.message); });
  let configured = false, tasks = [], chatPayload, chatJournal, failNextChat = false, holdChat = false, releaseChat, heldReady, chatRequests = 0;
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
      chatRequests++;
      chatPayload = request.postDataJSON(); chatJournal = path;
      if (failNextChat) { failNextChat = false; return reply(503, {detail:"Provider unavailable"}); }
      if (holdChat) { await new Promise(resolve => { releaseChat = resolve; heldReady?.(); }); holdChat = false; }
      return reply(200, { output: "Your recorded mistakes include entering early. What would help you wait for confirmation?", evidence: [{ id: 7, symbol: "EURUSD" }], screenshots_analyzed: 0 });
    }
    if (path.endsWith("/trades/")) return reply(200, {count:1, next:null, results:[{id:7,asset:{symbol:"EURUSD"},side:"BUY",pnl_r:"-1",entry_datetime:"2026-11-06T12:00:00Z"}]});
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
  await page.getByText("Your coach is being set up").waitFor();
  assert.equal(await page.getByRole("button", { name: "Send message" }).isDisabled(), true);
  configured = true; await page.reload();
  await page.getByText("Coach ready", { exact: false }).waitFor();
  await page.getByRole("button", { name: "Understand my losses", exact: false }).click();
  assert.match(await page.getByLabel("Ask your coach", { exact: true }).inputValue(), /losing trades/);
  await page.getByRole("button", { name: "Adjust output" }).click();
  await page.getByLabel("Response length").selectOption("detailed");
  await page.getByRole("button", { name: "Full report", exact: true }).click();
  await page.getByLabel("Current goal", { exact: false }).fill("Wait for confirmation");
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await page.getByRole("button", { name: "Send message" }).click();
  await page.getByText("Your recorded mistakes include entering early.", { exact: false }).waitFor();
  assert.equal(chatPayload.configuration.trade_status, "LOSS");
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
  // Conversation actions and a real trade picker, without knowing a trade ID.
  await page.getByRole("button", {name:"Explain simply",exact:true}).click();
  assert.match(await page.getByLabel("Ask your coach",{exact:true}).inputValue(), /simpler terms/);
  await page.getByLabel("Ask your coach",{exact:true}).fill("");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button",{name:"Save chat",exact:true}).click();
  assert.match((await downloadPromise).suggestedFilename(), /coaching-conversation.*\.txt$/);
  await page.getByRole("button",{name:"Choose a trade",exact:true}).click();
  await page.getByLabel("Search trades").fill("EURUSD");
  await page.getByRole("button",{name:/EURUSD · BUY/}).click();
  await page.getByRole("button",{name:"Clear selected trade",exact:true}).waitFor();
  await page.getByRole("button",{name:"Send message",exact:true}).click();
  await page.getByLabel("Ask your coach",{exact:true}).waitFor();
  await page.waitForFunction(() => document.getElementById("coach-prompt").value === "" && !document.getElementById("coach-prompt").disabled);
  assert.equal(chatPayload.configuration.trade_id,7);
  assert.equal(chatPayload.configuration.start_date,"2026-11-06");
  assert.equal(chatPayload.configuration.trade_status,"all");
  await page.getByRole("button",{name:"Clear selected trade",exact:true}).click();
  assert.equal(await page.getByRole("combobox",{name:"Trades to include",exact:true}).inputValue(),"LOSS");
  // Failures preserve the question and provide an explicit retry.
  failNextChat = true;
  await page.getByLabel("Ask your coach",{exact:true}).fill("Help me follow my risk limit.");
  await page.getByRole("button",{name:"Send message",exact:true}).click();
  await page.getByText("Your coach is temporarily unavailable.",{exact:false}).waitFor();
  assert.equal(await page.getByLabel("Ask your coach",{exact:true}).inputValue(),"Help me follow my risk limit.");
  await page.getByRole("button",{name:"Try again",exact:true}).click();
  await page.waitForFunction(() => document.getElementById("coach-prompt").value === "" && !document.getElementById("coach-prompt").disabled);
  // A slow response can be abandoned without losing the draft.
  holdChat = true;
  const requestHeld = new Promise(resolve => { heldReady = resolve; });
  await page.getByLabel("Ask your coach",{exact:true}).fill("Help me stay patient today.");
  await page.getByRole("button",{name:"Send message",exact:true}).click();
  await requestHeld;
  const requestsBeforeStop = chatRequests;
  await page.getByRole("button",{name:"Stop waiting",exact:true}).click();
  await page.getByText("Stopped waiting.",{exact:false}).waitFor();
  releaseChat?.();
  await page.waitForFunction(() => !document.getElementById("coach-prompt").disabled);
  assert.equal(await page.getByLabel("Ask your coach",{exact:true}).inputValue(),"Help me stay patient today.");
  assert.equal(chatRequests, requestsBeforeStop);
  // A new chat asks before clearing the current conversation.
  await page.getByRole("button",{name:"New chat",exact:true}).click();
  await page.getByRole("heading",{name:"Start a fresh conversation?",exact:true}).waitFor();
  await page.getByRole("button",{name:"Start new chat",exact:true}).click();
  await page.getByRole("heading",{name:"What would you like to work on?",exact:true}).waitFor();
  await page.locator("aside").getByRole("button", { name: "Schedule this", exact: false }).click();
  await page.getByLabel("Start with a template", {exact:true}).selectOption("prepare");
  await page.getByText("Edit task details",{exact:true}).click();
  assert.equal(await page.getByLabel("Task name").inputValue(), "Session preparation");
  assert.match(await page.getByLabel("What should the coach do?").inputValue(), /risk limits/);
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
  await page.getByText("What is your session risk limit?", { exact: true }).waitFor();
  await page.getByRole("button", { name: "Close", exact: true }).click();
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
  for (const width of [320, 390, 430]) {
    await page.setViewportSize({ width, height: 844 });
    await page.waitForFunction(() => document.documentElement.scrollWidth <= innerWidth);
    assert.equal(await page.locator(".coach-messages").evaluate(node => getComputedStyle(node).overflowY), "visible");
    const starter = page.getByRole("button", {name:"Check my goal progress",exact:false});
    await starter.scrollIntoViewIfNeeded();
    const box = await starter.boundingBox();
    assert.ok(box.height >= 44, "Starter has a comfortable touch target");
    const mobileFilters = page.locator(".coach-mobile-scope");
    await mobileFilters.locator("summary").click();
    await mobileFilters.getByRole("combobox",{name:"Trades to include",exact:true}).selectOption("WIN");
    await mobileFilters.locator("summary").click();
    await page.getByLabel("Ask your coach",{exact:true}).fill("First line");
    const beforeEnter = chatRequests;
    await page.getByLabel("Ask your coach",{exact:true}).press("Enter");
    await page.getByLabel("Ask your coach",{exact:true}).pressSequentially("Second line");
    assert.equal(await page.getByLabel("Ask your coach",{exact:true}).inputValue(),"First line\nSecond line");
    assert.equal(chatRequests,beforeEnter,"Phone Enter adds a line instead of sending");
  }
  await page.getByLabel("Ask your coach",{exact:true}).fill("");
  await page.setViewportSize({width:390,height:844});
  await page.evaluate(() => window.scrollTo(0,0));
  await page.screenshot({ path: "artifacts/coach/mobile.png", fullPage: true, animations: "disabled" });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await page.setViewportSize({width:320,height:844});
  await page.getByRole("button",{name:"Create a task",exact:true}).click();
  await page.getByLabel("Start with a template",{exact:true}).selectOption("discipline");
  await page.screenshot({path:"artifacts/coach/task-mobile.png",fullPage:true,animations:"disabled"});
  const dialogBox = await page.getByRole("dialog").boundingBox();
  assert.ok(dialogBox.x >= 0 && dialogBox.x + dialogBox.width <= 321);
  await page.getByRole("button",{name:"Save task",exact:true}).click();
  await page.getByRole("heading",{name:"Weekly discipline check",exact:true}).waitFor();
  assert.equal(tasks[0].title,"Weekly discipline check");
  assert.equal(tasks[0].enabled,true);
  assert.deepEqual(errors, []);
  console.log("PASS: guided prompts, actual trade filters, trade picker, rich evidence, followups, export, retry, stop waiting, reset confirmation, task templates, task lifecycle, journal isolation, mobile layout");
} catch (error) {
  console.error(await page?.locator("body").innerText());
  await page?.screenshot({ path: "/tmp/coach-failure.png", fullPage: true });
  throw error;
} finally { await browser?.close(); await server.close(); }
