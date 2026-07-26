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

test.describe('Docs screenshots — app navigation', () => {
  test('captures the sidebar/header shell and global search', async ({ page }) => {
    await page.goto('/');
    await waitForPageReady(page);

    // Dashboard auto-opens its nav group; exit to root so Quick access / Sections show.
    const exitGroup = page.getByRole('button', { name: /^Overview$/i });
    if (await exitGroup.isVisible().catch(() => false)) {
      await exitGroup.click();
    }

    await expect(page.getByText('Quick access')).toBeVisible();
    await expect(page.getByText('Sections')).toBeVisible();

    await captureDocsScreenshot(page, 'end-users/navigation/app-shell.png');

    await page.getByRole('button', { name: 'Search records' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByPlaceholder('Search customers, accounts, groups…')).toBeVisible();

    await captureDocsScreenshot(page, 'end-users/navigation/global-search.png');
  });
});
