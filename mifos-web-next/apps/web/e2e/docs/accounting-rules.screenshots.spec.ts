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

const ACCOUNTING_RULES_PATH = '/accounting/accounting-rules';

test.describe('Docs screenshots — accounting rules', () => {
  test('captures accounting rules list and create form', async ({ page }) => {
    await page.goto(ACCOUNTING_RULES_PATH);
    await waitForPageReady(page);

    await expect(page.getByRole('heading', { name: 'Accounting rules' })).toBeVisible();
    const createLink = page.getByRole('link', { name: 'Create rule' });
    await expect(createLink).toBeVisible();

    await captureDocsScreenshot(page, 'administrators/accounting/accounting-rules-list.png');

    await createLink.click();
    await waitForPageReady(page);
    await expect(page.getByRole('heading', { name: /create.*rule/i })).toBeVisible({
      timeout: 30_000
    });

    await captureDocsScreenshot(page, 'administrators/accounting/accounting-rules-create.png');
  });
});
