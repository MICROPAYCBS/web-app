/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export const E2E_FINERACT_API_URL =
  process.env.FINERACT_API_URL ?? 'https://localhost:8443/fineract-provider/api/v1';
export const E2E_FINERACT_TENANT_ID = process.env.FINERACT_TENANT_ID ?? 'default';
export const E2E_USERNAME = process.env.E2E_USERNAME ?? 'mifos';
export const E2E_PASSWORD = process.env.E2E_PASSWORD ?? 'password';
export const E2E_WORKFLOW_NAME_PREFIX = 'E2E ';

export const APPROVAL_WORKFLOWS_PATH = '/system/approval-workflows';

export function e2eWorkflowName(label: string, runSuffix: string) {
  return `${E2E_WORKFLOW_NAME_PREFIX}${label} ${runSuffix}`;
}
