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

const USERS_PATH = '/appusers';

test.describe('Docs screenshots — users', () => {
  test('captures users list and create wizard', async ({ page }) => {
    await page.goto(USERS_PATH);
    await waitForPageReady(page);

    await expect(page.getByRole('heading', { name: 'Users' })).toBeVisible();
    const createLink = page.getByRole('link', { name: 'Create user' });
    await expect(createLink).toBeVisible();

    await captureDocsScreenshot(page, 'administrators/system/users-list.png');

    await createLink.click();
    await waitForPageReady(page);
    await expect(page.getByRole('heading', { name: 'Create user' })).toBeVisible({
      timeout: 30_000
    });

    await captureDocsScreenshot(page, 'administrators/system/users-create.png');
  });
});
