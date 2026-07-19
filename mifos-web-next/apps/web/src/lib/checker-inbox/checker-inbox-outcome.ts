'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { MakerCheckerActionOutcome } from '@mifos/validation';
import { toast } from 'sonner';
import type {
  CheckerInboxActionSuccess,
  CheckerInboxMutationResult
} from '@/lib/checker-inbox/checker-inbox-action-result';
import { notifyCheckerInboxPendingChanged } from '@/lib/checker-inbox/pending-count';

const CHECKER_INBOX_OUTCOME_TOAST: Record<
  MakerCheckerActionOutcome,
  { approve: string; reject: string; delete: string; variant: 'success' | 'info' }
> = {
  completed: {
    approve: 'Approved successfully.',
    reject: 'Rejected.',
    delete: 'Checker item deleted.',
    variant: 'success'
  },
  workflow_stage_recorded: {
    approve: 'Approval recorded. Item awaits the next workflow stage.',
    reject: 'Approval recorded. Item awaits the next workflow stage.',
    delete: 'Checker item deleted.',
    variant: 'info'
  },
  workflow_stage_rejection: {
    approve: 'Approved successfully.',
    reject: 'Rejection recorded.',
    delete: 'Checker item deleted.',
    variant: 'info'
  }
};

export function toastCheckerInboxActionOutcome(
  action: 'approve' | 'reject' | 'delete',
  result: CheckerInboxMutationResult,
  options?: { stageLabel?: string }
): result is CheckerInboxActionSuccess {
  if (!result.ok) {
    return false;
  }

  const copy = resolveCheckerInboxOutcomeToastCopy(action, result.outcome, options?.stageLabel);
  const variant = CHECKER_INBOX_OUTCOME_TOAST[result.outcome].variant;
  if (variant === 'info') {
    toast.info(copy);
  } else {
    toast.success(copy);
  }

  if (result.partialFailures?.length) {
    toast.warning(`${result.partialFailures.length} item(s) could not be processed.`);
  }

  notifyCheckerInboxPendingChanged();
  return true;
}

function resolveCheckerInboxOutcomeToastCopy(
  action: 'approve' | 'reject' | 'delete',
  outcome: MakerCheckerActionOutcome,
  stageLabel?: string
): string {
  const base = CHECKER_INBOX_OUTCOME_TOAST[outcome][action];

  if (!stageLabel) {
    return base;
  }

  switch (outcome) {
    case 'workflow_stage_recorded':
      return action === 'approve'
        ? `Approval recorded at ${stageLabel}. Item awaits the next workflow stage.`
        : base;
    case 'workflow_stage_rejection':
      return action === 'reject'
        ? `Rejection recorded at ${stageLabel}.`
        : base;
    case 'completed':
      return action === 'approve'
        ? `Approved at ${stageLabel}.`
        : action === 'reject'
          ? `Rejected at ${stageLabel}.`
          : base;
    default:
      return base;
  }
}

/** Whether the checker item should remain in the inbox after this action. */
export function checkerInboxItemRemainsPending(result: CheckerInboxActionSuccess): boolean {
  return (
    result.outcome === 'workflow_stage_recorded' || result.outcome === 'workflow_stage_rejection'
  );
}
