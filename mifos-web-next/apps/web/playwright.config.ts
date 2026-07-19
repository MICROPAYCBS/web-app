/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { defineConfig, devices } from '@playwright/test';
import path from 'node:path';

const FINERACT_API_URL =
  process.env.FINERACT_API_URL ?? 'https://localhost:8443/fineract-provider/api/v1';
const FINERACT_TENANT_ID = process.env.FINERACT_TENANT_ID ?? 'default';
const E2E_BASE_URL = process.env.E2E_BASE_URL ?? 'http://127.0.0.1:3000';

const FINERACT_SERVERS = JSON.stringify([
  {
    id: 'local-e2e',
    name: 'Local Fineract',
    baseUrl: FINERACT_API_URL,
    tenantId: FINERACT_TENANT_ID
  }
]);

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  timeout: 120_000,
  expect: { timeout: 20_000 },
  use: {
    baseURL: E2E_BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure'
  },
  projects: [
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/
    },
    {
      name: 'chromium',
      testMatch: /.*\.spec\.ts/,
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: path.join(__dirname, 'e2e', '.auth', 'session.json')
      }
    }
  ],
  webServer: process.env.E2E_SKIP_WEB_SERVER
    ? undefined
    : {
        command: 'pnpm dev',
        url: E2E_BASE_URL,
        reuseExistingServer: process.env.E2E_REUSE_DEV_SERVER === '1',
        timeout: 180_000,
        cwd: __dirname,
        env: {
          ...process.env,
          NODE_ENV: 'development',
          FINERACT_SERVERS
        }
      }
});
