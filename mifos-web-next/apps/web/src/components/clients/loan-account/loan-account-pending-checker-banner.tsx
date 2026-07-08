'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractRolePermissionUsage } from '@mifos/api-client';
import { useCan, resolvePermission } from '@mifos/auth';
import { ClipboardCheck } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  ApprovalWorkflowNoMatchHint,
  MatchedApprovalWorkflowPanel
} from '@/components/tasks/matched-approval-workflow-panel';
import { formatAuditTrailDateTime } from '@/lib/fineract/audit-trail-display';
import { checkerInboxDetailPath, checkerInboxListPath } from '@/lib/fineract/checker-inbox-paths';
import {
  describeLoanPendingCheckerAction,
  type LoanAccountPendingCheckerAction
} from '@/lib/fineract/loan-account-pending-checker-display';
import type { LoanPendingApprovalWorkflowContext } from '@/lib/fineract/loan-account-pending-checker';

export function LoanAccountPendingCheckerBanner({
  actions,
  approvalWorkflowContext,
  taskPermissions = [],
  loanAccountId
}: {
  actions: LoanAccountPendingCheckerAction[];
  approvalWorkflowContext?: LoanPendingApprovalWorkflowContext;
  taskPermissions?: FineractRolePermissionUsage[];
  loanAccountId?: number;
}) {
  const canOpenCheckerInbox = useCan(resolvePermission('checkerInbox'));

  if (actions.length === 0) {
    return null;
  }

  const primary = actions[0]!;
  const title =
    actions.length === 1
      ? describeLoanPendingCheckerAction(primary)
      : `${actions.length} changes awaiting checker review`;

  return (
    <div
      className="flex flex-col gap-3 rounded-md border border-warning/40 bg-warning/10 px-4 py-3 sm:flex-row sm:items-start sm:justify-between"
      role="status"
    >
      <div className="flex items-start gap-3">
        <ClipboardCheck className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
        <div className="space-y-1 text-sm">
          <p className="font-medium text-warning-foreground">{title}</p>
          <p className="text-muted-foreground">
            The loan status will update after a checker approves this in the maker-checker inbox.
            {primary.maker ? ` Submitted by ${primary.maker}` : ''}
            {primary.madeOnDate ? ` · ${formatAuditTrailDateTime(primary.madeOnDate)}` : ''}
          </p>
          {actions.length > 1 ? (
            <ul className="list-inside list-disc text-muted-foreground">
              {actions.map((action) => (
                <li key={action.id}>{describeLoanPendingCheckerAction(action)}</li>
              ))}
            </ul>
          ) : null}
          {approvalWorkflowContext?.matchedWorkflow ? (
            <MatchedApprovalWorkflowPanel
              matchedWorkflow={approvalWorkflowContext.matchedWorkflow}
              workflowInstance={approvalWorkflowContext.workflowInstance}
              taskPermissions={taskPermissions}
              compact
              className="mt-2 rounded-md border border-border/60 bg-background/60 p-3"
            />
          ) : approvalWorkflowContext?.approvalWorkflowsEnabled ? (
            <ApprovalWorkflowNoMatchHint
              taskPermissionCode={approvalWorkflowContext.unresolvedTaskPermissionCode}
              taskPermissions={taskPermissions}
              className="mt-2"
            />
          ) : null}
        </div>
      </div>
      {canOpenCheckerInbox ? (
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button
            nativeButton={false}
            variant="outline"
            size="sm"
            render={
              <Link
                href={
                  loanAccountId != null
                    ? checkerInboxListPath({ loanId: loanAccountId, resourceId: loanAccountId })
                    : checkerInboxListPath()
                }
              />
            }
          >
            Open inbox
          </Button>
          <Button
            nativeButton={false}
            size="sm"
            render={<Link href={checkerInboxDetailPath(primary.id)} />}
          >
            Review
          </Button>
        </div>
      ) : null}
    </div>
  );
}
