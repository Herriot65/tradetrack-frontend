import assert from 'node:assert/strict';
import { preview } from 'vite';
import { pathToFileURL } from 'node:url';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
const server = await preview({ preview: { host: '127.0.0.1', port: 4198, strictPort: true } });
let browser;
const user = { id: 1, email: 'session@example.test', first_name: 'Session', timezone: 'UTC' };
try {
  browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : { channel: 'chrome' }) });
  for (const saved of [true, false]) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await context.addInitScript(({ saved, user }) => {
      localStorage.setItem('access', 'valid');
      if (saved) localStorage.setItem('nexora_session_user', JSON.stringify(user));
    }, { saved, user });
    const page = await context.newPage();
    await page.route('**/api/**', route => route.fulfill({ json: route.request().url().includes('/auth/me/') ? user : [], headers: { 'access-control-allow-origin': '*' } }));
    await page.goto('http://127.0.0.1:4198/');
    const heroLink = page.locator('main').getByRole('link', { name: 'Dashboard', exact: true });
    await heroLink.waitFor();
    assert.equal(await page.getByRole("navigation", { name: "Main navigation", exact: true }).getByRole("link", { name: "Dashboard", exact: true }).count(), 1);
    await heroLink.click();
    await page.waitForURL('**/dashboard');
    for (const path of ['/register', '/login']) {
      await page.goto('http://127.0.0.1:4198' + path);
      await page.waitForURL('**/dashboard');
      assert.equal(await page.getByText('Create account', { exact: true }).first().count(), 0);
    }
    await page.goto('http://127.0.0.1:4198/');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole('button', { name: 'Open menu', exact: true }).click();
    assert.equal(await page.locator('#landing-mobile-menu').getByRole('link', { name: 'Dashboard', exact: true }).count(), 1);
    await page.locator('#landing-mobile-menu').getByRole('link', { name: 'Dashboard', exact: true }).last().click();
    await page.waitForURL('**/dashboard');
    await context.close();
    console.log(`PASS authenticated landing and guest redirects; saved user: ${saved}`);
  }
  const page = await browser.newPage();
  await page.goto('http://127.0.0.1:4198/');
  await page.locator('main').getByRole('link', { name: 'Get started', exact: true }).click();
  await page.waitForURL('**/register');
  await page.getByText('Create account', { exact: true }).first().waitFor();
  console.log('PASS signed-out signup');
} finally {
  await browser?.close();
  await new Promise(resolve => server.httpServer.close(resolve));
}
