import { chromium } from 'playwright';
const BASE = 'https://front-lime-rho.vercel.app';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.goto(`${BASE}/connect`);
if (await page.getByText('Mifos Demo').count() === 0) {
  await page.getByLabel(/display name/i).fill('Mifos Demo');
  await page.getByLabel(/api base url/i).fill('https://demo.mifos.community/fineract-provider/api/v1');
  await page.getByLabel(/tenant id/i).fill('default');
  await page.getByRole('button', { name: /save and continue/i }).click();
  await page.waitForTimeout(3000);
}
await page.getByRole('link', { name: /continue to sign in/i }).click();
await page.waitForURL(/\/login/);
await page.getByLabel(/username/i).fill('mifos');
await page.getByLabel(/^password$/i).fill('password');
await page.getByRole('button', { name: /^sign in$/i }).click();
await page.waitForTimeout(8000);
console.log('URL:', page.url());
console.log(await page.locator('body').innerText());
await browser.close();
