/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { expect, type Locator, type Page } from '@playwright/test';

export async function waitForPageReady(page: Page) {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle');
}

export async function clickWhenReady(locator: Locator) {
  const page = locator.page();
  await waitForPageReady(page);
  await expect(locator).toBeVisible();
  await expect(locator).toBeEnabled();
  await locator.scrollIntoViewIfNeeded();
  await locator.click();
}
