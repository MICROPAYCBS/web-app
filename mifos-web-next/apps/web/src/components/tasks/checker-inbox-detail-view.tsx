'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractAuditTrailDetail, FineractRolePermissionUsage } from '@mifos/api-client';
import { Check, ExternalLink, Trash2, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { toastFineractError } from '@/lib/toast-fineract-error';
import {
  deleteCheckerInboxItemAction,
  executeCheckerInboxActionAction
} from '@/actions/checker-inbox';
import {
  DetailBackLink,
  DetailField,
  DetailFieldGrid,
  DetailHeader,
  DetailPage
} from '@/components/composites';
import { AuditTrailDetailContent } from '@/components/audit/audit-trail-detail-content';
import {
  CheckerInboxReviewDetailsList,
  CheckerInboxReviewHighlights,
  checkerInboxConfirmDescription
} from '@/components/tasks/checker-inbox-review-summary';
import {
  ApprovalWorkflowNoMatchHint,
  MatchedApprovalWorkflowPanel
} from '@/components/tasks/matched-approval-workflow-panel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import type { CheckerInboxItemContext } from '@/lib/checker-inbox/checker-inbox-item-types';
import { describeCheckerInboxAction } from '@/lib/checker-inbox/checker-inbox-command-summary';
import {
  auditTrailResultVariant,
  formatAuditTrailDateTime,
  formatAuditTrailFilterLabel
} from '@/lib/fineract/audit-trail-display';
import { CHECKER_INBOX_LIST_PATH } from '@/lib/fineract/checker-inbox-paths';
import {
  checkerInboxItemRemainsPending,
  toastCheckerInboxActionOutcome
} from '@/lib/checker-inbox/checker-inbox-outcome';

type ConfirmAction = 'approve' | 'reject' | 'delete';

export function CheckerInboxDetailView({
  item,
  context,
  taskPermissions = []
}: {
  item: FineractAuditTrailDetail;
  context: CheckerInboxItemContext;
  taskPermissions?: FineractRolePermissionUsage[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);

  function runAction(action: ConfirmAction) {
    startTransition(async () => {
      const result =
        action === 'delete'
          ? await deleteCheckerInboxItemAction(item.id)
          : await executeCheckerInboxActionAction(item.id, action, {
              actionName: item.actionName,
              entityName: item.entityName
            });
      if (!toastCheckerInboxActionOutcome(action, result)) {
        toastFineractError(result.message);
        return;
      }
      setConfirmAction(null);
      if (checkerInboxItemRemainsPending(result)) {
        router.refresh();
        return;
      }
      router.push(CHECKER_INBOX_LIST_PATH);
      router.refresh();
    });
  }

  const title = context.subjectLabel
    ? `${describeCheckerInboxAction(item.actionName, item.entityName)} — ${context.subjectLabel}`
    : `Checker inbox ${item.id}`;

  const headerActions = (
    <>
      {context.href ? (
        <Button nativeButton={false} variant="outline" render={<Link href={context.href} />}>
          <ExternalLink className="mr-2 size-4" />
          {context.hrefLabel ?? 'Open record'}
        </Button>
      ) : null}
      <Button type="button" disabled={pending} onClick={() => setConfirmAction('approve')}>
        <Check className="mr-2 size-4" />
        Approve
      </Button>
      <Button
        type="button"
        variant="destructive"
        disabled={pending}
        onClick={() => setConfirmAction('delete')}
      >
        <Trash2 className="mr-2 size-4" />
        Delete
      </Button>
      <Button
        type="button"
        variant="outline"
        disabled={pending}
        onClick={() => setConfirmAction('reject')}
      >
        <X className="mr-2 size-4" />
        Reject
      </Button>
    </>
  );

  return (
    <>
      <DetailPage
        header={
          <DetailHeader
            backLink={
              <DetailBackLink href={CHECKER_INBOX_LIST_PATH} label="Back to checker inbox" />
            }
            title={title}
            meta={context.summary}
            actions={headerActions}
          />
        }
        summary={
          <DetailFieldGrid columns={2}>
            <DetailField label="ID">{item.id}</DetailField>
            <DetailField label="Status">
              {item.processingResult ? (
                <Badge variant={auditTrailResultVariant(item.processingResult)}>
                  {formatAuditTrailFilterLabel(item.processingResult)}
                </Badge>
              ) : (
                '—'
              )}
            </DetailField>
            <DetailField label="User">{item.maker ?? '—'}</DetailField>
            <DetailField label="Action">
              {item.actionName ? (
                <Badge variant="outline">{formatAuditTrailFilterLabel(item.actionName)}</Badge>
              ) : (
                '—'
              )}
            </DetailField>
            <DetailField label="Entity">
              {item.entityName ? formatAuditTrailFilterLabel(item.entityName) : '—'}
            </DetailField>
            {item.resourceId != null ? (
              <DetailField label="Resource ID">
                {context.href ? (
                  <Link href={context.href} className="text-primary hover:underline">
                    {item.resourceId}
                  </Link>
                ) : (
                  item.resourceId
                )}
              </DetailField>
            ) : null}
            {context.customerName ? (
              <DetailField label="Customer">{context.customerName}</DetailField>
            ) : null}
            <DetailField label="Date">{formatAuditTrailDateTime(item.madeOnDate)}</DetailField>
            {item.officeName ? <DetailField label="Branch">{item.officeName}</DetailField> : null}
            {item.savingsAccountNo ? (
              <DetailField label="Savings account number">{item.savingsAccountNo}</DetailField>
            ) : null}
            {item.groupLevelName ? (
              <DetailField label={item.groupLevelName}>{item.groupName ?? '—'}</DetailField>
            ) : null}
          </DetailFieldGrid>
        }
      >
        {context.summary || context.commandHighlights?.length ? (
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">What you are reviewing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {context.summary ? <p className="text-sm">{context.summary}</p> : null}
              <CheckerInboxReviewDetailsList highlights={context.commandHighlights} />
            </CardContent>
          </Card>
        ) : null}
        {context.matchedWorkflow ? (
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Approval workflow</CardTitle>
            </CardHeader>
            <CardContent>
              <MatchedApprovalWorkflowPanel
                matchedWorkflow={context.matchedWorkflow}
                workflowInstance={context.workflowInstance}
                taskPermissions={taskPermissions}
                showHeading={false}
              />
            </CardContent>
          </Card>
        ) : context.approvalWorkflowsEnabled ? (
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Approval workflow</CardTitle>
            </CardHeader>
            <CardContent>
              <ApprovalWorkflowNoMatchHint
                taskPermissionCode={context.unresolvedTaskPermissionCode}
                taskPermissions={taskPermissions}
              />
            </CardContent>
          </Card>
        ) : null}
        <AuditTrailDetailContent audit={item} variant="fields-only" />
      </DetailPage>

      <Dialog open={confirmAction != null} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {confirmAction === 'approve'
                ? 'Approve checker'
                : confirmAction === 'reject'
                  ? 'Reject checker'
                  : 'Delete checker'}
            </DialogTitle>
            <DialogDescription>
              {confirmAction === 'approve'
                ? context.matchedWorkflow
                  ? `${checkerInboxConfirmDescription(context, item.id)} This item is in a multi-stage approval workflow. If you are not on the final stage, the business change will not complete yet.`
                  : checkerInboxConfirmDescription(context, item.id)
                : confirmAction === 'reject'
                  ? `Reject ${checkerInboxConfirmDescription(context, item.id)}`
                  : `Delete ${checkerInboxConfirmDescription(context, item.id)}`}
            </DialogDescription>
          </DialogHeader>
          <CheckerInboxReviewHighlights highlights={context.commandHighlights} />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setConfirmAction(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant={confirmAction === 'delete' ? 'destructive' : 'default'}
              disabled={pending}
              onClick={() => confirmAction && runAction(confirmAction)}
            >
              {confirmAction === 'approve'
                ? 'Approve'
                : confirmAction === 'reject'
                  ? 'Reject'
                  : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
