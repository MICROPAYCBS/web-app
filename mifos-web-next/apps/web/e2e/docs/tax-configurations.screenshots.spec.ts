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

const TAX_CONFIGURATIONS_PATH = '/products/tax-configurations';

test.describe('Docs screenshots — tax configurations', () => {
  test('captures tax configurations hub and tax components list', async ({ page }) => {
    await page.goto(TAX_CONFIGURATIONS_PATH);
    await waitForPageReady(page);

    await expect(page.getByRole('heading', { name: 'Tax configurations' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Tax components' })).toBeVisible();

    await captureDocsScreenshot(page, 'administrators/products/tax-configurations.png');

    await page.getByRole('link', { name: 'Manage components' }).click();
    await waitForPageReady(page);
    await expect(page.getByRole('heading', { name: 'Tax components' })).toBeVisible({
      timeout: 30_000
    });

    await captureDocsScreenshot(page, 'administrators/products/tax-components-list.png');
  });
});
