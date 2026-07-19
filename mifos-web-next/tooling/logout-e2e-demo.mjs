import { chromium } from 'playwright';

const BASE = process.env.E2E_BASE_URL ?? 'http://localhost:3000';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto(`${BASE}/connect`, { waitUntil: 'networkidle' });
  await page.getByRole('link', { name: /continue to sign in/i }).click();
  await page.waitForURL(/\/login/);

  const demoBtn = page.getByRole('button', { name: /continue with demo session/i });
  if (await demoBtn.count()) {
    await demoBtn.click();
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 30000 });
  } else {
    throw new Error('Demo session button not found — set DEMO_SESSION_ENABLED');
  }

  console.log('Logged in:', page.url());
  const hasSession = (await context.cookies()).some(
    (c) => c.name === 'mifos-session' && c.value.length > 20
  );
  console.log('Session cookie present:', hasSession);

  await page.locator('[data-sidebar="menu-button"]').last().click();
  await page.getByRole('menuitem', { name: /sign out/i }).click();
  await page.waitForURL(/\/login/, { timeout: 30000 });
  console.log('After logout:', page.url());

  const sess = (await context.cookies()).find((c) => c.name === 'mifos-session');
  const cleared = !sess || sess.value === '' || sess.value === '""' || sess.value.length < 5;
  console.log('Cookie cleared:', cleared, sess?.value?.slice(0, 30));

  await page.goto(`${BASE}/`);
  await page.waitForLoadState('networkidle');
  console.log('Visit / redirects to:', page.url());

  if (!page.url().includes('/login') || !cleared) {
    throw new Error('Logout failed');
  }
  console.log('PASS');
  await browser.close();
}

run().catch((e) => {
  console.error('FAIL', e);
  process.exit(1);
});
