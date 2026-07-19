/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  FineractRolePermissionUsage,
  WorkflowDefinition
} from '@mifos/api-client';
import type { CheckerInboxMatchedWorkflow } from '@/lib/checker-inbox/checker-inbox-item-types';

export type ApprovalWorkflowRuntimeContext = {
  workflowsEnabled: boolean;
  activeDefinitions: WorkflowDefinition[];
  makerCheckerPermissions: FineractRolePermissionUsage[];
};

function normalizePermissionToken(value?: string): string {
  return value?.trim().toUpperCase().replace(/\s+/g, '') ?? '';
}

/** Map a queued maker-checker row to its Fineract permission code (e.g. CREATE_LOAN). */
export function resolveMakerCheckerTaskPermissionCode(
  permissions: FineractRolePermissionUsage[],
  actionName?: string,
  entityName?: string
): string | undefined {
  const action = normalizePermissionToken(actionName);
  const entity = normalizePermissionToken(entityName);
  if (!action || !entity) {
    return undefined;
  }

  const direct = permissions.find(
    (permission) =>
      normalizePermissionToken(permission.actionName) === action &&
      normalizePermissionToken(permission.entityName) === entity
  );
  if (direct) {
    return direct.code;
  }

  const conventional = `${action}_${entity}`;
  if (permissions.some((permission) => permission.code === conventional)) {
    return conventional;
  }

  return undefined;
}

/** Highest-priority ACTIVE definition for the task (amount criteria removed). */
export function selectApprovalWorkflowDefinition(
  definitions: WorkflowDefinition[],
  taskPermissionCode: string,
  workflowsEnabled: boolean
): WorkflowDefinition | undefined {
  if (!workflowsEnabled) {
    return undefined;
  }

  return definitions
    .filter(
      (definition) =>
        definition.status === 'ACTIVE' && definition.taskPermissionCode === taskPermissionCode
    )
    .sort((left, right) => (right.priority ?? 0) - (left.priority ?? 0))[0];
}

export function matchApprovalWorkflowForCheckerItem(
  options: {
    actionName?: string;
    entityName?: string;
  },
  runtime: ApprovalWorkflowRuntimeContext
): CheckerInboxMatchedWorkflow | undefined {
  const taskPermissionCode = resolveMakerCheckerTaskPermissionCode(
    runtime.makerCheckerPermissions,
    options.actionName,
    options.entityName
  );
  if (!taskPermissionCode) {
    return undefined;
  }

  const definition = selectApprovalWorkflowDefinition(
    runtime.activeDefinitions,
    taskPermissionCode,
    runtime.workflowsEnabled
  );
  if (!definition) {
    return undefined;
  }

  return {
    definition,
    taskPermissionCode
  };
}
