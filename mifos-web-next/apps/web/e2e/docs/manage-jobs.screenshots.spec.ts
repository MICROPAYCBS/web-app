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

test.describe('Docs screenshots — manage jobs', () => {
  test('captures manage jobs screen', async ({ page }) => {
    await page.goto('/system/manage-jobs');
    await waitForPageReady(page);

    await expect(page.getByRole('heading', { name: 'Manage jobs' })).toBeVisible();

    await captureDocsScreenshot(page, 'administrators/operations/manage-jobs.png');
  });
});
