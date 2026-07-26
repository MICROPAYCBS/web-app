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

const COLLATERAL_PRODUCTS_PATH = '/products/collaterals';

test.describe('Docs screenshots — collateral products', () => {
  test('captures collateral products list and create form', async ({ page }) => {
    await page.goto(COLLATERAL_PRODUCTS_PATH);
    await waitForPageReady(page);

    await expect(page.getByRole('heading', { name: 'Collateral products' })).toBeVisible();
    const createLink = page.getByRole('link', { name: 'Create collateral product' });
    await expect(createLink).toBeVisible();

    await captureDocsScreenshot(page, 'administrators/products/collateral-products-list.png');

    await createLink.click();
    await expect(page.locator('[data-slot="sheet-title"]')).toHaveText('Create collateral product', {
      timeout: 30_000
    });

    await captureDocsScreenshot(page, 'administrators/products/collateral-products-create.png');
  });
});
