'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  ContactType,
  FineractAuditTrailDetail,
  FineractClientTemplate,
  FineractIncomeSourceOptions,
  FineractRolePermissionUsage
} from '@mifos/api-client';
import { useSession } from '@mifos/auth';
import { Check, ChevronDown, ExternalLink, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { toastFineractError } from '@/lib/toast-fineract-error';
import { executeCheckerInboxActionAction } from '@/actions/checker-inbox';
import {
  DetailBackLink,
  DetailField,
  DetailFieldGrid,
  DetailHeader,
  DetailPage
} from '@/components/composites';
import { AuditTrailDetailContent } from '@/components/audit/audit-trail-detail-content';
import { AuditTrailCommandFields } from '@/components/system/audit-trail-command-fields';
import {
  CheckerInboxReviewDetailsList,
  CheckerInboxReviewHighlights,
  checkerInboxConfirmDescription
} from '@/components/tasks/checker-inbox-review-summary';
import { CheckerInboxWorkflowStageNotice } from '@/components/tasks/checker-inbox-workflow-stage-notice';
import { CheckerInboxSelfApprovalNotice } from '@/components/tasks/checker-inbox-self-approval-notice';
import { CreateClientCheckerReview } from '@/components/tasks/create-client-checker-review';
import {
  ApprovalWorkflowNoMatchHint,
  MatchedApprovalWorkflowPanel
} from '@/components/tasks/matched-approval-workflow-panel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import type { CreateClientDraft } from '@/components/clients/create/types';
import type { CheckerInboxItemContext } from '@/lib/checker-inbox/checker-inbox-item-types';
import { describeCheckerInboxAction } from '@/lib/checker-inbox/checker-inbox-command-summary';
import {
  auditTrailResultVariant,
  formatAuditTrailDateTime,
  formatAuditTrailFilterLabel,
  isAwaitingApprovalAuditResult
} from '@/lib/fineract/audit-trail-display';
import { CHECKER_INBOX_LIST_PATH } from '@/lib/fineract/checker-inbox-paths';
import {
  checkerInboxItemRemainsPending,
  toastCheckerInboxActionOutcome
} from '@/lib/checker-inbox/checker-inbox-outcome';
import { formatCheckerInboxActionError } from '@/lib/checker-inbox/checker-inbox-action-error';
import {
  checkerInboxWorkflowStageActionButtonLabel,
  checkerInboxWorkflowStageConfirmDescription,
  resolveCheckerInboxWorkflowStageContext
} from '@/lib/checker-inbox/checker-inbox-workflow-stage-copy';
import { formatCheckerInboxWorkflowStageHeadline } from '@/lib/checker-inbox/workflow-stage-progress';
import { resolveCheckerInboxSelfApprovalBlock } from '@/lib/checker-inbox/checker-inbox-self-approval';

type ConfirmAction = 'approve' | 'reject';

export type CreateClientCheckerReviewData = {
  draft: CreateClientDraft;
  template: FineractClientTemplate;
  incomeSourceOptions?: FineractIncomeSourceOptions;
  identifierDocumentTypes: { id: number; name: string }[];
  contactTypeOptions: ContactType[];
};

function checkerInboxNonActionableMessage(processingResult: string | undefined): string {
  const label = processingResult
    ? formatAuditTrailFilterLabel(processingResult)
    : 'this status';
  if (processingResult?.toLowerCase().includes('error')) {
    return `This task ended in ${label} and is not awaiting approval. Approve and reject are only available for items awaiting approval. Fix the approval-workflow configuration if needed, then submit the action again.`;
  }
  return `This task is ${label} and is not awaiting approval. Approve and reject are only available for items awaiting approval.`;
}

export function CheckerInboxDetailView({
  item,
  context,
  taskPermissions = [],
  createClientReview = null
}: {
  item: FineractAuditTrailDetail;
  context: CheckerInboxItemContext;
  taskPermissions?: FineractRolePermissionUsage[];
  createClientReview?: CreateClientCheckerReviewData | null;
}) {
  const router = useRouter();
  const { user } = useSession();
  const [pending, startTransition] = useTransition();
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const workflowStage = resolveCheckerInboxWorkflowStageContext(context);
  const selfApprovalBlock = resolveCheckerInboxSelfApprovalBlock(item.maker, user, context);
  const canActOnCheckerItem = isAwaitingApprovalAuditResult(item.processingResult);
  const checkerActionsDisabled = pending || selfApprovalBlock.blocked || !canActOnCheckerItem;

  function runAction(action: ConfirmAction) {
    if (selfApprovalBlock.blocked) {
      return;
    }
    startTransition(async () => {
      const result = await executeCheckerInboxActionAction(item.id, action, {
        actionName: item.actionName,
        entityName: item.entityName,
        maker: item.maker
      });
      const stageLabel = workflowStage
        ? formatCheckerInboxWorkflowStageHeadline(workflowStage)
        : undefined;
      if (!toastCheckerInboxActionOutcome(action, result, { stageLabel })) {
        toastFineractError(
          formatCheckerInboxActionError(result.message, {
            taskPermissionCode: context.taskPermissionCode,
            taskPermissions
          })
        );
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
      {canActOnCheckerItem ? (
        <>
          <Button
            type="button"
            disabled={checkerActionsDisabled}
            onClick={() => setConfirmAction('approve')}
          >
            <Check className="mr-2 size-4" />
            {checkerInboxWorkflowStageActionButtonLabel(context, 'approve', 'Approve')}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={checkerActionsDisabled}
            onClick={() => setConfirmAction('reject')}
          >
            <X className="mr-2 size-4" />
            {checkerInboxWorkflowStageActionButtonLabel(context, 'reject', 'Reject')}
          </Button>
        </>
      ) : null}
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
        {!canActOnCheckerItem ? (
          <Card className="mb-6 border-destructive/30 bg-destructive/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-destructive">Cannot act on this task</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {checkerInboxNonActionableMessage(item.processingResult)}
              </p>
            </CardContent>
          </Card>
        ) : null}
        {context.summary || context.commandHighlights?.length || selfApprovalBlock.blocked ? (
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">What you are reviewing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <CheckerInboxSelfApprovalNotice block={selfApprovalBlock} />
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
        {createClientReview ? (
          <>
            <CreateClientCheckerReview
              draft={createClientReview.draft}
              template={createClientReview.template}
              incomeSourceOptions={createClientReview.incomeSourceOptions}
              identifierDocumentTypes={createClientReview.identifierDocumentTypes}
              contactTypeOptions={createClientReview.contactTypeOptions}
            />
            <Card className="mb-6">
              <CardContent className="pt-6">
                <Collapsible>
                  <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                    <ChevronDown className="size-4" />
                    Technical command fields
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-4">
                    <AuditTrailCommandFields
                      commandAsJson={item.commandAsJson}
                      entityName={item.entityName}
                    />
                  </CollapsibleContent>
                </Collapsible>
              </CardContent>
            </Card>
          </>
        ) : (
          <AuditTrailDetailContent audit={item} variant="fields-only" />
        )}
      </DetailPage>

      <Dialog open={confirmAction != null} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {confirmAction === 'approve'
                ? workflowStage
                  ? checkerInboxWorkflowStageActionButtonLabel(context, 'approve', 'Approve checker')
                  : 'Approve checker'
                : workflowStage
                  ? checkerInboxWorkflowStageActionButtonLabel(context, 'reject', 'Reject checker')
                  : 'Reject checker'}
            </DialogTitle>
            <DialogDescription>
              {confirmAction === 'approve'
                ? checkerInboxWorkflowStageConfirmDescription(
                    context,
                    'approve',
                    checkerInboxConfirmDescription(context, item.id)
                  )
                : checkerInboxWorkflowStageConfirmDescription(
                    context,
                    'reject',
                    checkerInboxConfirmDescription(context, item.id)
                  )}
            </DialogDescription>
          </DialogHeader>
          {confirmAction ? (
            <CheckerInboxWorkflowStageNotice
              context={context}
              action={confirmAction}
              taskPermissions={taskPermissions}
            />
          ) : null}
          <CheckerInboxReviewHighlights highlights={context.commandHighlights} />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setConfirmAction(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={pending}
              onClick={() => confirmAction && runAction(confirmAction)}
            >
              {confirmAction === 'approve'
                ? checkerInboxWorkflowStageActionButtonLabel(context, 'approve', 'Approve')
                : checkerInboxWorkflowStageActionButtonLabel(context, 'reject', 'Reject')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
