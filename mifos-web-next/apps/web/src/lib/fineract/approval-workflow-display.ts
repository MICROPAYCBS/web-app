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
import type { UpsertWorkflowDefinitionInput, WorkflowStageInput, WorkflowTransitionInput } from '@mifos/validation';
import type { SelectOption } from '@/components/composites/select-field';
import { enumToSelectOptions } from '@/lib/form/select-options';
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

/** Linear stage chain: first → second → … (matches backend entry-stage rules). */
export function buildLinearWorkflowTransitions(
  stages: Pick<WorkflowStageInput, 'stageCode'>[]
): WorkflowTransitionInput[] {
  const stageCodes = stages.map((stage) => stage.stageCode.trim()).filter(Boolean);
  return stageCodes.slice(0, -1).map((fromStageCode, index) => ({
    fromStageCode,
    toStageCode: stageCodes[index + 1],
    sequenceNo: index + 1
  }));
}

export interface WorkflowChainBookend {
  title: string;
  subtitle: string;
  description: string;
}

export const WORKFLOW_MAKER_BOOKEND: WorkflowChainBookend = {
  title: 'Creation',
  subtitle: 'Maker',
  description: 'The maker submits the task for review.'
};

export const WORKFLOW_CHECKER_BOOKEND: WorkflowChainBookend = {
  title: 'Approval',
  subtitle: 'Checker',
  description: 'After all configured workflow stages, a checker completes the task in the inbox.'
};

export type WorkflowChainBookendPosition = 'start' | 'end';

export type WorkflowChainSegment<TStage extends Pick<WorkflowStage, 'stageCode'>> =
  | { kind: 'bookend'; position: WorkflowChainBookendPosition }
  | { kind: 'stage'; stage: TStage; index: number };

export function workflowChainBookend(position: WorkflowChainBookendPosition): WorkflowChainBookend {
  return position === 'start' ? WORKFLOW_MAKER_BOOKEND : WORKFLOW_CHECKER_BOOKEND;
}

export function buildWorkflowChain<TStage extends Pick<WorkflowStage, 'stageCode'>>(
  stages: TStage[],
  transitions: WorkflowTransition[] = []
): WorkflowChainSegment<TStage>[] {
  const orderedStages = stages.length
    ? (orderedWorkflowStages(
        stages as unknown as WorkflowStage[],
        transitions
      ) as unknown as TStage[])
    : [];

  const segments: WorkflowChainSegment<TStage>[] = [{ kind: 'bookend', position: 'start' }];

  orderedStages.forEach((stage, index) => {
    segments.push({ kind: 'stage', stage, index });
  });

  segments.push({ kind: 'bookend', position: 'end' });
  return segments;
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

function titleCaseAction(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return trimmed;
  }
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
}

function resolveWorkflowTaskActionBadge(
  permission: FineractRolePermissionUsage
): SelectOption['badge'] {
  const action =
    permission.actionName?.trim() ||
    permission.code.split('_')[0]?.trim() ||
    'Task';
  const text = titleCaseAction(action);
  const normalized = action.toUpperCase();

  if (normalized === 'DELETE' || normalized === 'REMOVE') {
    return { text, variant: 'destructive' };
  }
  if (normalized === 'CREATE' || normalized === 'ADD') {
    return { text, variant: 'secondary' };
  }
  return { text, variant: 'outline' };
}

export function formatWorkflowTaskPrimaryLabel(permission: FineractRolePermissionUsage): string {
  return formatPermissionCode(permission.code, permission.grouping);
}

export function formatWorkflowTaskOptionDescription(
  permission: FineractRolePermissionUsage
): string {
  const subtitle = formatWorkflowTaskSubtitle(permission);
  return subtitle ? `${permission.code} · ${subtitle}` : permission.code;
}

export function formatWorkflowTaskOptionLabel(permission: FineractRolePermissionUsage): string {
  const readable = formatWorkflowTaskPrimaryLabel(permission);
  const description = formatWorkflowTaskOptionDescription(permission);
  if (description !== permission.code) {
    return `${readable} — ${description}`;
  }
  return readable;
}

export const WORKFLOW_STAGE_TYPE_SELECT_OPTIONS = enumToSelectOptions([
  'REVIEW',
  'APPROVAL',
  'VERIFICATION'
] as const);

export const WORKFLOW_REJECTION_POLICY_SELECT_OPTIONS = enumToSelectOptions([
  'ANY',
  'ALL',
  'THRESHOLD'
] as const);

export const WORKFLOW_EXPIRY_UNIT_SELECT_OPTIONS = enumToSelectOptions(['HOURS', 'DAYS'] as const);

export function workflowStageCodeSelectOptions(
  stages: Array<Pick<WorkflowStageInput, 'stageCode' | 'name'>>,
  options?: { excludeStageCode?: string }
): SelectOption[] {
  return stages
    .filter((stage) => stage.stageCode !== options?.excludeStageCode)
    .map((stage) => ({
      value: stage.stageCode,
      label: stage.name?.trim() || stage.stageCode,
      keywords: [stage.stageCode, stage.name].filter(Boolean) as string[]
    }));
}

export function workflowTaskPermissionSimpleSelectOptions(
  permissions: FineractRolePermissionUsage[]
): SelectOption[] {
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

export function workflowTaskPermissionSelectOptions(
  permissions: FineractRolePermissionUsage[]
): SelectOption[] {
  return [...permissions]
    .sort((left, right) => {
      const groupCompare = formatRoleGroupingName(left.grouping).localeCompare(
        formatRoleGroupingName(right.grouping)
      );
      return groupCompare !== 0 ? groupCompare : left.code.localeCompare(right.code);
    })
    .map((permission) => ({
      value: permission.code,
      label: formatWorkflowTaskPrimaryLabel(permission),
      description: formatWorkflowTaskOptionDescription(permission),
      badge: resolveWorkflowTaskActionBadge(permission),
      keywords: [
        permission.code,
        permission.entityName,
        permission.actionName,
        permission.grouping,
        formatRoleGroupingName(permission.grouping),
        formatWorkflowTaskPrimaryLabel(permission),
        formatWorkflowTaskSubtitle(permission)
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

/** True when the institution-wide `maker-checker` global configuration is off. */
export function isWorkflowGlobalMakerCheckerDisabled(
  makerCheckerGloballyEnabled: boolean | null | undefined
): boolean {
  return makerCheckerGloballyEnabled === false;
}

/** True when maker-checker is not enabled for this task (and we have permissions data). */
export function isWorkflowTaskMakerCheckerDisabled(
  taskPermissionCode: string,
  permissions?: FineractRolePermissionUsage[]
): boolean {
  if (!permissions?.length || !taskPermissionCode.trim()) {
    return false;
  }
  const match = findWorkflowTaskPermission(permissions, taskPermissionCode);
  return match?.selected !== true;
}

export type WorkflowActivateBlockReason = 'global' | 'task';

/** Prefer the global gate; fall back to per-task maker-checker. */
export function getWorkflowActivateBlockReason(options: {
  makerCheckerGloballyEnabled?: boolean | null;
  taskPermissionCode?: string;
  taskPermissions?: FineractRolePermissionUsage[];
}): WorkflowActivateBlockReason | null {
  if (isWorkflowGlobalMakerCheckerDisabled(options.makerCheckerGloballyEnabled)) {
    return 'global';
  }
  if (
    options.taskPermissionCode &&
    isWorkflowTaskMakerCheckerDisabled(options.taskPermissionCode, options.taskPermissions)
  ) {
    return 'task';
  }
  return null;
}

export const WORKFLOW_ACTIVATE_GLOBAL_MC_DISABLED_HINT =
  'Maker-checker is off in global configurations. Enable it to activate workflows.';

export const WORKFLOW_ACTIVATE_MC_DISABLED_HINT =
  'Maker-checker is off for this task. Enable it to activate.';

export function workflowActivateBlockHint(reason: WorkflowActivateBlockReason | null): string | null {
  if (reason === 'global') {
    return WORKFLOW_ACTIVATE_GLOBAL_MC_DISABLED_HINT;
  }
  if (reason === 'task') {
    return WORKFLOW_ACTIVATE_MC_DISABLED_HINT;
  }
  return null;
}

export function isWorkflowActivationMcDisabledError(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes('task.not.maker.checker.enabled') ||
    (normalized.includes('maker-checker') && normalized.includes('not enabled'))
  );
}

/** PUT blocked while live instances still resolve stages from this definition. */
export function isWorkflowInProgressUpdateError(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes('cannot.be.updated.with.in.progress.instances') ||
    (normalized.includes('in_progress') && normalized.includes('updated')) ||
    (normalized.includes('in-progress') && normalized.includes('instance'))
  );
}

export const WORKFLOW_IN_PROGRESS_UPDATE_HINT =
  'Finish or reject open approvals for this workflow first. Deactivating stops new selections but does not clear in-flight instances.';

export function defaultWorkflowDefinitionFormValues(
  preferredTaskPermissionCode?: string
): UpsertWorkflowDefinitionInput {
  return {
    taskPermissionCode: preferredTaskPermissionCode?.trim() || '',
    name: '',
    description: '',
    priority: 10,
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
        roleId: null,
        actions: ['APPROVE', 'REJECT']
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
      roleId: stage.roleId ?? null,
      actions: stage.actions.length ? stage.actions : ['APPROVE']
    })),
    transitions: definition.transitions.map((transition) => ({
      fromStageCode: transition.fromStageCode,
      toStageCode: transition.toStageCode,
      sequenceNo: transition.sequenceNo
    }))
  };
}

/** Checker eligibility implied by the workflow task — not configured per stage. */
export function workflowStageCheckerPermissionCode(taskPermissionCode: string): string {
  const code = taskPermissionCode.trim();
  if (!code) {
    return '';
  }
  return code.endsWith('_CHECKER') ? code : `${code}_CHECKER`;
}

export function workflowRoleSelectOptions(
  roles: Array<{ id: number; name: string; disabled?: boolean }>
): SelectOption[] {
  return roles
    .filter((role) => !role.disabled)
    .map((role) => ({
      value: String(role.id),
      label: role.name,
      keywords: [role.name, String(role.id)]
    }));
}

export function resolveWorkflowStageRoleName(
  roleId: number | null | undefined,
  roles: Array<{ id: number; name: string }>,
  roleNameFallback?: string | null
): string | null {
  if (roleId == null) {
    return null;
  }
  const match = roles.find((role) => role.id === roleId);
  return match?.name ?? roleNameFallback?.trim() ?? `Role #${roleId}`;
}

export function formatWorkflowExpiry(stage: WorkflowStage): string | null {
  if (!stage.expiryPeriodUnit || stage.expiryPeriodValue == null) {
    return null;
  }
  const unit = stage.expiryPeriodUnit === 'HOURS' ? 'hours' : 'days';
  return `${stage.expiryPeriodValue} ${unit}`;
}
