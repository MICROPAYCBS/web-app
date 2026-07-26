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

test.describe('Docs screenshots — account number preferences', () => {
  test('captures account number preferences screen', async ({ page }) => {
    await page.goto('/system/account-number-preferences');
    await waitForPageReady(page);

    await expect(page.getByRole('heading', { name: 'Account number preferences' })).toBeVisible();

    await captureDocsScreenshot(page, 'administrators/setup/account-number-preferences.png');
  });
});
