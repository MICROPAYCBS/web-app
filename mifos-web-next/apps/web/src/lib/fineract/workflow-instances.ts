import 'server-only';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { WorkflowInstance, WorkflowInstanceStatus } from '@mifos/api-client';
import { FineractHttpError } from '@mifos/api-client';
import { createFineractClient } from '@/lib/fineract/create-client';

const WORKFLOW_INSTANCES_PATH = '/workflow-instances';

function parseWorkflowInstanceStatus(value: unknown): WorkflowInstanceStatus | null {
  if (
    value === 'IN_PROGRESS' ||
    value === 'COMPLETED' ||
    value === 'REJECTED' ||
    value === 'RETURNED'
  ) {
    return value;
  }
  return null;
}

function parseWorkflowInstance(raw: unknown): WorkflowInstance | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  const id = Number(row.id);
  const commandSourceId = Number(row.commandSourceId);
  const workflowDefinitionId = Number(row.workflowDefinitionId);
  const taskPermissionCode =
    typeof row.taskPermissionCode === 'string' ? row.taskPermissionCode.trim() : '';
  const currentStageCode =
    typeof row.currentStageCode === 'string' ? row.currentStageCode.trim() : '';
  const status = parseWorkflowInstanceStatus(row.status);
  if (
    !Number.isFinite(id) ||
    !Number.isFinite(commandSourceId) ||
    !Number.isFinite(workflowDefinitionId) ||
    !taskPermissionCode ||
    !currentStageCode ||
    !status
  ) {
    return null;
  }

  return {
    id,
    commandSourceId,
    workflowDefinitionId,
    taskPermissionCode,
    currentStageCode,
    status,
    transactionAmount:
      row.transactionAmount == null ? null : Number(row.transactionAmount),
    currencyCode: typeof row.currencyCode === 'string' ? row.currencyCode : null
  };
}

function isMissingWorkflowInstanceError(error: unknown): boolean {
  if (!(error instanceof FineractHttpError)) {
    return false;
  }
  if (error.status === 404) {
    return true;
  }
  const message = error.message.toLowerCase();
  return message.includes('not found') || message.includes('does not exist');
}

/** Runtime workflow state for a held maker-checker command, when the workflow module is enabled. */
export async function getWorkflowInstanceByCommandSourceId(
  commandSourceId: number
): Promise<WorkflowInstance | null> {
  if (!Number.isFinite(commandSourceId)) {
    return null;
  }

  const fineract = await createFineractClient();
  try {
    const raw = await fineract.get<unknown>(
      `${WORKFLOW_INSTANCES_PATH}/by-command/${commandSourceId}`
    );
    return parseWorkflowInstance(raw);
  } catch (error) {
    if (isMissingWorkflowInstanceError(error)) {
      return null;
    }
    throw error;
  }
}
