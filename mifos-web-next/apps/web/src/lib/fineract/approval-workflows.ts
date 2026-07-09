import 'server-only';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  WorkflowApprovalAction,
  WorkflowDefinition,
  WorkflowDefinitionStatus,
  WorkflowDefinitionWritePayload,
  WorkflowExpiryPeriodUnit,
  WorkflowRejectionPolicy,
  WorkflowStage,
  WorkflowStageType,
  WorkflowTransition,
  FineractCommandProcessingResult
} from '@mifos/api-client';
import { createFineractClient } from '@/lib/fineract/create-client';

const WORKFLOW_DEFINITIONS_PATH = '/workflow-definitions';

function parseWorkflowAction(value: unknown): WorkflowApprovalAction | null {
  if (value === 'APPROVE' || value === 'REJECT' || value === 'RETURN' || value === 'ESCALATE') {
    return value;
  }
  return null;
}

function parseWorkflowStage(raw: unknown): WorkflowStage | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  const stageCode = typeof row.stageCode === 'string' ? row.stageCode : '';
  const stageType = row.stageType;
  const requiredApprovals = Number(row.requiredApprovals);
  if (!stageCode || !Number.isFinite(requiredApprovals)) {
    return null;
  }
  if (stageType !== 'REVIEW' && stageType !== 'APPROVAL' && stageType !== 'VERIFICATION') {
    return null;
  }

  const actions = Array.isArray(row.actions)
    ? row.actions
        .map((item) => parseWorkflowAction(item))
        .filter((item): item is WorkflowApprovalAction => item !== null)
    : [];

  const rejectionPolicy = row.rejectionPolicy;
  const expiryPeriodUnit = row.expiryPeriodUnit;

  return {
    id: Number.isFinite(Number(row.id)) ? Number(row.id) : undefined,
    stageCode,
    name: typeof row.name === 'string' ? row.name : undefined,
    stageType: stageType as WorkflowStageType,
    requiredApprovals,
    rejectionPolicy:
      rejectionPolicy === 'ANY' || rejectionPolicy === 'ALL' || rejectionPolicy === 'THRESHOLD'
        ? (rejectionPolicy as WorkflowRejectionPolicy)
        : null,
    rejectionThreshold:
      row.rejectionThreshold == null ? null : Number(row.rejectionThreshold),
    expiryPeriodUnit:
      expiryPeriodUnit === 'HOURS' || expiryPeriodUnit === 'DAYS'
        ? (expiryPeriodUnit as WorkflowExpiryPeriodUnit)
        : null,
    expiryPeriodValue: row.expiryPeriodValue == null ? null : Number(row.expiryPeriodValue),
    escalationEnabled: row.escalationEnabled === true,
    escalationTargetStageCode:
      typeof row.escalationTargetStageCode === 'string' ? row.escalationTargetStageCode : null,
    allowCrossBranchAccess: row.allowCrossBranchAccess === true,
    requireDistinctApprover: row.requireDistinctApprover !== false,
    approvalLimitAmount:
      row.approvalLimitAmount == null ? null : Number(row.approvalLimitAmount),
    approvalLimitCurrency:
      typeof row.approvalLimitCurrency === 'string' ? row.approvalLimitCurrency : null,
    actions
  };
}

function parseWorkflowTransition(raw: unknown): WorkflowTransition | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  const fromStageCode = typeof row.fromStageCode === 'string' ? row.fromStageCode : '';
  const toStageCode = typeof row.toStageCode === 'string' ? row.toStageCode : '';
  const sequenceNo = Number(row.sequenceNo);
  if (!fromStageCode || !toStageCode || !Number.isFinite(sequenceNo)) {
    return null;
  }
  return {
    id: Number.isFinite(Number(row.id)) ? Number(row.id) : undefined,
    fromStageCode,
    toStageCode,
    sequenceNo,
    minAmount: row.minAmount == null ? null : Number(row.minAmount),
    maxAmount: row.maxAmount == null ? null : Number(row.maxAmount)
  };
}

function parseWorkflowDefinition(raw: unknown): WorkflowDefinition | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  const id = Number(row.id);
  const taskPermissionCode =
    typeof row.taskPermissionCode === 'string' ? row.taskPermissionCode.trim() : '';
  const name = typeof row.name === 'string' ? row.name : '';
  const status = row.status;
  if (!Number.isFinite(id) || !taskPermissionCode || !name) {
    return null;
  }
  if (status !== 'DRAFT' && status !== 'ACTIVE' && status !== 'INACTIVE') {
    return null;
  }

  const stages = Array.isArray(row.stages)
    ? row.stages
        .map((item) => parseWorkflowStage(item))
        .filter((item): item is WorkflowStage => item !== null)
    : [];

  const transitions = Array.isArray(row.transitions)
    ? row.transitions
        .map((item) => parseWorkflowTransition(item))
        .filter((item): item is WorkflowTransition => item !== null)
        .sort((left, right) => left.sequenceNo - right.sequenceNo)
    : [];

  return {
    id,
    taskPermissionCode,
    name,
    description: typeof row.description === 'string' ? row.description : undefined,
    status: status as WorkflowDefinitionStatus,
    priority: row.priority == null ? null : Number(row.priority),
    currencyCode: typeof row.currencyCode === 'string' ? row.currencyCode : null,
    minAmount: row.minAmount == null ? null : Number(row.minAmount),
    maxAmount: row.maxAmount == null ? null : Number(row.maxAmount),
    stages,
    transitions
  };
}

export async function listWorkflowDefinitions(filters?: {
  taskPermissionCode?: string;
  status?: WorkflowDefinitionStatus;
}): Promise<WorkflowDefinition[]> {
  const fineract = await createFineractClient();
  const params = new URLSearchParams();
  if (filters?.taskPermissionCode?.trim()) {
    params.set('taskPermissionCode', filters.taskPermissionCode.trim());
  }
  if (filters?.status) {
    params.set('status', filters.status);
  }
  const query = params.toString();
  const raw = await fineract.get<unknown[]>(
    query ? `${WORKFLOW_DEFINITIONS_PATH}?${query}` : WORKFLOW_DEFINITIONS_PATH
  );
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw
    .map((item) => parseWorkflowDefinition(item))
    .filter((item): item is WorkflowDefinition => item !== null);
}

export async function getWorkflowDefinition(
  definitionId: number
): Promise<WorkflowDefinition | null> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(`${WORKFLOW_DEFINITIONS_PATH}/${definitionId}`);
  return parseWorkflowDefinition(raw);
}

export async function createWorkflowDefinition(
  payload: WorkflowDefinitionWritePayload
): Promise<FineractCommandProcessingResult> {
  const fineract = await createFineractClient();
  return fineract.post<FineractCommandProcessingResult>(WORKFLOW_DEFINITIONS_PATH, payload);
}

export async function updateWorkflowDefinition(
  definitionId: number,
  payload: WorkflowDefinitionWritePayload
): Promise<FineractCommandProcessingResult> {
  const fineract = await createFineractClient();
  return fineract.put<FineractCommandProcessingResult>(
    `${WORKFLOW_DEFINITIONS_PATH}/${definitionId}`,
    payload
  );
}

export async function activateWorkflowDefinition(
  definitionId: number
): Promise<FineractCommandProcessingResult> {
  const fineract = await createFineractClient();
  return fineract.post<FineractCommandProcessingResult>(
    `${WORKFLOW_DEFINITIONS_PATH}/${definitionId}?command=activate`,
    null
  );
}

export async function deactivateWorkflowDefinition(
  definitionId: number
): Promise<FineractCommandProcessingResult> {
  const fineract = await createFineractClient();
  return fineract.post<FineractCommandProcessingResult>(
    `${WORKFLOW_DEFINITIONS_PATH}/${definitionId}?command=deactivate`,
    null
  );
}

export async function deleteWorkflowDefinition(
  definitionId: number
): Promise<FineractCommandProcessingResult> {
  const fineract = await createFineractClient();
  return fineract.delete<FineractCommandProcessingResult>(
    `${WORKFLOW_DEFINITIONS_PATH}/${definitionId}`
  );
}
