/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { test as setup } from '@playwright/test';
import { loginThroughUi, saveAuthStorage, seedServerCatalog } from './helpers/auth';
import { createFineractE2eClient } from './helpers/fineract-api';

setup('prepare Fineract and sign in', async ({ page, context, baseURL }) => {
  const fineract = await createFineractE2eClient();
  await fineract.setApprovalWorkflowsEnabled(true);
  await fineract.cleanupE2eWorkflows();

  await seedServerCatalog(context, baseURL ?? 'http://127.0.0.1:3000');
  await loginThroughUi(page);
  await saveAuthStorage(page);
});
