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

const TELLERS_PATH = '/organization/tellers';

test.describe('Docs screenshots — tellers', () => {
  test('captures tellers list and create sheet', async ({ page }) => {
    await page.goto(TELLERS_PATH);
    await waitForPageReady(page);

    await expect(page.getByRole('heading', { name: 'Tellers' })).toBeVisible();
    const createLink = page.getByRole('link', { name: 'Create teller' });
    await expect(createLink).toBeVisible();

    await captureDocsScreenshot(page, 'administrators/system/tellers-list.png');

    await createLink.click();
    await expect(page.locator('[data-slot="sheet-title"]')).toHaveText('Create teller', {
      timeout: 30_000
    });

    await captureDocsScreenshot(page, 'administrators/system/tellers-create.png');
  });
});
