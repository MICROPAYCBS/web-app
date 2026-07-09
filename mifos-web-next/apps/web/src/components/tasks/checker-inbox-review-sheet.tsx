'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { CheckerInboxListItem, FineractRolePermissionUsage } from '@mifos/api-client';
import { useSession } from '@mifos/auth';
import { ExternalLink } from 'lucide-react';
import Link from 'next/link';
import {
  DOCKED_SHEET_LAYOUT_CLASSNAME,
  dockedSheetSideMaxWidth
} from '@/components/composites/form-sheet';
import { DetailField, DetailFieldGrid } from '@/components/composites';
import { CheckerInboxReviewDetailsList } from '@/components/tasks/checker-inbox-review-summary';
import { CheckerInboxSelfApprovalNotice } from '@/components/tasks/checker-inbox-self-approval-notice';
import {
  ApprovalWorkflowNoMatchHint,
  MatchedApprovalWorkflowPanel
} from '@/components/tasks/matched-approval-workflow-panel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet';
import type { CheckerInboxItemContext } from '@/lib/checker-inbox/checker-inbox-item-types';
import { describeCheckerInboxAction } from '@/lib/checker-inbox/checker-inbox-command-summary';
import {
  auditTrailResultVariant,
  formatAuditTrailDateTime,
  formatAuditTrailFilterLabel
} from '@/lib/fineract/audit-trail-display';
import { checkerInboxDetailPath } from '@/lib/fineract/checker-inbox-paths';
import { resolveCheckerInboxSelfApprovalBlock } from '@/lib/checker-inbox/checker-inbox-self-approval';
import { cn } from '@/lib/utils';

export function CheckerInboxReviewSheet({
  item,
  context,
  taskPermissions = [],
  open,
  onOpenChange
}: {
  item: CheckerInboxListItem | null;
  context: CheckerInboxItemContext | null;
  taskPermissions?: FineractRolePermissionUsage[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const actionLabel =
    item != null ? describeCheckerInboxAction(item.actionName, item.entityName) : '';
  const title = context?.subjectLabel ?? (item != null ? `Checker #${item.id}` : 'Review details');
  const hasReviewContent = Boolean(context?.commandHighlights?.length);
  const { user } = useSession();
  const selfApprovalBlock =
    item && context ? resolveCheckerInboxSelfApprovalBlock(item.maker, user, context) : { blocked: false };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {item && context ? (
        <SheetContent
        side="right"
        className={cn(
          DOCKED_SHEET_LAYOUT_CLASSNAME,
          dockedSheetSideMaxWidth.right,
          'data-[side=right]:sm:max-w-md'
        )}
      >
        <SheetHeader className="border-b border-border">
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{actionLabel}</SheetDescription>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          <CheckerInboxSelfApprovalNotice block={selfApprovalBlock} className="mb-6" />
          <DetailFieldGrid columns={1} className="mb-6">
            {context.customerName ? (
              <DetailField label="Customer">{context.customerName}</DetailField>
            ) : null}
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
            <DetailField label="Made on">{formatAuditTrailDateTime(item.madeOnDate)}</DetailField>
            {item.officeName ? <DetailField label="Branch">{item.officeName}</DetailField> : null}
            {context.taskPermissionCode ? (
              <DetailField label="Task">
                <Badge variant="secondary">{context.taskPermissionCode}</Badge>
              </DetailField>
            ) : null}
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
          </DetailFieldGrid>

          {hasReviewContent ? (
            <section className="space-y-3">
              <h3 className="text-sm font-medium">Queued changes</h3>
              <CheckerInboxReviewDetailsList highlights={context.commandHighlights} />
            </section>
          ) : (
            <p className="text-sm text-muted-foreground">
              No structured command details are available for this item.
            </p>
          )}

          {context.matchedWorkflow ? (
            <MatchedApprovalWorkflowPanel
              matchedWorkflow={context.matchedWorkflow}
              workflowInstance={context.workflowInstance}
              taskPermissions={taskPermissions}
              compact
              decisionHint="Use Approve or Reject in the page header, or open Full review, to record your decision for this stage."
              className="mt-6 rounded-lg border border-border bg-muted/20 p-4"
            />
          ) : context.approvalWorkflowsEnabled ? (
            <ApprovalWorkflowNoMatchHint
              taskPermissionCode={context.unresolvedTaskPermissionCode}
              taskPermissions={taskPermissions}
              className="mt-6 rounded-lg border border-border bg-muted/20 p-4"
            />
          ) : null}
        </div>

        <SheetFooter className="border-t border-border sm:flex-row sm:justify-between">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <div className="flex flex-wrap gap-2">
            {context.href ? (
              <Button nativeButton={false} variant="outline" render={<Link href={context.href} />}>
                <ExternalLink className="mr-2 size-4" />
                {context.hrefLabel ?? 'Open record'}
              </Button>
            ) : null}
            <Button nativeButton={false} render={<Link href={checkerInboxDetailPath(item.id)} />}>
              Full review
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
      ) : null}
    </Sheet>
  );
}
