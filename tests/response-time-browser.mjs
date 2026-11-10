// Production bundle and real auth provider. No live accounts or API writes.
import assert from 'node:assert/strict';
import { preview } from 'vite';
import { pathToFileURL } from 'node:url';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
const server = await preview({ preview: { host: '127.0.0.1', port: 4198, strictPort: true } });
let browser;
try {
  browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const page = await browser.newPage();
  const errors = [], assets = [], calls = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => { if (request.url().includes('/assets/')) assets.push(request.url()); });
  let releaseJournals, loginRepliedAt;
  const journalsReady = new Promise(resolve => { releaseJournals = resolve; });
  await page.route('**/api/**', async route => {
    const request = route.request(), path = new URL(request.url()).pathname;
    const headers = { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'authorization,content-type', 'access-control-allow-methods': 'GET,POST,OPTIONS' };
    const reply = (status, json) => route.fulfill({ status, json, headers });
    if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
    calls.push(path);
    if (path === '/api/auth/login/') {
      assert.equal(request.headers().authorization, undefined);
      await reply(200, { access: 'synthetic', refresh: 'synthetic-refresh', user: { id: 1, first_name: 'Fast', email: 'fast@example.test', timezone: 'UTC' } });
      loginRepliedAt = performance.now();
      return;
    }
    if (path === '/api/journals/') {
      await journalsReady;
      return reply(200, []);
    }
    throw new Error(`Unexpected API call: ${path}`);
  });
  await page.goto('http://127.0.0.1:4198/login');
  await page.getByLabel('Email', { exact: true }).fill('fast@example.test');
  await page.getByLabel('Password', { exact: true }).fill('Example123!');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.waitForURL('**/dashboard');
  await page.getByRole('heading', { name: 'Trading accounts', exact: true }).waitFor();
  const renderMs = performance.now() - loginRepliedAt;
  assert.ok(renderMs < 1500, `Login response to dashboard took ${renderMs} ms`);
  assert.ok(!calls.includes('/api/auth/me/'), 'Login payload should establish the session without a second user fetch');
  assert.ok(!assets.some(url => /\/(Journal-|Coach-|RichNotesInput-)/.test(url)), 'Sign-in must not load journal charts, coach, or editor bundles');
  releaseJournals();
  await page.getByRole('heading', { name: 'Welcome, Fast!', exact: true }).waitFor();
  assert.deepEqual(errors, []);
  console.log(`PASS: dashboard rendered ${Math.round(renderMs)} ms after login response, before journal data; no extra profile request or feature bundles.`);
} finally {
  await browser?.close();
  await server.httpServer.close();
}
