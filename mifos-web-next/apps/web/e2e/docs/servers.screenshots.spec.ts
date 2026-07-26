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

test.describe('Docs screenshots — servers', () => {
  test('captures configured servers and the add-server form', async ({ page }) => {
    await page.goto('/settings/servers');
    await waitForPageReady(page);

    await expect(page.getByRole('heading', { name: 'Servers', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Configured servers', exact: true })).toBeVisible();

    await captureDocsScreenshot(page, 'administrators/setup/servers-list.png');

    await page.getByRole('heading', { name: 'Add server', exact: true }).scrollIntoViewIfNeeded();
    await expect(page.getByRole('heading', { name: 'Add server', exact: true })).toBeVisible();

    await captureDocsScreenshot(page, 'administrators/setup/servers-add-form.png');
  });
});
