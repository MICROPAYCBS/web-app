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

const SAVINGS_PRODUCTS_PATH = '/products/savings-products';

test.describe('Docs screenshots — savings products', () => {
  test('captures savings products list and create wizard', async ({ page }) => {
    await page.goto(SAVINGS_PRODUCTS_PATH);
    await waitForPageReady(page);

    await expect(page.getByRole('heading', { name: 'Savings products' })).toBeVisible();
    const createLink = page.getByRole('link', { name: 'Create savings product' });
    await expect(createLink).toBeVisible();

    await captureDocsScreenshot(page, 'administrators/products/savings-products-list.png');

    await createLink.click();
    await waitForPageReady(page);
    await expect(page.getByRole('heading', { name: 'Create savings product' })).toBeVisible({
      timeout: 30_000
    });

    await captureDocsScreenshot(page, 'administrators/products/savings-products-create.png');
  });
});
