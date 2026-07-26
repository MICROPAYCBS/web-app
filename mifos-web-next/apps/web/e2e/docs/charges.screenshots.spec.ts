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

const CHARGES_PATH = '/products/charges';

test.describe('Docs screenshots — charges', () => {
  test('captures charges list and create wizard', async ({ page }) => {
    await page.goto(CHARGES_PATH);
    await waitForPageReady(page);

    await expect(page.getByRole('heading', { name: 'Charges' })).toBeVisible();
    const createLink = page.getByRole('link', { name: 'Create charge' });
    await expect(createLink).toBeVisible();

    await captureDocsScreenshot(page, 'administrators/products/charges-list.png');

    await createLink.click();
    await expect(page.getByRole('heading', { name: 'Create charge' })).toBeVisible();
    await expect(page.getByText('Fees and penalties on loan products and accounts.')).toBeVisible();

    await captureDocsScreenshot(page, 'administrators/products/charges-create.png');
  });
});
