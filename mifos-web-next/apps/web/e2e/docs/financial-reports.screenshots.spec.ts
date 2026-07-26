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

test.describe('Docs screenshots — financial reports', () => {
  test('captures Balance Sheet and Trial Balance', async ({ page }) => {
    await page.goto('/financial-reports/balance-sheet');
    await waitForPageReady(page);
    // Report pages open a parameters sheet; title may be in the sheet subtitle or page header.
    await expect(page.getByText('Balance Sheet Table').first()).toBeVisible({ timeout: 30_000 });

    await captureDocsScreenshot(page, 'administrators/operations/financial-reports-balance-sheet.png');

    await page.goto('/financial-reports/trial-balance');
    await waitForPageReady(page);
    await expect(page.getByText('Trial Balance Table').first()).toBeVisible({ timeout: 30_000 });

    await captureDocsScreenshot(page, 'administrators/operations/financial-reports-trial-balance.png');
  });
});
