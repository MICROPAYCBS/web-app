/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { WorkflowDefinition, WorkflowStage } from '@mifos/api-client';
import {
  buildWorkflowChain,
  type WorkflowChainSegment
} from '@/lib/fineract/approval-workflow-display';

export type WorkflowStageProgressItem = {
  key: string;
  label: string;
  kind: 'bookend' | 'stage';
  stageCode?: string;
  state: 'completed' | 'current' | 'upcoming';
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

export function buildWorkflowStageProgress(
  definition: WorkflowDefinition,
  currentStageCode?: string
): WorkflowStageProgressItem[] {
  const chain = buildWorkflowChain(definition.stages, definition.transitions);
  const orderedStageCodes = stageCodesInOrder(chain);
  const currentIndex = currentStageCode
    ? orderedStageCodes.indexOf(currentStageCode)
    : -1;

  return chain.map((segment) => {
    if (segment.kind === 'bookend') {
      const isStart = segment.position === 'start';
      const state =
        currentIndex < 0
          ? 'upcoming'
          : isStart
            ? 'completed'
            : currentIndex >= orderedStageCodes.length - 1
              ? 'upcoming'
              : 'upcoming';
      return {
        key: `bookend-${segment.position}`,
        label: isStart ? 'Maker' : 'Checker',
        kind: 'bookend' as const,
        state: isStart ? ('completed' as const) : state
      };
    }

    const stageIndex = orderedStageCodes.indexOf(segment.stage.stageCode);
    let state: WorkflowStageProgressItem['state'] = 'upcoming';
    if (currentIndex >= 0) {
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
  currentStageCode: string
): string | undefined {
  const chain = buildWorkflowChain(definition.stages, definition.transitions);
  const orderedStageCodes = stageCodesInOrder(chain);
  const index = orderedStageCodes.indexOf(currentStageCode);
  if (index < 0) {
    return undefined;
  }
  return `Stage ${index + 1} of ${orderedStageCodes.length}`;
}

export function isFinalWorkflowStage(
  definition: WorkflowDefinition,
  currentStageCode: string
): boolean {
  const chain = buildWorkflowChain(definition.stages, definition.transitions);
  const orderedStageCodes = stageCodesInOrder(chain);
  const index = orderedStageCodes.indexOf(currentStageCode);
  return index >= 0 && index === orderedStageCodes.length - 1;
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
