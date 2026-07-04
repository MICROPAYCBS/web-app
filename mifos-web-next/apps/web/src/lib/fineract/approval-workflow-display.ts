/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  FineractRolePermissionUsage,
  WorkflowDefinition,
  WorkflowDefinitionStatus,
  WorkflowStage,
  WorkflowTransition
} from '@mifos/api-client';
import type { UpsertWorkflowDefinitionInput } from '@mifos/validation';
import { formatMoney } from '@mifos/domain';
import { FINERACT_LOCALE } from '@/lib/fineract/dates';
import { formatPermissionCode, formatRoleGroupingName } from '@/lib/fineract/role-display';

export const CONFIGURE_MC_TASKS_PATH = '/system/configure-mc-tasks';

export function workflowDefinitionStatusLabel(status: WorkflowDefinitionStatus): string {
  switch (status) {
    case 'DRAFT':
      return 'Draft';
    case 'ACTIVE':
      return 'Active';
    case 'INACTIVE':
      return 'Inactive';
    default:
      return status;
  }
}

export function workflowDefinitionStatusVariant(
  status: WorkflowDefinitionStatus
): 'default' | 'secondary' | 'outline' | 'destructive' {
  switch (status) {
    case 'ACTIVE':
      return 'default';
    case 'DRAFT':
      return 'secondary';
    case 'INACTIVE':
      return 'outline';
    default:
      return 'secondary';
  }
}

function formatCriteriaAmount(amount: number, currencyCode: string): string {
  return formatMoney(amount, currencyCode, FINERACT_LOCALE) ?? String(amount);
}

export function workflowSelectionCriteriaSummary(definition: Pick<
  WorkflowDefinition,
  'currencyCode' | 'minAmount' | 'maxAmount'
>): string {
  const currency = definition.currencyCode?.trim();
  const min = definition.minAmount;
  const max = definition.maxAmount;

  if (min == null && max == null) {
    return 'Default';
  }

  if (!currency) {
    if (min != null && max != null) {
      return `${min.toLocaleString()}–${max.toLocaleString()}`;
    }
    if (min != null) {
      return `≥ ${min.toLocaleString()}`;
    }
    return `≤ ${max?.toLocaleString()}`;
  }

  if (min != null && max != null) {
    return `${formatCriteriaAmount(min, currency)}–${formatCriteriaAmount(max, currency)}`;
  }
  if (min != null) {
    return `≥ ${formatCriteriaAmount(min, currency)}`;
  }
  return `≤ ${formatCriteriaAmount(max as number, currency)}`;
}

export function orderedWorkflowStages(
  stages: WorkflowStage[],
  transitions: WorkflowTransition[]
): WorkflowStage[] {
  if (!stages.length) {
    return [];
  }

  const byCode = new Map(stages.map((stage) => [stage.stageCode, stage]));
  const toCodes = new Set(transitions.map((transition) => transition.toStageCode));
  const entry = stages.find((stage) => !toCodes.has(stage.stageCode)) ?? stages[0];
  const ordered: WorkflowStage[] = [entry];
  let currentCode = entry.stageCode;
  const sortedTransitions = [...transitions].sort((left, right) => left.sequenceNo - right.sequenceNo);

  while (true) {
    const nextTransition = sortedTransitions.find(
      (transition) => transition.fromStageCode === currentCode
    );
    if (!nextTransition) {
      break;
    }
    const nextStage = byCode.get(nextTransition.toStageCode);
    if (!nextStage || ordered.some((stage) => stage.stageCode === nextStage.stageCode)) {
      break;
    }
    ordered.push(nextStage);
    currentCode = nextStage.stageCode;
  }

  for (const stage of stages) {
    if (!ordered.some((item) => item.stageCode === stage.stageCode)) {
      ordered.push(stage);
    }
  }

  return ordered;
}

export function transitionAmountBandSummary(
  transition: WorkflowTransition,
  currencyCode?: string | null
): string | null {
  if (transition.minAmount == null && transition.maxAmount == null) {
    return null;
  }

  const currency = currencyCode?.trim() || 'USD';
  if (transition.minAmount != null && transition.maxAmount != null) {
    return `${formatCriteriaAmount(transition.minAmount, currency)}–${formatCriteriaAmount(transition.maxAmount, currency)}`;
  }
  if (transition.minAmount != null) {
    return `≥ ${formatCriteriaAmount(transition.minAmount, currency)}`;
  }
  return `≤ ${formatCriteriaAmount(transition.maxAmount as number, currency)}`;
}

export function findWorkflowTaskPermission(
  permissions: FineractRolePermissionUsage[],
  taskPermissionCode: string
): FineractRolePermissionUsage | undefined {
  const normalized = taskPermissionCode.trim();
  return permissions.find((permission) => permission.code === normalized);
}

export function formatWorkflowTaskSubtitle(permission: FineractRolePermissionUsage): string | null {
  const parts = [permission.entityName, permission.actionName].filter(Boolean);
  return parts.length > 0 ? parts.join(' · ') : null;
}

export function formatWorkflowTaskOptionLabel(permission: FineractRolePermissionUsage): string {
  const subtitle = formatWorkflowTaskSubtitle(permission);
  const readable = formatPermissionCode(permission.code, permission.grouping);
  if (subtitle) {
    return `${permission.code} — ${subtitle}`;
  }
  if (readable !== permission.code) {
    return `${permission.code} — ${readable}`;
  }
  return permission.code;
}

export function workflowTaskPermissionSelectOptions(
  permissions: FineractRolePermissionUsage[]
): Array<{ value: string; label: string; keywords?: string[] }> {
  return [...permissions]
    .sort((left, right) => {
      const groupCompare = formatRoleGroupingName(left.grouping).localeCompare(
        formatRoleGroupingName(right.grouping)
      );
      return groupCompare !== 0 ? groupCompare : left.code.localeCompare(right.code);
    })
    .map((permission) => ({
      value: permission.code,
      label: formatWorkflowTaskOptionLabel(permission),
      keywords: [
        permission.code,
        permission.entityName,
        permission.actionName,
        permission.grouping,
        formatRoleGroupingName(permission.grouping),
        formatPermissionCode(permission.code, permission.grouping)
      ].filter((value): value is string => Boolean(value?.trim()))
    }));
}

export function formatWorkflowTaskDisplay(
  taskPermissionCode: string,
  permissions?: FineractRolePermissionUsage[]
): { code: string; subtitle?: string; makerCheckerEnabled?: boolean } {
  const match = permissions?.length
    ? findWorkflowTaskPermission(permissions, taskPermissionCode)
    : undefined;

  return {
    code: taskPermissionCode,
    subtitle: match ? formatWorkflowTaskSubtitle(match) ?? undefined : undefined,
    makerCheckerEnabled: match?.selected
  };
}

export function isWorkflowActivationMcDisabledError(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes('task.not.maker.checker.enabled') ||
    (normalized.includes('maker-checker') && normalized.includes('not enabled'))
  );
}

export function defaultWorkflowDefinitionFormValues(
  preferredTaskPermissionCode?: string
): UpsertWorkflowDefinitionInput {
  return {
    taskPermissionCode: preferredTaskPermissionCode?.trim() || '',
    name: '',
    description: '',
    priority: 10,
    currencyCode: null,
    minAmount: null,
    maxAmount: null,
    stages: [
      {
        stageCode: 'STAGE_1',
        name: '',
        stageType: 'APPROVAL',
        requiredApprovals: 1,
        rejectionPolicy: 'ANY',
        rejectionThreshold: null,
        expiryPeriodUnit: null,
        expiryPeriodValue: null,
        escalationEnabled: false,
        escalationTargetStageCode: null,
        allowCrossBranchAccess: false,
        requireDistinctApprover: true,
        actions: ['APPROVE', 'REJECT'],
        participants: [{ roleId: 0, approvalLimitAmount: null, approvalLimitCurrency: null }]
      }
    ],
    transitions: []
  };
}

export function workflowDefinitionToFormValues(
  definition: WorkflowDefinition
): UpsertWorkflowDefinitionInput {
  return {
    taskPermissionCode: definition.taskPermissionCode,
    name: definition.name,
    description: definition.description ?? '',
    priority: definition.priority ?? null,
    currencyCode: definition.currencyCode ?? null,
    minAmount: definition.minAmount ?? null,
    maxAmount: definition.maxAmount ?? null,
    stages: definition.stages.map((stage) => ({
      stageCode: stage.stageCode,
      name: stage.name ?? '',
      stageType: stage.stageType,
      requiredApprovals: stage.requiredApprovals,
      rejectionPolicy: stage.rejectionPolicy ?? 'ANY',
      rejectionThreshold: stage.rejectionThreshold ?? null,
      expiryPeriodUnit: stage.expiryPeriodUnit ?? null,
      expiryPeriodValue: stage.expiryPeriodValue ?? null,
      escalationEnabled: stage.escalationEnabled ?? false,
      escalationTargetStageCode: stage.escalationTargetStageCode ?? null,
      allowCrossBranchAccess: stage.allowCrossBranchAccess ?? false,
      requireDistinctApprover: stage.requireDistinctApprover ?? true,
      actions: stage.actions.length ? stage.actions : ['APPROVE'],
      participants: stage.participants.map((participant) => ({
        roleId: participant.roleId,
        approvalLimitAmount: participant.approvalLimitAmount ?? null,
        approvalLimitCurrency: participant.approvalLimitCurrency ?? null
      }))
    })),
    transitions: definition.transitions.map((transition) => ({
      fromStageCode: transition.fromStageCode,
      toStageCode: transition.toStageCode,
      sequenceNo: transition.sequenceNo,
      minAmount: transition.minAmount ?? null,
      maxAmount: transition.maxAmount ?? null
    }))
  };
}

export function formatWorkflowExpiry(stage: WorkflowStage): string | null {
  if (!stage.expiryPeriodUnit || stage.expiryPeriodValue == null) {
    return null;
  }
  const unit = stage.expiryPeriodUnit === 'HOURS' ? 'hours' : 'days';
  return `${stage.expiryPeriodValue} ${unit}`;
}
