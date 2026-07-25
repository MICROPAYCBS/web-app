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

const OFFICES_PATH = '/organization/offices';

test.describe('Docs screenshots — offices (branches)', () => {
  test('captures offices list and create form', async ({ page }) => {
    await page.goto(OFFICES_PATH);
    await waitForPageReady(page);

    await expect(page.getByRole('heading', { name: 'Branches' })).toBeVisible();
    const createLink = page.getByRole('link', { name: /create branch/i });
    await expect(createLink).toBeVisible();

    await captureDocsScreenshot(page, 'administrators/organization/offices-list.png');

    await createLink.click();
    await expect(page).toHaveURL(/[?&]create=1\b/);

    await expect(page.locator('[data-slot="sheet-title"]')).toHaveText('Create branch', {
      timeout: 30_000
    });
    await expect(page.getByLabel(/branch name/i)).toBeVisible();

    const parentTrigger = page.getByRole('combobox', { name: /parent branch/i });
    if (await parentTrigger.isVisible().catch(() => false)) {
      await parentTrigger.click();
      const option = page.getByRole('option').first();
      if (await option.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await option.click();
      } else {
        const item = page.locator('[cmdk-item]').first();
        if (await item.isVisible().catch(() => false)) {
          await item.click();
        } else {
          await page.keyboard.press('Escape');
        }
      }
    }

    await captureDocsScreenshot(page, 'administrators/organization/create-office-form.png');
  });
});
