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

const PRODUCT_MIX_PATH = '/products/products-mix';

test.describe('Docs screenshots — product mix', () => {
  test('captures product mix list and create sheet', async ({ page }) => {
    await page.goto(PRODUCT_MIX_PATH);
    await waitForPageReady(page);

    await expect(page.getByRole('heading', { name: 'Product mix' })).toBeVisible();
    const createLink = page.getByRole('link', { name: 'Create product mix' });
    await expect(createLink).toBeVisible();

    await captureDocsScreenshot(page, 'administrators/products/product-mix-list.png');

    await createLink.click();
    await expect(page).toHaveURL(/[?&]create=1\b/);
    await expect(page.locator('[data-slot="sheet-title"]')).toHaveText('Create product mix', {
      timeout: 30_000
    });

    await captureDocsScreenshot(page, 'administrators/products/product-mix-create.png');
  });
});
