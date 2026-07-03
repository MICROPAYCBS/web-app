/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { BrowserContext, Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import {
  E2E_FINERACT_API_URL,
  E2E_FINERACT_TENANT_ID,
  E2E_PASSWORD,
  E2E_USERNAME
} from './env';

const AUTH_DIR = path.join(__dirname, '..', '.auth');
export const AUTH_STORAGE_PATH = path.join(AUTH_DIR, 'session.json');
const SERVER_CATALOG_COOKIE = 'mifos-server-catalog';

export async function seedServerCatalog(context: BrowserContext, baseURL: string) {
  const catalog = {
    servers: [
      {
        id: 'local-e2e',
        name: 'Local Fineract',
        baseUrl: E2E_FINERACT_API_URL,
        tenantId: E2E_FINERACT_TENANT_ID
      }
    ],
    activeServerId: 'local-e2e'
  };

  await context.addCookies([
    {
      name: SERVER_CATALOG_COOKIE,
      value: JSON.stringify(catalog),
      url: baseURL,
      httpOnly: true,
      sameSite: 'Lax'
    }
  ]);
}

export async function loginThroughUi(page: Page) {
  await page.goto('/login');
  await page.waitForLoadState('domcontentloaded');
  await page.getByLabel('Username').waitFor({ state: 'visible', timeout: 30_000 });

  const loginResult = await page.evaluate(
    async ({ username, password }) => {
      const formData = new FormData();
      formData.set('username', username);
      formData.set('password', password);
      formData.set('redirectTo', '/');
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        body: formData,
        credentials: 'same-origin',
        headers: { Accept: 'application/json' }
      });
      const body = (await response.json().catch(() => null)) as
        | { ok: true; redirectTo: string }
        | { ok: false; message?: string }
        | null;
      return { status: response.status, body };
    },
    { username: E2E_USERNAME, password: E2E_PASSWORD }
  );

  if (loginResult.status !== 200 || !loginResult.body || loginResult.body.ok !== true) {
    const message =
      loginResult.body && 'message' in loginResult.body
        ? loginResult.body.message
        : `HTTP ${loginResult.status}`;
    throw new Error(`Sign-in failed: ${message}`);
  }

  await page.goto(loginResult.body.redirectTo || '/');
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 30_000 });
}

export async function saveAuthStorage(page: Page) {
  fs.mkdirSync(AUTH_DIR, { recursive: true });
  await page.context().storageState({ path: AUTH_STORAGE_PATH });
}
