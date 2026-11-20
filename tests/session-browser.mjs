// Real frontend, Django API and CSRF middleware; temporary SQLite database only.
import assert from 'node:assert/strict';
import { spawn, execFileSync } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { preview } from 'vite';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
const backend = resolve('../tradetrack-backend');
const python = process.env.BACKEND_PYTHON || 'python';
const temporary = await mkdtemp(join(tmpdir(), 'nexora-session-'));
const origin = 'http://127.0.0.1:4197', apiOrigin = 'http://127.0.0.1:18887';
const env = { ...process.env, DATABASE_URL: `sqlite:///${join(temporary, 'test.sqlite3')}`, DEBUG: 'True', AUTH_COOKIE_SECURE: 'False', ALLOWED_HOSTS: '127.0.0.1,localhost', CSRF_TRUSTED_ORIGINS: origin };
const email = 'browser-session@example.test', password = 'Synthetic-password-123!';
const manage = (...args) => execFileSync(python, ['manage.py', ...args], { cwd: backend, env, stdio: 'pipe' });
let processBackend, server, browser;
try {
  manage('migrate', '--noinput');
  processBackend = spawn(python, ['manage.py', 'runserver', '127.0.0.1:18887', '--noreload'], { cwd: backend, env, stdio: 'ignore' });
  for (let attempt = 0; ; attempt++) {
    try { if ((await fetch(`${apiOrigin}/api/auth/csrf/`)).ok) break; } catch { /* Startup. */ }
    if (attempt > 100) throw new Error('Django test server did not start');
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  server = await preview({ preview: { host: '127.0.0.1', port: 4197, strictPort: true, proxy: { '/api': apiOrigin } } });
  browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : { channel: 'chrome' }) });
  const context = await browser.newContext();
  if (['3d', 'graphite'].includes(process.env.NEXORA_TEST_DESIGN)) {
    await context.addInitScript(design => localStorage.setItem('nexora-design', design), process.env.NEXORA_TEST_DESIGN);
  }
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`${origin}/register`);
  await page.getByLabel('Email', { exact: true }).fill(email);
  await page.getByLabel('First name', { exact: true }).fill('Session');
  await page.getByLabel('Last name', { exact: true }).fill('Test');
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByLabel('Confirm password', { exact: true }).fill(password);
  const registered = page.waitForResponse(response => response.url().endsWith('/auth/register/') && response.status() === 201);
  await page.getByRole('button', { name: 'Create account', exact: true }).click();
  await registered;
  await page.waitForURL(`${origin}/login`);
  async function signIn(remember = false) {
    await page.getByLabel('Email', { exact: true }).fill(email);
    await page.getByLabel('Password', { exact: true }).fill(password);
    await page.getByLabel('Remember me on this device').setChecked(remember);
    const response = page.waitForResponse(response => response.url().endsWith('/auth/login/') && response.status() === 200);
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    const data = await (await response).json();
    await page.getByRole('heading', { name: 'Welcome, Session!' }).waitFor();
    return data;
  }
  async function signOut() {
    await page.getByRole('button', { name: 'Account menu', exact: true }).click();
    await page.getByRole('menuitem', { name: 'Sign out', exact: true }).click();
    await page.getByRole('button', { name: 'Sign in', exact: true }).waitFor();
  }
  const initialAccess = (await signIn()).access;
  let cookie = (await context.cookies()).find(cookie => cookie.name === 'nexora_refresh');
  assert.equal(cookie.httpOnly, true);
  assert.equal(cookie.sameSite, 'Lax');
  assert.equal(cookie.expires, -1);
  assert.equal(await page.evaluate(() => localStorage.getItem('access')), null);
  assert.equal(await page.evaluate(() => localStorage.getItem('refresh')), null);
  assert.equal(await page.evaluate(() => document.cookie.includes('nexora_refresh')), false);
  const firstRefresh = cookie.value;
  await page.reload();
  await page.getByRole('heading', { name: 'Welcome, Session!' }).waitFor();
  cookie = (await context.cookies()).find(cookie => cookie.name === 'nexora_refresh');
  assert.notEqual(cookie.value, firstRefresh);
  assert.equal(cookie.expires, -1);
  let recoveries = 0;
  await page.route('**/api/auth/me/', route => ++recoveries <= 2
    ? route.fulfill({ status: 503, contentType: 'application/json', body: '{}' })
    : route.continue());
  await page.reload();
  await page.getByRole('heading', { name: 'Welcome, Session!' }).waitFor();
  assert.ok(recoveries >= 3, 'temporary server errors recover without signing out');
  await page.unroute('**/api/auth/me/');
  const second = await context.newPage();
  await Promise.all([page.reload(), second.goto(`${origin}/dashboard`)]);
  await page.getByRole('heading', { name: 'Welcome, Session!' }).waitFor();
  await second.getByRole('heading', { name: 'Welcome, Session!' }).waitFor();
  await signOut();
  await second.getByRole('button', { name: 'Sign in', exact: true }).waitFor();
  await page.waitForFunction(() => localStorage.getItem('nexora_logout_pending') === null);
  assert.equal((await context.cookies()).some(cookie => cookie.name === 'nexora_refresh'), false);
  assert.equal((await context.request.get(`${origin}/api/auth/me/`, { headers: { Authorization: `Bearer ${initialAccess}` } })).status(), 401);
  await second.close();
  await signIn(true);
  cookie = (await context.cookies()).find(cookie => cookie.name === 'nexora_refresh');
  assert.ok(cookie.expires > Date.now() / 1000 + 6 * 86400);
  await page.getByRole('button', { name: 'Account menu', exact: true }).click();
  await page.getByRole('menuitem', { name: 'Settings', exact: true }).click();
  await page.getByRole('button', { name: 'Sign out all devices', exact: true }).click();
  await page.getByLabel('Password', { exact: true }).fill('wrong-password');
  await page.getByRole('button', { name: 'Confirm and sign out all devices' }).click();
  await page.getByRole('alert').filter({ hasText: 'Could not confirm your identity' }).waitFor();
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Confirm and sign out all devices' }).click();
  await page.getByRole('button', { name: 'Sign in', exact: true }).waitFor();
  await signIn();
  await page.route('**/api/auth/logout/', route => route.abort('failed'));
  await signOut();
  assert.equal(await page.evaluate(() => localStorage.getItem('nexora_logout_pending')), 'true');
  await page.unroute('**/api/auth/logout/');
  await page.reload();
  await page.getByRole('button', { name: 'Sign in', exact: true }).waitFor();
  await page.waitForFunction(() => localStorage.getItem('nexora_logout_pending') === null);
  assert.equal((await context.cookies()).some(cookie => cookie.name === 'nexora_refresh'), false);
  await signIn();
  manage('shell', '-c', 'from users.models import AuthSession; from django.utils import timezone; from datetime import timedelta; AuthSession.objects.update(expires_at=timezone.now()-timedelta(seconds=1))');
  await page.reload();
  await page.getByText('Your session has expired. Please sign in again to continue.', { exact: true }).waitFor();
  assert.deepEqual(errors, []);
  console.log('PASS: real API signup and login, CSRF, memory-only access, HttpOnly cookies, Remember me, reload, multi-tab rotation/sign-out, immediate revocation, identity confirmation and failed logout recovery.');
} finally {
  await browser?.close();
  await server?.close();
  if (processBackend) {
    const exited = new Promise(resolve => processBackend.once('exit', resolve));
    processBackend.kill();
    await exited;
  }
  await rm(temporary, { recursive: true, force: true });
}
