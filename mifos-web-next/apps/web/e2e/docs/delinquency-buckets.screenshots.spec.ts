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

const DELINQUENCY_BUCKETS_PATH = '/products/delinquency-bucket-configurations/buckets';

test.describe('Docs screenshots — delinquency buckets', () => {
  test('captures delinquency buckets list and create form', async ({ page }) => {
    await page.goto(DELINQUENCY_BUCKETS_PATH);
    await waitForPageReady(page);

    await expect(page.getByRole('heading', { name: 'Delinquency buckets' })).toBeVisible();

    await captureDocsScreenshot(page, 'administrators/products/delinquency-buckets-list.png');

    await page.getByRole('button', { name: 'Create delinquency bucket' }).click();
    await page.getByRole('menuitem', { name: 'Regular bucket' }).click();
    await waitForPageReady(page);
    await expect(page.getByRole('heading', { name: /create.*bucket|regular bucket/i })).toBeVisible({
      timeout: 30_000
    });

    await captureDocsScreenshot(page, 'administrators/products/delinquency-buckets-create.png');
  });
});
