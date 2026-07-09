'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Check, Trash2, X } from 'lucide-react';
import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@mifos/auth';
import { toastFineractError } from '@/lib/toast-fineract-error';
import {
  bulkDeleteCheckerInboxItemsAction,
  bulkExecuteCheckerInboxActionAction
} from '@/actions/checker-inbox';
import { ListFilterTrigger } from '@/components/composites/list-filter-sheet';
import { ListPage } from '@/components/composites/list-page';
import { CheckerInboxFilterSheet } from '@/components/tasks/checker-inbox-filter-sheet';
import {
  CheckerInboxConfirmItemList,
  checkerInboxConfirmDescription
} from '@/components/tasks/checker-inbox-review-summary';
import { CheckerInboxTable } from '@/components/tasks/checker-inbox-table';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import type { FineractRolePermissionUsage } from '@mifos/api-client';
import type { CheckerInboxEnrichedItem } from '@/lib/checker-inbox/checker-inbox-item-types';
import {
  buildCheckerInboxClientFilterOptions,
  countActiveCheckerInboxClientFilters,
  type CheckerInboxClientFilters
} from '@/lib/checker-inbox/client-filters';
import { toastCheckerInboxActionOutcome } from '@/lib/checker-inbox/checker-inbox-outcome';
import { formatCheckerInboxActionError } from '@/lib/checker-inbox/checker-inbox-action-error';
import {
  checkerInboxBulkWorkflowStageConfirmDescription,
  checkerInboxWorkflowStageActionButtonLabel,
  checkerInboxWorkflowStageConfirmDescription,
  resolveCheckerInboxWorkflowStageContext
} from '@/lib/checker-inbox/checker-inbox-workflow-stage-copy';
import { CheckerInboxWorkflowStageNotice } from '@/components/tasks/checker-inbox-workflow-stage-notice';
import { CheckerInboxSelfApprovalNotice } from '@/components/tasks/checker-inbox-self-approval-notice';
import { formatCheckerInboxWorkflowStageHeadline } from '@/lib/checker-inbox/workflow-stage-progress';
import { resolveCheckerInboxSelfApprovalBlock } from '@/lib/checker-inbox/checker-inbox-self-approval';

type ConfirmAction = 'approve' | 'reject' | 'delete';

export function CheckerInboxPageContent({
  items,
  taskPermissions = [],
  approvalWorkflowsEnabled = false,
  initialClientFilters = {}
}: {
  items: CheckerInboxEnrichedItem[];
  taskPermissions?: FineractRolePermissionUsage[];
  approvalWorkflowsEnabled?: boolean;
  initialClientFilters?: CheckerInboxClientFilters;
}) {
  const router = useRouter();
  const { user } = useSession();
  const [pending, startTransition] = useTransition();
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState<CheckerInboxClientFilters>(initialClientFilters);
  const [selectedItems, setSelectedItems] = useState<CheckerInboxEnrichedItem[]>([]);
  const [selectionEpoch, setSelectionEpoch] = useState(0);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const hasSelection = selectedItems.length > 0;
  const singleSelectedItem = selectedItems.length === 1 ? selectedItems[0] : null;
  const bulkWorkflowStageDescription =
    confirmAction === 'approve' || confirmAction === 'reject'
      ? checkerInboxBulkWorkflowStageConfirmDescription(
          confirmAction,
          selectedItems.map((item) => ({ context: item.context }))
        )
      : null;
  const filterOptions = useMemo(() => buildCheckerInboxClientFilterOptions(items), [items]);
  const activeFilterCount = countActiveCheckerInboxClientFilters(filters);
  const selfBlockedSelectedItems = useMemo(
    () =>
      selectedItems.filter(
        (item) => resolveCheckerInboxSelfApprovalBlock(item.maker, user, item.context).blocked
      ),
    [selectedItems, user]
  );
  const hasSelfBlockedSelection = selfBlockedSelectedItems.length > 0;
  const checkerActionsDisabled = pending || !hasSelection || hasSelfBlockedSelection;
  const bulkSelfApprovalBlock = useMemo(() => {
    if (!hasSelfBlockedSelection) {
      return { blocked: false };
    }
    if (selfBlockedSelectedItems.length === 1) {
      return resolveCheckerInboxSelfApprovalBlock(
        selfBlockedSelectedItems[0].maker,
        user,
        selfBlockedSelectedItems[0].context
      );
    }
    return {
      blocked: true,
      reason: `${selfBlockedSelectedItems.length} selected items were submitted by you. Another checker must approve or reject them.`
    };
  }, [hasSelfBlockedSelection, selfBlockedSelectedItems, user]);

  function runBulkAction(action: ConfirmAction) {
    if (hasSelfBlockedSelection && action !== 'delete') {
      return;
    }
    const ids = selectedItems.map((item) => item.id);
    const itemsById = Object.fromEntries(
      selectedItems.map((item) => [
        item.id,
        { actionName: item.actionName, entityName: item.entityName, maker: item.maker }
      ])
    );
    startTransition(async () => {
      const result =
        action === 'delete'
          ? await bulkDeleteCheckerInboxItemsAction(ids)
          : await bulkExecuteCheckerInboxActionAction(ids, action, itemsById);
      if (!toastCheckerInboxActionOutcome(action, result, {
        stageLabel:
          action !== 'delete' && selectedItems.length === 1
            ? (() => {
                const stage = resolveCheckerInboxWorkflowStageContext(selectedItems[0].context);
                return stage ? formatCheckerInboxWorkflowStageHeadline(stage) : undefined;
              })()
            : undefined
      })) {
        toastFineractError(
          formatCheckerInboxActionError(result.message, {
            taskPermissionCode: singleSelectedItem?.context.taskPermissionCode,
            taskPermissions
          })
        );
        return;
      }
      setConfirmAction(null);
      setSelectedItems([]);
      setSelectionEpoch((epoch) => epoch + 1);
      router.refresh();
    });
  }

  return (
    <>
      <ListPage
        title="Pending tasks"
        description={
          approvalWorkflowsEnabled
            ? 'Review and approve pending maker-checker requests. Multi-stage approval workflows use this same inbox.'
            : 'Review and approve pending maker-checker requests.'
        }
        actions={
          <>
            <Button
              type="button"
              disabled={checkerActionsDisabled}
              onClick={() => setConfirmAction('approve')}
            >
              <Check className="mr-2 size-4" />
              Approve
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={pending || !hasSelection}
              onClick={() => setConfirmAction('delete')}
            >
              <Trash2 className="mr-2 size-4" />
              Delete
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={checkerActionsDisabled}
              onClick={() => setConfirmAction('reject')}
            >
              <X className="mr-2 size-4" />
              Reject
            </Button>
          </>
        }
      >
        <CheckerInboxTable
          key={selectionEpoch}
          items={items}
          filters={filters}
          taskPermissions={taskPermissions}
          approvalWorkflowsEnabled={approvalWorkflowsEnabled}
          onSelectedItemsChange={setSelectedItems}
          toolbar={
            <ListFilterTrigger
              activeCount={activeFilterCount}
              onClick={() => setFilterOpen(true)}
              disabled={pending}
            />
          }
        />
        {hasSelfBlockedSelection ? (
          <CheckerInboxSelfApprovalNotice block={bulkSelfApprovalBlock} className="mt-4" />
        ) : null}
      </ListPage>

      <CheckerInboxFilterSheet
        open={filterOpen}
        onOpenChange={setFilterOpen}
        options={filterOptions}
        filters={filters}
        onApply={setFilters}
        onClear={() => setFilters({})}
        disabled={pending}
      />

      <Dialog
        open={confirmAction != null}
        onOpenChange={(open) => !open && setConfirmAction(null)}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {confirmAction === 'approve'
                ? `Approve ${selectedItems.length} checker item${selectedItems.length === 1 ? '' : 's'}`
                : confirmAction === 'reject'
                  ? `Reject ${selectedItems.length} checker item${selectedItems.length === 1 ? '' : 's'}`
                  : `Delete ${selectedItems.length} checker item${selectedItems.length === 1 ? '' : 's'}`}
            </DialogTitle>
            <DialogDescription>
              {confirmAction === 'approve'
                ? singleSelectedItem
                  ? checkerInboxWorkflowStageConfirmDescription(
                      singleSelectedItem.context,
                      'approve',
                      checkerInboxConfirmDescription(singleSelectedItem.context, singleSelectedItem.id)
                    )
                  : bulkWorkflowStageDescription ??
                    'Review the selected requests before approving.'
                : confirmAction === 'reject'
                  ? singleSelectedItem
                    ? checkerInboxWorkflowStageConfirmDescription(
                        singleSelectedItem.context,
                        'reject',
                        checkerInboxConfirmDescription(
                          singleSelectedItem.context,
                          singleSelectedItem.id
                        )
                      )
                    : bulkWorkflowStageDescription ??
                      'These requests will be rejected and will not be applied.'
                  : 'These pending requests will be removed from the inbox.'}
            </DialogDescription>
          </DialogHeader>
          <CheckerInboxSelfApprovalNotice block={bulkSelfApprovalBlock} />
          {singleSelectedItem && (confirmAction === 'approve' || confirmAction === 'reject') ? (
            <CheckerInboxWorkflowStageNotice
              context={singleSelectedItem.context}
              action={confirmAction}
              taskPermissions={taskPermissions}
            />
          ) : null}
          <CheckerInboxConfirmItemList items={selectedItems} />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setConfirmAction(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant={confirmAction === 'delete' ? 'destructive' : 'default'}
              disabled={pending}
              onClick={() => confirmAction && runBulkAction(confirmAction)}
            >
              {confirmAction === 'approve'
                ? singleSelectedItem
                  ? checkerInboxWorkflowStageActionButtonLabel(
                      singleSelectedItem.context,
                      'approve',
                      'Approve'
                    )
                  : 'Approve'
                : confirmAction === 'reject'
                  ? singleSelectedItem
                    ? checkerInboxWorkflowStageActionButtonLabel(
                        singleSelectedItem.context,
                        'reject',
                        'Reject'
                      )
                    : 'Reject'
                  : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
