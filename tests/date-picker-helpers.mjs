export async function selectAnalyticsDate(page, id, value) {
  const [year, month, day] = value.split('-').map(Number);
  await page.locator(`#${id}`).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('combobox', { name: 'Choose the Year' }).click();
  await page.getByRole('option', { name: String(year), exact: true }).click();
  await dialog.getByRole('combobox', { name: 'Choose the Month' }).click();
  const monthLabel = new Intl.DateTimeFormat('en-US', { month: 'long', timeZone: 'UTC' }).format(new Date(Date.UTC(year, month - 1, 1)));
  await page.getByRole('option', { name: monthLabel, exact: true }).click();
  await dialog.locator('.rdp-day:not(.rdp-outside) button').filter({ hasText: new RegExp(`^${day}$`) }).click();
}
