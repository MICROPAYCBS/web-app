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

const CLIENTS_PATH = '/clients';

test.describe('Docs screenshots — clients (customers)', () => {
  test('captures client list and create wizard', async ({ page }) => {
    await page.goto(CLIENTS_PATH);
    await waitForPageReady(page);

    await expect(page.getByRole('heading', { name: 'Customers' })).toBeVisible();
    const createLink = page.getByRole('link', { name: 'New customer' });
    await expect(createLink).toBeVisible();

    await captureDocsScreenshot(page, 'end-users/clients/clients-list.png');

    await Promise.all([
      page.waitForURL(/\/clients\/create(?:\?|$)/, { timeout: 60_000 }),
      createLink.click()
    ]);
    await waitForPageReady(page);
    await expect(page.getByRole('heading', { name: 'Create customer' })).toBeVisible({
      timeout: 60_000
    });

    await captureDocsScreenshot(page, 'end-users/clients/create-client-wizard.png');
  });
});
