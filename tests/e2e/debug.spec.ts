import { test } from '@playwright/test';

test('debug: dump page content', async ({ page }) => {
  const consoleMessages: string[] = [];
  page.on('console', (msg) => {
    consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
  });

  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));

  await page.goto('/', { waitUntil: 'load', timeout: 60_000 });
  await page.waitForTimeout(15_000);

  const rootHTML = await page.evaluate(() => document.getElementById('root')?.innerHTML ?? 'NO ROOT');
  console.log(`ROOT HTML length: ${rootHTML.length}`);
  if (rootHTML.length > 0) {
    console.log(rootHTML.substring(0, 1000));
  }

  console.log(`\nCONSOLE MESSAGES (${consoleMessages.length}):`);
  consoleMessages.slice(0, 30).forEach(m => console.log(`  ${m.substring(0, 200)}`));

  console.log(`\nPAGE ERRORS (${errors.length}):`);
  errors.forEach(e => console.log(`  ${e.substring(0, 300)}`));
});
