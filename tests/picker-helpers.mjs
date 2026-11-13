// Interact with the same portalled controls users see (not hidden form selects).
export async function chooseOption(page, trigger, label) {
  await trigger.click();
  await page.getByRole('option', { name: label, exact: true }).click();
}
export async function chooseDate(page, trigger, value) {
  const [year, month, day] = value.split('-');
  await trigger.click();
  const calendar = page.locator('.trade-date-popover');
  await chooseOption(page, calendar.getByRole('combobox', { name: 'Choose the Year' }), year);
  const monthName = new Intl.DateTimeFormat('en-US', { month: 'long', timeZone: 'UTC' }).format(new Date(`${year}-${month}-01T00:00:00Z`));
  await chooseOption(page, calendar.getByRole('combobox', { name: 'Choose the Month' }), monthName);
  await calendar.locator(`[data-day="${year}-${month}-${day}"] button`).click();
}
