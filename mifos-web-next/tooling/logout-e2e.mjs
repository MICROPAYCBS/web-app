import { chromium } from 'playwright';

const BASE = process.env.E2E_BASE_URL ?? 'https://front-lime-rho.vercel.app';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto(`${BASE}/connect`, { waitUntil: 'networkidle' });
  if (await page.getByText('Mifos Demo').count() === 0) {
    await page.getByLabel(/display name/i).fill('Mifos Demo');
    await page.getByLabel(/api base url/i).fill('https://demo.mifos.community/fineract-provider/api/v1');
    await page.getByLabel(/tenant id/i).fill('default');
    await page.getByRole('button', { name: /save and continue/i }).click();
    await page.waitForTimeout(3000);
  }
  await page.getByRole('link', { name: /continue to sign in/i }).click();
  await page.waitForURL(/\/login/, { timeout: 30000 });

  await page.getByLabel(/username/i).fill('mifos');
  await page.getByLabel(/^password$/i).fill('password');
  await page.getByRole('button', { name: /^sign in$/i }).click();
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 60000 });
  console.log('Logged in:', page.url());
  console.log('Has session:', (await context.cookies()).some((c) => c.name === 'mifos-session' && c.value.length > 10));

  await page.locator('[data-sidebar="menu-button"]').last().click();
  await page.getByRole('menuitem', { name: /sign out/i }).click();
  await page.waitForTimeout(5000);
  console.log('After sign out:', page.url());
  const sess = (await context.cookies()).find((c) => c.name === 'mifos-session');
  console.log('Session cookie:', sess ? `len=${sess.value.length} val=${sess.value.slice(0,20)}` : 'missing');

  await page.goto(`${BASE}/`);
  await page.waitForLoadState('networkidle');
  console.log('After visit /:', page.url());

  await browser.close();
}
run().catch((e) => { console.error(e); process.exit(1); });
