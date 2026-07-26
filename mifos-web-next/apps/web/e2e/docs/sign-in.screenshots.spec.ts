/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { expect, test } from '@playwright/test';
import { seedServerCatalog } from '../helpers/auth';
import { captureDocsScreenshot } from '../helpers/docs-screenshots';
import { waitForPageReady } from '../helpers/interactions';

// The docs-screenshots project signs in via storageState by default. The sign-in
// form itself only exists in a signed-out state, so this file opts out of that
// shared session instead of reusing docs-auth.setup.ts.
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Docs screenshots — sign in', () => {
  test('captures the sign-in form', async ({ page, context, baseURL }) => {
    await seedServerCatalog(context, baseURL ?? 'http://localhost:3000');
    await page.goto('/login');
    await waitForPageReady(page);

    await expect(page.getByRole('heading', { name: /sign in to/i })).toBeVisible();

    await captureDocsScreenshot(page, 'administrators/setup/sign-in.png');
  });
});
