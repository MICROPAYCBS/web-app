/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { WorkflowDefinition, WorkflowInstanceStatus, WorkflowStage } from '@mifos/api-client';
import {
  buildWorkflowChain,
  WORKFLOW_CHECKER_BOOKEND,
  type WorkflowChainSegment
} from '@/lib/fineract/approval-workflow-display';

export type WorkflowStageProgressItem = {
  key: string;
  label: string;
  kind: 'bookend' | 'stage';
  stageCode?: string;
  state: 'completed' | 'current' | 'upcoming';
};

/** Runtime position of a held command in its workflow + system checker chain. */
export type WorkflowActorStepOptions = {
  status?: WorkflowInstanceStatus;
  currentStageCode?: string;
};

export function resolveWorkflowStageLabel(
  definition: WorkflowDefinition,
  stageCode: string
): string {
  const stage = definition.stages.find((item) => item.stageCode === stageCode);
  return stage?.name?.trim() || stageCode;
}

function stageCodesInOrder(chain: WorkflowChainSegment<WorkflowStage>[]): string[] {
  return chain
    .filter(
      (segment): segment is { kind: 'stage'; stage: WorkflowStage; index: number } =>
        segment.kind === 'stage'
    )
    .map((segment) => segment.stage.stageCode);
}

export function orderedConfiguredWorkflowStageCodes(definition: WorkflowDefinition): string[] {
  const chain = buildWorkflowChain(definition.stages, definition.transitions);
  return stageCodesInOrder(chain);
}

/** Configured workflow stages plus the system checker step that completes the task. */
export function workflowCheckerStepCount(definition: WorkflowDefinition): number {
  return orderedConfiguredWorkflowStageCodes(definition).length + 1;
}

export function isAwaitingSystemCheckerApproval(
  options?: WorkflowActorStepOptions
): boolean {
  return options?.status === 'COMPLETED';
}

export function buildWorkflowStageProgress(
  definition: WorkflowDefinition,
  options?: WorkflowActorStepOptions
): WorkflowStageProgressItem[] {
  const chain = buildWorkflowChain(definition.stages, definition.transitions);
  const orderedStageCodes = stageCodesInOrder(chain);
  const awaitingSystemChecker = isAwaitingSystemCheckerApproval(options);
  const currentStageCode = awaitingSystemChecker ? undefined : options?.currentStageCode;
  const currentIndex = currentStageCode
    ? orderedStageCodes.indexOf(currentStageCode)
    : -1;

  return chain.map((segment) => {
    if (segment.kind === 'bookend') {
      const isStart = segment.position === 'start';
      if (isStart) {
        return {
          key: 'bookend-start',
          label: 'Maker',
          kind: 'bookend' as const,
          state: 'completed' as const
        };
      }

      return {
        key: 'bookend-end',
        label: WORKFLOW_CHECKER_BOOKEND.subtitle,
        kind: 'bookend' as const,
        state: awaitingSystemChecker ? ('current' as const) : ('upcoming' as const)
      };
    }

    const stageIndex = orderedStageCodes.indexOf(segment.stage.stageCode);
    let state: WorkflowStageProgressItem['state'] = 'upcoming';
    if (awaitingSystemChecker) {
      state = 'completed';
    } else if (currentIndex >= 0) {
      if (stageIndex < currentIndex) {
        state = 'completed';
      } else if (stageIndex === currentIndex) {
        state = 'current';
      }
    }

    return {
      key: segment.stage.stageCode,
      label: segment.stage.name?.trim() || segment.stage.stageCode,
      kind: 'stage' as const,
      stageCode: segment.stage.stageCode,
      state
    };
  });
}

export function workflowStagePositionLabel(
  definition: WorkflowDefinition,
  options?: WorkflowActorStepOptions
): string | undefined {
  const configuredStages = orderedConfiguredWorkflowStageCodes(definition);
  const total = workflowCheckerStepCount(definition);
  if (total === 0) {
    return undefined;
  }

  if (isAwaitingSystemCheckerApproval(options)) {
    return `Stage ${total} of ${total}`;
  }

  const currentStageCode = options?.currentStageCode;
  if (!currentStageCode) {
    return undefined;
  }

  const index = configuredStages.indexOf(currentStageCode);
  if (index < 0) {
    return undefined;
  }

  return `Stage ${index + 1} of ${total}`;
}

/** True only on the system checker step — not on the last configured workflow stage. */
export function isFinalWorkflowStage(
  _definition: WorkflowDefinition,
  options?: WorkflowActorStepOptions
): boolean {
  return isAwaitingSystemCheckerApproval(options);
}

export type CheckerInboxWorkflowStageContext = {
  stageLabel: string;
  positionLabel?: string;
  isFinalStage: boolean;
};

export function formatCheckerInboxWorkflowStageHeadline(
  stage: CheckerInboxWorkflowStageContext
): string {
  return stage.positionLabel
    ? `${stage.stageLabel} (${stage.positionLabel})`
    : stage.stageLabel;
}

export function checkerInboxWorkflowStageActionLabel(
  stage: CheckerInboxWorkflowStageContext,
  action: 'approve' | 'reject'
): string {
  const headline = formatCheckerInboxWorkflowStageHeadline(stage);
  return action === 'approve' ? `Approve at ${headline}` : `Reject at ${headline}`;
}

export function resolveWorkflowActorStepOptions(
  workflowInstance?: { status: WorkflowInstanceStatus; currentStageCode: string } | null
): WorkflowActorStepOptions | undefined {
  if (!workflowInstance) {
    return undefined;
  }
  return {
    status: workflowInstance.status,
    currentStageCode: workflowInstance.currentStageCode
  };
}

export function resolveWorkflowActorStepLabel(
  definition: WorkflowDefinition,
  options?: WorkflowActorStepOptions
): string | undefined {
  if (isAwaitingSystemCheckerApproval(options)) {
    return WORKFLOW_CHECKER_BOOKEND.subtitle;
  }
  if (options?.status !== 'IN_PROGRESS' || !options.currentStageCode) {
    return undefined;
  }
  return resolveWorkflowStageLabel(definition, options.currentStageCode);
}
