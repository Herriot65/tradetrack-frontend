import assert from 'node:assert/strict';
import { preview } from 'vite';
import { pathToFileURL } from 'node:url';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
const origin = 'http://127.0.0.1:4198';
const server = await preview({ preview: { host: '127.0.0.1', port: 4198, strictPort: true } });
let browser;
try {
  browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : { channel: 'chrome' }) });
  for (const response of [
    { contentType: 'text/html', body: '<!doctype html><html><body>Nexora</body></html>' },
    { json: {} },
    { json: [] },
  ]) {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.route('**/api/**', route => route.fulfill(response));
    for (const path of ['/register', '/login', '/dashboard']) {
      await page.goto(origin + path);
      const target = path === '/register' ? '/register' : '/login';
      await page.getByRole('button', { name: target === '/register' ? 'Create account' : 'Sign in', exact: true }).waitFor();
      assert.equal(new URL(page.url()).pathname, target, 'invalid API data never grants dashboard access');
    }
    await context.close();
  }
  // A correctly routed anonymous request must still show the login form.
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.route('**/api/**', route => route.fulfill({ status: 401, json: { detail: 'Not authenticated' } }));
  await page.goto(origin + '/login');
  await page.getByRole('button', { name: 'Sign in', exact: true }).waitFor();
  await context.close();
  console.log('PASS: HTML fallbacks and malformed users cannot authenticate; guest forms remain usable.');
} finally {
  await browser?.close();
  await server.close();
}
