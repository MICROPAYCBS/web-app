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

const APPROVAL_WORKFLOWS_PATH = '/system/approval-workflows';

test.describe('Docs screenshots — approval workflows', () => {
  test('captures approval workflows list and create wizard', async ({ page }) => {
    await page.goto(APPROVAL_WORKFLOWS_PATH);
    await waitForPageReady(page);

    await expect(page.getByRole('heading', { name: 'Approval workflows' })).toBeVisible();
    const createLink = page.getByRole('link', { name: 'Create workflow' });
    await expect(createLink).toBeVisible();

    await captureDocsScreenshot(page, 'administrators/workflows/approval-workflows-list.png');

    await createLink.click();
    await waitForPageReady(page);
    await expect(page.getByRole('heading', { name: /create.*workflow/i })).toBeVisible({
      timeout: 30_000
    });

    await captureDocsScreenshot(page, 'administrators/workflows/approval-workflows-create.png');
  });
});
