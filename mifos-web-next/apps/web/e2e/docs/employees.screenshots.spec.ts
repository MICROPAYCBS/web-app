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

const EMPLOYEES_PATH = '/organization/employees';

test.describe('Docs screenshots — employees', () => {
  test('captures employees list and create sheet', async ({ page }) => {
    await page.goto(EMPLOYEES_PATH);
    await waitForPageReady(page);

    await expect(page.getByRole('heading', { name: 'Employees' })).toBeVisible();
    const createLink = page.getByRole('link', { name: 'Create employee' });
    await expect(createLink).toBeVisible();

    await captureDocsScreenshot(page, 'administrators/organization/employees-list.png');

    await createLink.click();
    await expect(page.locator('[data-slot="sheet-title"]')).toHaveText('Create employee', {
      timeout: 30_000
    });

    await captureDocsScreenshot(page, 'administrators/organization/employees-create.png');
  });
});
