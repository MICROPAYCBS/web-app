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

const HOLIDAYS_PATH = '/organization/holidays';

test.describe('Docs screenshots — holidays', () => {
  test('captures holidays list and create form', async ({ page }) => {
    await page.goto(HOLIDAYS_PATH);
    await waitForPageReady(page);

    await expect(page.getByRole('heading', { name: 'Holidays' })).toBeVisible();
    const createLink = page.getByRole('link', { name: 'Create holiday' });
    await expect(createLink).toBeVisible();

    await captureDocsScreenshot(page, 'administrators/organization/holidays-list.png');

    await createLink.click();
    await waitForPageReady(page);
    await expect(page.getByRole('heading', { name: 'Create holiday' })).toBeVisible({
      timeout: 30_000
    });

    await captureDocsScreenshot(page, 'administrators/organization/holidays-create.png');
  });
});
