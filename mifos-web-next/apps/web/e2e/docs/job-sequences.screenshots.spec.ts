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

const JOB_SEQUENCES_PATH = '/system/job-sequences';

test.describe('Docs screenshots — job sequences', () => {
  test('captures job sequences list and create form', async ({ page }) => {
    await page.goto(JOB_SEQUENCES_PATH);
    await waitForPageReady(page);

    await expect(page.getByRole('heading', { name: 'Job sequences' })).toBeVisible();
    const createLink = page.getByRole('link', { name: 'Create sequence' });
    await expect(createLink).toBeVisible();

    await captureDocsScreenshot(page, 'administrators/operations/job-sequences-list.png');

    await createLink.click();
    await waitForPageReady(page);
    await expect(page.getByRole('heading', { name: 'Create job sequence' })).toBeVisible({
      timeout: 30_000
    });

    await captureDocsScreenshot(page, 'administrators/operations/job-sequences-create.png');

    // Note: the run-detail view (Completed / Skipped step results) requires an actual
    // executed run and isn't captured here — it needs a sequence to be created and run
    // first. Capture that one manually until we have seed data for it.
  });
});
