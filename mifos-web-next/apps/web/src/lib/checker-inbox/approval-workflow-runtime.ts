import 'server-only';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { ApprovalWorkflowRuntimeContext } from '@/lib/checker-inbox/approval-workflow-match';
import { ENABLE_APPROVAL_WORKFLOWS_CONFIG_NAME } from '@/lib/fineract/approval-workflow-paths';
import { listWorkflowDefinitions } from '@/lib/fineract/approval-workflows';
import { getGlobalConfigurationByName } from '@/lib/fineract/global-configurations';
import { listMakerCheckerPermissions } from '@/lib/fineract/maker-checker-permissions';

export async function loadApprovalWorkflowRuntimeContext(): Promise<ApprovalWorkflowRuntimeContext> {
  const [configuration, activeDefinitions, makerCheckerPermissions] = await Promise.all([
    getGlobalConfigurationByName(ENABLE_APPROVAL_WORKFLOWS_CONFIG_NAME),
    listWorkflowDefinitions({ status: 'ACTIVE' }).catch(() => []),
    listMakerCheckerPermissions().catch(() => [])
  ]);

  return {
    workflowsEnabled: configuration?.enabled === true,
    activeDefinitions,
    makerCheckerPermissions
  };
}
