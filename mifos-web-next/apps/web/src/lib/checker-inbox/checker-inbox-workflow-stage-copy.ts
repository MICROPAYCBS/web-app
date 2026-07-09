/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { CheckerInboxItemContext } from '@/lib/checker-inbox/checker-inbox-item-types';
import {
  checkerInboxWorkflowStageActionLabel,
  formatCheckerInboxWorkflowStageHeadline,
  isFinalWorkflowStage,
  resolveWorkflowStageLabel,
  type CheckerInboxWorkflowStageContext,
  workflowStagePositionLabel
} from '@/lib/checker-inbox/workflow-stage-progress';

export function resolveCheckerInboxWorkflowStageContext(
  context: CheckerInboxItemContext
): CheckerInboxWorkflowStageContext | null {
  const definition = context.matchedWorkflow?.definition;
  const currentStageCode =
    context.workflowInstance?.status === 'IN_PROGRESS'
      ? context.workflowInstance.currentStageCode
      : undefined;

  if (!definition || !currentStageCode) {
    return null;
  }

  return {
    stageLabel: resolveWorkflowStageLabel(definition, currentStageCode),
    positionLabel: workflowStagePositionLabel(definition, currentStageCode),
    isFinalStage: isFinalWorkflowStage(definition, currentStageCode)
  };
}

export function checkerInboxWorkflowStageConfirmDescription(
  context: CheckerInboxItemContext,
  action: 'approve' | 'reject',
  itemLabel: string
): string {
  const stage = resolveCheckerInboxWorkflowStageContext(context);
  if (!stage) {
    return itemLabel;
  }

  const headline = formatCheckerInboxWorkflowStageHeadline(stage);
  const verb = action === 'approve' ? 'approving' : 'rejecting';
  let description = `${itemLabel} You are ${verb} at ${headline}.`;

  if (action === 'approve' && !stage.isFinalStage) {
    description += ' The business change will not complete until the final checker stage.';
  }

  return description;
}

export function checkerInboxWorkflowStageActionButtonLabel(
  context: CheckerInboxItemContext,
  action: 'approve' | 'reject',
  fallback: string
): string {
  const stage = resolveCheckerInboxWorkflowStageContext(context);
  if (!stage) {
    return fallback;
  }
  return checkerInboxWorkflowStageActionLabel(stage, action);
}

export function checkerInboxBulkWorkflowStageConfirmDescription(
  action: 'approve' | 'reject',
  items: { context: CheckerInboxItemContext }[]
): string | null {
  const stages = items
    .map((item) => resolveCheckerInboxWorkflowStageContext(item.context))
    .filter((stage): stage is CheckerInboxWorkflowStageContext => stage != null);

  if (stages.length === 0) {
    return null;
  }

  const uniqueHeadlines = [
    ...new Set(stages.map((stage) => formatCheckerInboxWorkflowStageHeadline(stage)))
  ];

  const verb = action === 'approve' ? 'approving' : 'rejecting';
  const stageList =
    uniqueHeadlines.length === 1
      ? uniqueHeadlines[0]
      : `${uniqueHeadlines.length} workflow stages`;

  let description = `You are ${verb} at ${stageList}. See each item below for its current stage.`;

  if (
    action === 'approve' &&
    stages.some((stage) => !stage.isFinalStage)
  ) {
    description += ' Items not on the final stage will remain in the inbox after approval.';
  }

  return description;
}
