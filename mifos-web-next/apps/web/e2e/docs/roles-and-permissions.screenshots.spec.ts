/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { expect, test } from '@playwright/test';
import { captureDocsScreenshot } from '../helpers/docs-screenshots';
import { waitForPageReady } from '../helpers/interactions';

const ROLES_PATH = '/system/roles-and-permissions';

test.describe('Docs screenshots — roles and permissions', () => {
  test('captures roles list and create sheet', async ({ page }) => {
    await page.goto(ROLES_PATH);
    await waitForPageReady(page);

    await expect(page.getByRole('heading', { name: 'Roles and permissions' })).toBeVisible();
    const createLink = page.getByRole('link', { name: 'Add role' });
    await expect(createLink).toBeVisible();

    await captureDocsScreenshot(page, 'administrators/system/roles-and-permissions-list.png');

    await createLink.click();
    await expect(page.locator('[data-slot="sheet-title"]')).toHaveText(/add|create.*role/i, {
      timeout: 30_000
    });

    await captureDocsScreenshot(page, 'administrators/system/roles-and-permissions-create.png');
  });
});
