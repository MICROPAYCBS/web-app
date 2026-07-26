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

const JOURNAL_ENTRIES_PATH = '/accounting/journal-entries';

test.describe('Docs screenshots — journal entries', () => {
  test('captures journal entries list and create form', async ({ page }) => {
    await page.goto(JOURNAL_ENTRIES_PATH);
    await waitForPageReady(page);

    await expect(page.getByRole('heading', { name: 'Journal entries' })).toBeVisible();
    const createLink = page.getByRole('link', { name: 'Create entry' });
    await expect(createLink).toBeVisible();

    await captureDocsScreenshot(page, 'administrators/accounting/journal-entries-list.png');

    await page.goto(`${JOURNAL_ENTRIES_PATH}/create`);
    await waitForPageReady(page);
    await expect(page.getByRole('heading', { name: 'Create journal entry' })).toBeVisible({
      timeout: 30_000
    });

    await captureDocsScreenshot(page, 'administrators/accounting/journal-entries-create.png');
  });
});
