/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { SessionUser } from '@mifos/auth';
import type { CheckerInboxItemContext } from '@/lib/checker-inbox/checker-inbox-item-types';
import { resolveWorkflowStageLabel } from '@/lib/checker-inbox/workflow-stage-progress';

export type CheckerInboxSelfApprovalBlock = {
  blocked: boolean;
  reason?: string;
};

export const CHECKER_INBOX_SELF_APPROVAL_MESSAGE =
  'You submitted this request. Another checker must approve or reject it.';

function normalizeCheckerIdentity(value?: string): string {
  return value?.trim().toLowerCase() ?? '';
}

/** True when the signed-in user created the queued maker-checker command. */
export function isCheckerInboxItemMaker(
  maker: string | undefined,
  sessionUser: Pick<SessionUser, 'username'> | null | undefined
): boolean {
  const makerIdentity = normalizeCheckerIdentity(maker);
  const username = normalizeCheckerIdentity(sessionUser?.username);
  return Boolean(makerIdentity && username && makerIdentity === username);
}

function resolveCurrentWorkflowStageLabel(context: CheckerInboxItemContext): string | undefined {
  const definition = context.matchedWorkflow?.definition;
  const currentStageCode =
    context.workflowInstance?.status === 'IN_PROGRESS'
      ? context.workflowInstance.currentStageCode
      : undefined;

  if (!definition || !currentStageCode) {
    return undefined;
  }

  return resolveWorkflowStageLabel(definition, currentStageCode);
}

export function resolveCheckerInboxSelfApprovalBlock(
  maker: string | undefined,
  sessionUser: Pick<SessionUser, 'username'> | null | undefined,
  context?: CheckerInboxItemContext
): CheckerInboxSelfApprovalBlock {
  if (!isCheckerInboxItemMaker(maker, sessionUser)) {
    return { blocked: false };
  }

  const stageLabel = context ? resolveCurrentWorkflowStageLabel(context) : undefined;
  return {
    blocked: true,
    reason: stageLabel
      ? `${CHECKER_INBOX_SELF_APPROVAL_MESSAGE} You are at ${stageLabel}.`
      : CHECKER_INBOX_SELF_APPROVAL_MESSAGE
  };
}
