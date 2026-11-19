import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { pathToFileURL } from 'node:url';
import { mkdir } from 'node:fs/promises';
import { selectAnalyticsDate } from './date-picker-helpers.mjs';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
const server = await createServer({ server: { host: '127.0.0.1', port: 4231, strictPort: true } });
await server.listen();
let browser;
try {
  browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : { channel: 'chrome' }) });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await mkdir('artifacts/analytics-controls', { recursive: true });
  await page.goto('http://127.0.0.1:4231/tests/analytics.html?dense=1&capital=1000000');
  await page.getByRole('button', { name: 'Custom', exact: true }).click();
  assert.equal(await page.locator('.analytics-filters input[type="date"]').count(), 0);
  await selectAnalyticsDate(page, 'analytics-start', '2025-01-01');
  await selectAnalyticsDate(page, 'analytics-end', '2025-12-31');
  await page.getByText('126 trades', { exact: true }).first().waitFor();
  // Reversed ranges are unavailable, including after changing months/years.
  await page.locator('#analytics-start').click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('combobox', { name: 'Choose the Year' }).click();
  await page.getByRole('option', { name: '2026', exact: true }).click();
  assert.equal(await dialog.locator('.rdp-day:not(.rdp-outside) button:enabled').count(), 0);
  await page.keyboard.press('Escape');
  await page.locator('#analytics-end').click();
  await dialog.getByRole('combobox', { name: 'Choose the Year' }).click();
  await page.getByRole('option', { name: '2024', exact: true }).click();
  assert.equal(await dialog.locator('.rdp-day:not(.rdp-outside) button:enabled').count(), 0);
  await page.keyboard.press('Escape');
  await page.getByRole('group', { name: 'Display unit' }).getByRole('button', { name: '$', exact: true }).click();
  while (await page.getByRole('button', { name: /Open trades for/ }).count() === 0) {
    await page.getByRole('button', { name: 'Previous month', exact: true }).click();
  }
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const calendar = page.locator('section').filter({ has: page.locator('.analytics-calendar') });
    await calendar.scrollIntoViewIfNeeded();
    const result = await calendar.evaluate(card => {
      const cells = [...card.querySelectorAll('.analytics-calendar > button, .analytics-calendar > div')];
      const escaped = cells.flatMap(cell => [...cell.querySelectorAll('span')].filter(el => {
        if (!el.getClientRects().length) return false;
        const rect = el.getBoundingClientRect(), bounds = cell.getBoundingClientRect();
        // Inline text is clipped by its truncation wrapper for unusually large amounts.
        return !el.parentElement.classList.contains('truncate') && (rect.left < bounds.left - 1 || rect.right > bounds.right + 1);
      }).map(el => el.textContent));
      return { escaped, pageOverflow: document.documentElement.scrollWidth > innerWidth, compact: cells.some(cell => /\$[\d.]+k/.test(cell.textContent)), scrollable: card.querySelector('.overflow-x-auto').scrollWidth > card.querySelector('.overflow-x-auto').clientWidth };
    });
    assert.deepEqual(result.escaped, [], `Calendar values stay inside cells at ${width}px`);
    assert.equal(result.pageOverflow, false);
    if (width < 900) assert.equal(result.compact, true);
    if (width <= 390) assert.equal(result.scrollable, true);
    await page.screenshot({ path: `artifacts/analytics-controls/calendar-${width}.png` });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: /Open trades for/ }).first().click();
  await page.getByRole('dialog').waitFor();
  assert.match(await page.getByRole('dialog').innerText(), /\$[\d,]+/);
  await page.keyboard.press('Escape');
  await page.locator('#analytics-start').click();
  await page.screenshot({ path: 'artifacts/analytics-controls/custom-date-390.png' });
  assert.ok(await dialog.getByRole('grid').isVisible());
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#analytics-start').evaluate(el => el === document.activeElement), true);
  await page.goto('http://127.0.0.1:4231/tests/analytics.html?breakdown=1');
  await page.getByRole('combobox', { name: 'Breakdown attribute' }).waitFor();
  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const [label, option] of [['Breakdown attribute', 'Session'], ['Breakdown period', 'Last 3 months']]) {
      const trigger = page.getByRole('combobox', { name: label });
      await trigger.click();
      const list = page.getByRole('listbox');
      await list.waitFor();
      const box = await list.boundingBox();
      assert.ok(box.x >= 0 && box.x + box.width <= width, `${label} stays within viewport`);
      await page.getByRole('option', { name: option, exact: true }).click();
      assert.match(await trigger.innerText(), new RegExp(option));
    }
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('combobox', { name: 'Breakdown attribute' }).click();
  await page.screenshot({ path: 'artifacts/analytics-controls/breakdown-390.png' });
  await page.keyboard.press('Escape');
  assert.deepEqual(errors, []);
  console.log('PASS: custom date calendars, date limits, keyboard dismissal, mobile USD calendar containment and exact day values, styled breakdown dropdown selection, and viewport containment at 320–1440px.');
} finally {
  await browser?.close();
  await server.close();
}
