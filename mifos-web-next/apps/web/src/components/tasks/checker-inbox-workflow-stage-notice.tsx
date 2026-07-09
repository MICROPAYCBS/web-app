'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { CheckerInboxItemContext } from '@/lib/checker-inbox/checker-inbox-item-types';
import { resolveCheckerInboxWorkflowStageContext } from '@/lib/checker-inbox/checker-inbox-workflow-stage-copy';
import { formatCheckerInboxWorkflowStageHeadline } from '@/lib/checker-inbox/workflow-stage-progress';
import {
  formatWorkflowTaskDisplay,
  workflowStageCheckerPermissionCode
} from '@/lib/fineract/approval-workflow-display';
import type { FineractRolePermissionUsage } from '@mifos/api-client';
import { cn } from '@/lib/utils';

export function CheckerInboxWorkflowStageNotice({
  context,
  action,
  taskPermissions = [],
  className
}: {
  context: CheckerInboxItemContext;
  action?: 'approve' | 'reject';
  taskPermissions?: FineractRolePermissionUsage[];
  className?: string;
}) {
  const stage = resolveCheckerInboxWorkflowStageContext(context);
  if (!stage) {
    return null;
  }

  const headline = formatCheckerInboxWorkflowStageHeadline(stage);
  const verb =
    action === 'approve' ? 'approving' : action === 'reject' ? 'rejecting' : 'acting';
  const checkerPermissionCode = context.taskPermissionCode
    ? workflowStageCheckerPermissionCode(context.taskPermissionCode)
    : undefined;
  const checkerPermissionLabel = checkerPermissionCode
    ? formatWorkflowTaskDisplay(
        checkerPermissionCode.replace(/_CHECKER$/, ''),
        taskPermissions
      )
    : undefined;

  return (
    <div
      className={cn(
        'rounded-md border border-primary/30 bg-primary/10 px-3 py-2.5 text-sm',
        className
      )}
    >
      <p className="font-medium">
        {action ? `You are ${verb} at: ${headline}` : `Current stage: ${headline}`}
      </p>
      {checkerPermissionCode ? (
        <p className="mt-1 text-muted-foreground">
          Requires{' '}
          <span className="font-medium text-foreground">
            {checkerPermissionLabel?.subtitle ?? checkerPermissionCode}
          </span>{' '}
          checker permission.
        </p>
      ) : null}
      {action === 'approve' && !stage.isFinalStage ? (
        <p className="mt-1 text-muted-foreground">
          This records your decision for this stage only. The business change completes after the
          final checker stage.
        </p>
      ) : null}
    </div>
  );
}
