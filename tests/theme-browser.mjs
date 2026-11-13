// Built application with a stubbed API; never reads or writes live accounts.
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { preview } from "vite";

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE
  ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : "playwright");
const server = await preview({ preview: { host: "127.0.0.1", port: 4199, strictPort: true } });
const base = "http://127.0.0.1:4199";
await mkdir("artifacts/theme", { recursive: true });
let browser;
try {
  browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_PATH
    ? { executablePath: process.env.CHROMIUM_PATH } : { channel: "chrome" }) });
  const context = await browser.newContext({ colorScheme: "light" });
  const errors = [];
  const writes = [];
  const user = { id: 1, first_name: "Alice", email: "alice@example.test", timezone: "UTC", theme: "dark" };
  context.on("page", page => page.on("pageerror", error => errors.push(error.message)));
  await context.route("**/api/**", route => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    const headers = { "access-control-allow-origin": "*", "access-control-allow-headers": "authorization,content-type", "access-control-allow-methods": "GET,POST,PATCH,OPTIONS" };
    if (request.method() === "OPTIONS") return route.fulfill({ status: 204, headers });
    if (["POST", "PATCH", "PUT", "DELETE"].includes(request.method())) writes.push({ path, data: request.postDataJSON() });
    return route.fulfill({ headers, json: path === "/api/auth/login/"
      ? { access: "test-access", refresh: "test-refresh", user }
      : path === "/api/auth/me/" ? user : [] });
  });
  const page = await context.newPage();
  const theme = name => page.getByRole("button", { name, exact: true });
  const choose = async (value, name = "Theme") => {
    await theme(name).click();
    await page.getByRole("menuitemradio", { name: value, exact: true }).click();
  };
  const checkTheme = async (value, target = page) => {
    await target.waitForFunction(value => document.documentElement.classList.contains(value), value);
    assert.equal(await target.evaluate(() => getComputedStyle(document.documentElement).colorScheme), value);
  };
  await page.goto(base);
  await checkTheme("light");
  await choose("Dark");
  await checkTheme("dark");
  assert.equal(await page.evaluate(() => localStorage.getItem("nexora-theme")), "dark");
  await page.reload();
  await checkTheme("dark");
  await page.getByRole("button", { name: "Theme", exact: true }).click();
  assert.equal(await page.getByRole("menuitemradio", { name: "Dark", exact: true }).getAttribute("aria-checked"), "true");
  await page.keyboard.press("Escape");
  console.log("PASS: Theme is available before sign-in and persists after reload");

  await page.goto(`${base}/login`);
  await checkTheme("dark");
  await page.getByLabel("Email", { exact: true }).fill(user.email);
  await page.getByLabel("Password", { exact: true }).fill("testpass123");
  await choose("Light");
  assert.equal(await page.getByLabel("Email", { exact: true }).inputValue(), user.email);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.getByRole("heading", { name: "Welcome, Alice!", exact: true }).waitFor();
  await checkTheme("light");
  await page.reload();
  await page.getByRole("heading", { name: "Welcome, Alice!", exact: true }).waitFor();
  await checkTheme("light");
  await page.getByRole("button", { name: "Account menu", exact: true }).click();
  await page.getByRole("menuitem", { name: "Settings", exact: true }).click();
  await page.getByRole("button", { name: "Save preferences", exact: true }).click();
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  await checkTheme("light");
  assert.equal(writes.filter(write => write.path === "/api/auth/me/").length, 1);
  assert(writes.filter(write => write.path === "/api/auth/me/").every(write => !Object.hasOwn(write.data, "theme")));
  console.log("PASS: Sign-in, restored sessions and account settings preserve the browser theme without theme API writes");

  await choose("System");
  await checkTheme("light");
  await page.emulateMedia({ colorScheme: "dark" });
  await checkTheme("dark");
  await choose("Light");
  await checkTheme("light");
  const other = await context.newPage();
  await other.goto(`${base}/login`);
  await other.getByRole("button", { name: "Theme", exact: true }).click();
  await other.getByRole("menuitemradio", { name: "Dark", exact: true }).click();
  await checkTheme("dark");
  await other.close();
  await page.emulateMedia({ colorScheme: "light" });
  await page.evaluate(() => localStorage.setItem("nexora-theme", "invalid"));
  await page.reload();
  await checkTheme("light");
  console.log("PASS: Live System updates, explicit overrides, actual cross-tab synchronization and invalid preference fallback");

  for (const language of ["en-US", "fr-FR"]) {
    await page.evaluate(language => localStorage.setItem("nexora_language", language), language);
    const name = language === "fr-FR" ? "Thème" : "Theme";
    for (const route of ["/", "/login", "/register", "/dashboard"]) {
      // Guest-only forms redirect authenticated users; exercise the actual route.
      await page.evaluate(({ authenticated, user }) => {
        for (const key of ['access', 'refresh', 'nexora_session_user']) localStorage.removeItem(key);
        if (authenticated) {
          localStorage.setItem('access', 'test-access');
          localStorage.setItem('refresh', 'test-refresh');
          localStorage.setItem('nexora_session_user', JSON.stringify(user));
        }
      }, { authenticated: route === '/dashboard', user });
      await page.goto(`${base}${route}`);
      for (const width of [320, 390, 768, 1024, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        const selector = theme(name);
        await selector.waitFor({ state: "visible" });
        await page.waitForFunction(() => document.documentElement.scrollWidth <= innerWidth + 1);
        const bounds = await selector.boundingBox();
        assert(bounds.x >= 0 && bounds.x + bounds.width <= width, `${name} fits ${route} at ${width}px`);
        const languageSelector = page.getByRole("combobox", { name: language === "fr-FR" ? "Choisir la langue" : "Select language" });
        const languageBounds = await languageSelector.boundingBox();
        assert(languageBounds.x >= 0 && languageBounds.x + languageBounds.width <= width);
        if (route === "/login" && width === 320 && language === "en-US") {
          const controlBottom = Math.max(bounds.y + bounds.height, languageBounds.y + languageBounds.height);
          assert((await page.getByLabel("Email", { exact: true }).boundingBox()).y > controlBottom);
        }
        if (language === "en-US" && ["/", "/login"].includes(route) && [320, 1440].includes(width)) {
          await page.screenshot({ path: `artifacts/theme/${route === "/" ? "landing" : "login"}-${width}.png` });
        }
      }
    }
    await choose(language === "fr-FR" ? "Sombre" : "Dark", name);
    await checkTheme("dark");
  }
  console.log("PASS: Landing, sign-in, registration and dashboard controls fit 320–1440px in English and French");
  await page.evaluate(() => localStorage.setItem("nexora_language", "en-US"));
  await page.reload();
  await page.getByRole("button", { name: "Account menu", exact: true }).click();
  await page.getByRole("menuitem", { name: "Sign out", exact: true }).click();
  await page.getByRole("button", { name: "Sign in", exact: true }).waitFor();
  await checkTheme("dark");
  assert(!writes.some(write => write.data && Object.hasOwn(write.data, "theme")));
  await context.close();

  const blocked = await browser.newContext({ colorScheme: "light" });
  await blocked.addInitScript(() => {
    const get = Storage.prototype.getItem;
    const set = Storage.prototype.setItem;
    Storage.prototype.getItem = function (key) { if (key === "nexora-theme") throw new Error("blocked"); return get.call(this, key); };
    Storage.prototype.setItem = function (key, value) { if (key === "nexora-theme") throw new Error("blocked"); return set.call(this, key, value); };
  });
  const offline = await blocked.newPage();
  offline.on("pageerror", error => errors.push(error.message));
  await offline.goto(`${base}/login`);
  await offline.route("**/api/**", route => route.abort());
  await offline.getByRole("button", { name: "Theme", exact: true }).click();
  await offline.getByRole("menuitemradio", { name: "Dark", exact: true }).click();
  await checkTheme("dark", offline);
  await offline.getByRole("button", { name: "Theme", exact: true }).click();
  await offline.keyboard.press("Home");
  await offline.keyboard.press("Enter");
  await checkTheme("light", offline);
  await blocked.close();
  assert.deepEqual(errors, []);
  console.log("PASS: Sign-out preserves the theme; pointer and keyboard selection work with theme storage blocked and the API unavailable; no runtime errors");
} finally {
  await browser?.close();
  await new Promise(resolve => server.httpServer.close(resolve));
}
