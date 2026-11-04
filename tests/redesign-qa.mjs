import { createServer } from "vite";
import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const output = path.resolve("artifacts/redesign");
await mkdir(output, { recursive: true });
const executable =
  process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";
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
const reports = [];
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
  const screens = process.argv.slice(2).length
    ? process.argv.slice(2)
    : [
        "landing",
        "login",
        "register",
        "dashboard",
        "empty",
        "trades",
        "analytics",
        "trade",
        "fields",
        "settings",
        "create",
        "missing",
      ];
  for (const width of [1440, 768, 390])
    for (const screen of screens) {
      const name = `${screen}-${width}`;
      await send("Emulation.setDeviceMetricsOverride", {
        width,
        height: 1100,
        deviceScaleFactor: 1,
        mobile: width < 768,
      });
      await send("Page.navigate", {
        url: `http://127.0.0.1:4191/tests/redesign.html?screen=${screen}`,
      });
      let raw;
      for (let n = 0; n < 120; n++) {
        await pause(100);
        const result = await send("Runtime.evaluate", {
          expression: 'document.querySelector("#nexora-qa-report")?.textContent',
          returnByValue: true,
        });
        if (result.result.value) {
          raw = result.result.value;
          break;
        }
      }
      const report = raw
        ? JSON.parse(raw)
        : { screen, width, errors: ["Browser did not complete the QA probe"] };
      if (report.width !== width)
        report.errors.push(`Expected viewport ${width}; got ${report.width}`);
      if (screen === "trade" && width >= 768 && !report.errors.length) {
        try {
          const result = await send("Runtime.evaluate", {
            expression:
              "JSON.stringify(document.querySelector('[aria-label=\"Resize trade form\"]').getBoundingClientRect().toJSON())",
            returnByValue: true,
          });
          const handle = JSON.parse(result.result.value),
            start = handle.x + 3,
            y = 200;
          await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: start, y });
          await send("Input.dispatchMouseEvent", {
            type: "mousePressed",
            x: start,
            y,
            button: "left",
            clickCount: 1,
          });
          await send("Input.dispatchMouseEvent", {
            type: "mouseMoved",
            x: Math.max(0, start - 140),
            y,
            button: "left",
            buttons: 1,
          });
          await send("Input.dispatchMouseEvent", {
            type: "mouseReleased",
            x: Math.max(0, start - 140),
            y,
            button: "left",
            clickCount: 1,
          });
          await pause(150);
          const check = await send("Runtime.evaluate", {
            expression:
              "document.querySelector('[data-slot=\"sheet-content\"]').getBoundingClientRect().width>650",
            returnByValue: true,
          });
          if (!check.result.value) report.errors.push("Actual resize drag did not widen the sheet");
          else report.checks.push("Pointer drag resizes trade sheet");
        } catch (error) {
          report.errors.push(error.message);
        }
      }
      const screenshot = await send("Page.captureScreenshot", {
        format: "png",
        captureBeyondViewport: false,
      });
      await writeFile(path.join(output, `${name}.png`), Buffer.from(screenshot.data, "base64"));
      if (screen === "analytics" || screen === "landing") {
        for (const offset of [1100, 2300]) {
          await send("Runtime.evaluate", {
            expression: `window.scrollTo({top:${offset},behavior:"instant"})`,
          });
          await pause(100);
          const lower = await send("Page.captureScreenshot", {
            format: "png",
            captureBeyondViewport: false,
          });
          await writeFile(
            path.join(output, `${name}-section-${offset}.png`),
            Buffer.from(lower.data, "base64"),
          );
        }
      }
      reports.push(report);
      console.log(
        `${report.errors.length ? "FAIL" : "PASS"} ${name}: ${(report.errors.length ? report.errors : report.checks).join("; ")}`,
      );
    }
  await writeFile(path.join(output, "report.json"), JSON.stringify(reports, null, 2));
  if (reports.some((report) => report.errors.length)) process.exitCode = 1;
  await send("Browser.close");
} finally {
  socket?.close();
  chrome.kill();
  await server.close();
}
