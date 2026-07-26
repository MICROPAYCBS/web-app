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

const CHART_OF_ACCOUNTS_PATH = '/accounting/chart-of-accounts';

test.describe('Docs screenshots — chart of accounts', () => {
  test('captures GL account list and create form', async ({ page }) => {
    await page.goto(CHART_OF_ACCOUNTS_PATH);
    await waitForPageReady(page);

    await expect(page.getByRole('heading', { name: 'Chart of accounts' })).toBeVisible();
    const createLink = page.getByRole('link', { name: 'Add account' });
    await expect(createLink).toBeVisible();

    await captureDocsScreenshot(page, 'administrators/accounting/chart-of-accounts-list.png');

    await createLink.click();
    await waitForPageReady(page);
    await expect(page.getByRole('heading', { name: /add|create.*account/i })).toBeVisible({
      timeout: 30_000
    });

    await captureDocsScreenshot(page, 'administrators/accounting/chart-of-accounts-create.png');
  });
});
