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

const FIXED_DEPOSIT_PRODUCTS_PATH = '/products/fixed-deposit-products';

test.describe('Docs screenshots — fixed deposit products', () => {
  test('captures fixed deposit products list and create wizard', async ({ page }) => {
    await page.goto(FIXED_DEPOSIT_PRODUCTS_PATH);
    await waitForPageReady(page);

    await expect(page.getByRole('heading', { name: 'Fixed deposit products' })).toBeVisible();
    const createLink = page.getByRole('link', { name: 'Create fixed deposit product' });
    await expect(createLink).toBeVisible();

    await captureDocsScreenshot(page, 'administrators/products/fixed-deposit-products-list.png');

    await createLink.click();
    await waitForPageReady(page);
    await expect(page.getByRole('heading', { name: 'Create fixed deposit product' })).toBeVisible({
      timeout: 30_000
    });

    await captureDocsScreenshot(page, 'administrators/products/fixed-deposit-products-create.png');
  });
});
