/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { test } from '@playwright/test';
import { captureDepositProductWizard } from '../helpers/deposit-product-docs';

test.describe('Docs screenshots — recurring deposit products', () => {
  test('captures the create wizard', async ({ page }) => {
    test.setTimeout(300_000);
    await captureDepositProductWizard(page, {
      path: '/products/recurring-deposit-products',
      listHeading: 'Recurring deposit products',
      createLinkName: 'Create recurring deposit product',
      createHeading: 'Create recurring deposit product',
      name: 'Monthly saver',
      shortName: 'SAVE',
      description: 'Regular installments held for a fixed term.',
      filePrefix: 'recurring-deposit-products',
      captureSharedBranches: false
    });
  });
});
