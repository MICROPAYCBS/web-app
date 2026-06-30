'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractAuditTrailDetail } from '@mifos/api-client';
import { Check, Trash2, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
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
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  formatAuditTrailDateTime,
  formatAuditTrailFilterLabel
} from '@/lib/fineract/audit-trail-display';
import { CHECKER_INBOX_LIST_PATH } from '@/lib/fineract/checker-inbox-paths';
import { notifyCheckerInboxPendingChanged } from '@/lib/checker-inbox/pending-count';

type ConfirmAction = 'approve' | 'reject' | 'delete';

export function CheckerInboxDetailView({ item }: { item: FineractAuditTrailDetail }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);

  function runAction(action: ConfirmAction) {
    startTransition(async () => {
      const result =
        action === 'delete'
          ? await deleteCheckerInboxItemAction(item.id)
          : await executeCheckerInboxActionAction(item.id, action);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(
        action === 'approve'
          ? 'Checker item approved.'
          : action === 'reject'
            ? 'Checker item rejected.'
            : 'Checker item deleted.'
      );
      setConfirmAction(null);
      notifyCheckerInboxPendingChanged();
      router.push(CHECKER_INBOX_LIST_PATH);
      router.refresh();
    });
  }

  const headerActions = (
    <>
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
        className="min-h-0 flex-1"
        header={
          <DetailHeader
            backLink={
              <DetailBackLink href={CHECKER_INBOX_LIST_PATH} label="Back to checker inbox" />
            }
            title={`Checker inbox ${item.id}`}
            meta={
              item.actionName ? `${item.actionName} on ${item.entityName ?? 'resource'}` : undefined
            }
            actions={headerActions}
          />
        }
        summary={
          <DetailFieldGrid columns={2}>
            <DetailField label="ID">{item.id}</DetailField>
            <DetailField label="Status">
              {item.processingResult
                ? formatAuditTrailFilterLabel(item.processingResult)
                : '—'}
            </DetailField>
            <DetailField label="User">{item.maker ?? '—'}</DetailField>
            <DetailField label="Action">
              {item.actionName ? formatAuditTrailFilterLabel(item.actionName) : '—'}
            </DetailField>
            <DetailField label="Entity">
              {item.entityName ? formatAuditTrailFilterLabel(item.entityName) : '—'}
            </DetailField>
            {item.resourceId != null ? (
              <DetailField label="Resource ID">{item.resourceId}</DetailField>
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
        <AuditTrailDetailContent audit={item} variant="fields-only" />
      </DetailPage>

      <Dialog open={confirmAction != null} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <DialogContent className="sm:max-w-md">
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
                ? 'Are you sure you want to approve this checker item?'
                : confirmAction === 'reject'
                  ? 'Are you sure you want to reject this checker item?'
                  : 'Are you sure you want to delete this checker item?'}
            </DialogDescription>
          </DialogHeader>
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
