import { createServer } from "vite";
import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const output = path.resolve("artifacts/theme");
await mkdir(output, { recursive: true });
const executable =
  process.env.CHROME_PATH || (process.platform === "win32"
    ? "C:/Program Files/Google/Chrome/Application/chrome.exe"
    : "/usr/bin/chromium");
const server = await createServer({
  define: { "import.meta.env.VITE_USE_MOCK": JSON.stringify("false") },
  server: { host: "127.0.0.1", port: 4191, strictPort: true },
});
await server.listen();
const chrome = spawn(
  executable,
  [
    "--headless",
    "--disable-gpu",
    "--no-sandbox",
    "--no-first-run",
    "--disable-background-networking",
    "--remote-debugging-port=4192",
    `--user-data-dir=${path.join(output, "cdp-profile")}`,
    "about:blank",
  ],
  { windowsHide: true, stdio: "ignore" },
);
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let socket;
try {
  let targets;
  for (let n = 0; n < 60; n++) {
    try {
      targets = await (await fetch("http://127.0.0.1:4192/json/list")).json();
      break;
    } catch {
      await pause(100);
    }
  }
  if (!targets) throw new Error("Headless Chrome did not start.");
  socket = new WebSocket(targets.find((target) => target.type === "page").webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });
  let sequence = 0;
  const pending = new Map();
  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.id) {
      const callbacks = pending.get(message.id);
      if (callbacks) {
        pending.delete(message.id);
        message.error
          ? callbacks.reject(new Error(JSON.stringify(message.error)))
          : callbacks.resolve(message.result);
      }
    }
  });
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const id = ++sequence;
      pending.set(id, { resolve, reject });
      socket.send(JSON.stringify({ id, method, params }));
    });
  await send("Page.enable");
  await send("Runtime.enable");

  const evaluate = async (expression) => {
    const result = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
    return result.result.value;
  };
  const check = async (expression, message) => {
    if (!await evaluate(expression)) throw new Error(message);
    console.log(`PASS ${message}`);
  };
  const navigate = async () => {
    await send("Page.navigate", { url: "http://127.0.0.1:4191/tests/redesign.html?screen=dashboard" });
    for (let i = 0; i < 100; i++) {
      if (await evaluate('Boolean(document.querySelector("#nexora-qa-report"))')) return;
      await pause(100);
    }
    throw new Error("Fixture did not load");
  };
  const emulate = async (value) => {
    await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value }] });
    await pause(100);
  };
  const choose = async (label) => {
    await evaluate(`document.querySelector('[aria-label="Theme"]').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0, pointerType: 'mouse', ctrlKey: false }))`);
    await pause(150);
    await evaluate(`Array.from(document.querySelectorAll('[role="option"]')).find(node => node.textContent.trim() === ${JSON.stringify(label)}).click()`);
    await pause(150);
  };
  await emulate("light");
  await navigate();
  await evaluate('localStorage.removeItem("nexora-theme")');
  await navigate();
  await check('document.documentElement.classList.contains("light") && document.querySelector("[aria-label=Theme]").textContent.includes("System")', "Default follows system light");
  await choose("Dark");
  await check('window.__preferenceWrites.at(-1).theme === "dark"', "Selector saves the account theme preference");
  await check('document.documentElement.classList.contains("dark") && localStorage.getItem("nexora-theme") === "dark"', "Dark choice applies and persists");
  await navigate();
  await check('document.documentElement.classList.contains("dark") && document.querySelector("[aria-label=Theme]").textContent.includes("Dark")', "Dark choice survives reload");
  await emulate("dark");
  await choose("Light");
  await evaluate('window.__rejectPreferences = true');
  await choose("Dark");
  await check('document.documentElement.classList.contains("light") && document.querySelector("[role=alert]").textContent.includes("Couldn’t save theme")', "Failed account save keeps the current theme and reports the error");
  await evaluate('window.__rejectPreferences = false');
  await check('document.documentElement.classList.contains("light") && getComputedStyle(document.querySelector(".nx-header")).backgroundColor === "rgb(246, 248, 248)"', "Light overrides a dark device and updates header palette");
  await choose("System");
  await check('document.documentElement.classList.contains("dark")', "System resolves to device dark");
  await emulate("light");
  await check('document.documentElement.classList.contains("light")', "System reacts to device changes live");
  await evaluate(`localStorage.setItem('nexora-theme', 'dark'); dispatchEvent(new StorageEvent('storage', {key: 'nexora-theme', storageArea: localStorage}))`);
  await check('document.documentElement.classList.contains("dark") && document.querySelector("[aria-label=Theme]").textContent.includes("Dark")', "Theme synchronizes storage updates");
  await evaluate('localStorage.setItem("nexora-theme", "invalid")');
  await navigate();
  await check('document.documentElement.classList.contains("light") && document.querySelector("[aria-label=Theme]").textContent.includes("System")', "Invalid saved preference falls back to System");
  await send("Page.addScriptToEvaluateOnNewDocument", { source: `Storage.prototype.getItem = () => { throw new Error('blocked'); }; Storage.prototype.setItem = () => { throw new Error('blocked'); };` });
  await navigate();
  await choose("Dark");
  await check('document.documentElement.classList.contains("dark")', "Theme remains usable with browser storage blocked");
  await choose("Light");
  for (const width of [320, 390, 768, 1440]) {
    await send("Emulation.setDeviceMetricsOverride", { width, height: 1000, deviceScaleFactor: 1, mobile: width < 768 });
    await pause(100);
    await check('document.documentElement.scrollWidth <= innerWidth + 1', `No page overflow at ${width}px`);
    const screenshot = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
    await writeFile(path.join(output, `light-${width}.png`), Buffer.from(screenshot.data, "base64"));
  }
  await check('JSON.parse(document.querySelector("#nexora-qa-report").textContent).errors.length === 0', "No fixture runtime errors");
  await send("Browser.close");
} finally {
  socket?.close();
  chrome.kill();
  await server.close();
}
