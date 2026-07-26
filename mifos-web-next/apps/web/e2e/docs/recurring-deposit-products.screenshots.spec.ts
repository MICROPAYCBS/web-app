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

const RECURRING_DEPOSIT_PRODUCTS_PATH = '/products/recurring-deposit-products';

test.describe('Docs screenshots — recurring deposit products', () => {
  test('captures recurring deposit products list and create wizard', async ({ page }) => {
    await page.goto(RECURRING_DEPOSIT_PRODUCTS_PATH);
    await waitForPageReady(page);

    await expect(page.getByRole('heading', { name: 'Recurring deposit products' })).toBeVisible();
    const createLink = page.getByRole('link', { name: 'Create recurring deposit product' });
    await expect(createLink).toBeVisible();

    await captureDocsScreenshot(page, 'administrators/products/recurring-deposit-products-list.png');

    await page.goto(`${RECURRING_DEPOSIT_PRODUCTS_PATH}/create`);
    await waitForPageReady(page);
    await expect(
      page.getByRole('heading', { name: 'Create recurring deposit product' })
    ).toBeVisible({ timeout: 30_000 });

    await captureDocsScreenshot(page, 'administrators/products/recurring-deposit-products-create.png');
  });
});
