/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import path from 'node:path';
import { test as setup } from '@playwright/test';
import { loginThroughUi, seedServerCatalog } from '../helpers/auth';

const DOCS_AUTH_FILE = path.join(__dirname, '..', '.auth', 'docs-session.json');

/**
 * Lightweight sign-in for docs screenshots — no approval-workflow API prep
 * (works against stock Fineract in docker-compose.e2e.yml).
 */
setup('sign in for docs screenshots', async ({ page, context, baseURL }) => {
  await seedServerCatalog(context, baseURL ?? 'http://127.0.0.1:3000');
  await loginThroughUi(page);
  await page.context().storageState({ path: DOCS_AUTH_FILE });
});
