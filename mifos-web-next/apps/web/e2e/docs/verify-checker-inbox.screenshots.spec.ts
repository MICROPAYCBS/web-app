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

const CHECKER_INBOX_PATH = '/checker-inbox-and-tasks';

test.describe('Docs screenshots — verify checker inbox', () => {
  test('captures the checker inbox screen', async ({ page }) => {
    await page.goto(CHECKER_INBOX_PATH);
    await waitForPageReady(page);

    await expect(page.getByRole('heading', { name: 'Pending tasks' })).toBeVisible();

    await captureDocsScreenshot(page, 'administrators/workflows/verify-checker-inbox.png');

    // Note: this captures whatever the inbox looks like right now (empty, or with
    // real pending items). The full maker -> checker -> approved-outcome walkthrough
    // needs two separate signed-in sessions (maker and checker), which this single
    // authenticated docs session can't simulate — that sequence stays a manual capture.
  });
});
