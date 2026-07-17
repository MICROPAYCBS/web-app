import 'server-only';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractAuditTrailListItem } from '@mifos/api-client';
import {
  matchApprovalWorkflowForCheckerItem,
  resolveMakerCheckerTaskPermissionCode,
  type ApprovalWorkflowRuntimeContext
} from '@/lib/checker-inbox/approval-workflow-match';
import type { CheckerInboxMatchedWorkflow } from '@/lib/checker-inbox/checker-inbox-item-types';
import { listPendingCheckerActionsForScope } from '@/lib/fineract/checker-inbox';
import {
  mergePendingCheckerActions,
  pendingCheckerActionsFromAudits
} from '@/lib/fineract/resource-pending-checker-filters';
import type {
  ResourcePendingCheckerAction,
  ResourcePendingCheckerScope
} from '@/lib/fineract/resource-pending-checker-display';
import { resolvePrimaryPendingCheckerAction } from '@/lib/fineract/resource-pending-checker-display';
import { getWorkflowInstanceByCommandSourceId } from '@/lib/fineract/workflow-instances';

export type ResourcePendingWorkflowContext = {
  approvalWorkflowsEnabled?: boolean;
  matchedWorkflow?: CheckerInboxMatchedWorkflow;
  unresolvedTaskPermissionCode?: string;
  workflowInstance?: Awaited<ReturnType<typeof getWorkflowInstanceByCommandSourceId>>;
};

export async function loadResourcePendingCheckerActions(
  scope: ResourcePendingCheckerScope,
  auditEntries: FineractAuditTrailListItem[] = []
): Promise<ResourcePendingCheckerAction[]> {
  const [inbox, audits] = await Promise.all([
    listPendingCheckerActionsForScope(scope),
    Promise.resolve(pendingCheckerActionsFromAudits(auditEntries, scope))
  ]);
  return mergePendingCheckerActions(inbox, audits);
}

export async function resolveResourcePendingWorkflowContext(
  actions: ResourcePendingCheckerAction[],
  scope: ResourcePendingCheckerScope,
  context: {
    status?: { code?: string; value?: string };
  },
  runtime: ApprovalWorkflowRuntimeContext
): Promise<ResourcePendingWorkflowContext | undefined> {
  if (actions.length === 0) {
    return runtime.workflowsEnabled ? { approvalWorkflowsEnabled: true } : undefined;
  }
  if (!runtime.workflowsEnabled) {
    return { approvalWorkflowsEnabled: true };
  }

  const workflowRows = await Promise.all(
    actions.map(async (action) => ({
      action,
      workflowInstance: await getWorkflowInstanceByCommandSourceId(action.id).catch(() => null)
    }))
  );

  const inProgressRow = workflowRows.find(
    (row) => row.workflowInstance?.status === 'IN_PROGRESS'
  );
  const action =
    inProgressRow?.action ??
    resolvePrimaryPendingCheckerAction(actions, scope.entityName, context.status) ??
    actions[0];
  const workflowInstance =
    inProgressRow?.workflowInstance ??
    workflowRows.find((row) => row.action.id === action?.id)?.workflowInstance ??
    null;

  if (!action) {
    return { approvalWorkflowsEnabled: true };
  }

  const matchedWorkflow = matchApprovalWorkflowForCheckerItem(
    {
      actionName: action.actionName,
      entityName: action.entityName ?? scope.entityName
    },
    runtime
  );

  if (matchedWorkflow) {
    return {
      approvalWorkflowsEnabled: true,
      matchedWorkflow,
      workflowInstance
    };
  }

  return {
    approvalWorkflowsEnabled: true,
    unresolvedTaskPermissionCode: resolveMakerCheckerTaskPermissionCode(
      runtime.makerCheckerPermissions,
      action.actionName,
      action.entityName ?? scope.entityName
    ),
    workflowInstance
  };
}
