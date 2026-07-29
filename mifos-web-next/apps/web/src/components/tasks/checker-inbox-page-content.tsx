'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Check, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useSession } from '@mifos/auth';
import { toastFineractError } from '@/lib/toast-fineract-error';
import { bulkExecuteCheckerInboxActionAction } from '@/actions/checker-inbox';
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import {
  isCheckerInboxItemMaker,
  resolveCheckerInboxSelfApprovalBlock
} from '@/lib/checker-inbox/checker-inbox-self-approval';
import {
  CHECKER_INBOX_LIST_PATH,
  CHECKER_INBOX_TAB_MY_SUBMISSIONS,
  CHECKER_INBOX_TAB_TO_REVIEW,
  type CheckerInboxTab
} from '@/lib/fineract/checker-inbox-paths';

type ConfirmAction = 'approve' | 'reject';

function pageDescription(tab: CheckerInboxTab, approvalWorkflowsEnabled: boolean): string {
  if (tab === CHECKER_INBOX_TAB_MY_SUBMISSIONS) {
    return 'Requests you submitted. Track status here — another checker must approve or reject them.';
  }
  return approvalWorkflowsEnabled
    ? 'Requests from others that need your review. Multi-stage approval workflows use this same inbox.'
    : 'Requests from others that need your review.';
}

export function CheckerInboxPageContent({
  items,
  taskPermissions = [],
  approvalWorkflowsEnabled = false,
  initialClientFilters = {},
  tab
}: {
  items: CheckerInboxEnrichedItem[];
  taskPermissions?: FineractRolePermissionUsage[];
  approvalWorkflowsEnabled?: boolean;
  initialClientFilters?: CheckerInboxClientFilters;
  tab: CheckerInboxTab;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useSession();
  const [pending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<CheckerInboxTab>(tab);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState<CheckerInboxClientFilters>(initialClientFilters);
  const [selectedItems, setSelectedItems] = useState<CheckerInboxEnrichedItem[]>([]);
  const [selectionEpoch, setSelectionEpoch] = useState(0);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const hasSelection = selectedItems.length > 0;
  const singleSelectedItem = selectedItems.length === 1 ? selectedItems[0] : null;
  const isMySubmissionsTab = activeTab === CHECKER_INBOX_TAB_MY_SUBMISSIONS;
  const bulkWorkflowStageDescription =
    confirmAction === 'approve' || confirmAction === 'reject'
      ? checkerInboxBulkWorkflowStageConfirmDescription(
          confirmAction,
          selectedItems.map((item) => ({ context: item.context }))
        )
      : null;

  useEffect(() => {
    setActiveTab(tab);
  }, [tab]);

  const { toReviewItems, mySubmissionItems } = useMemo(() => {
    const mine: CheckerInboxEnrichedItem[] = [];
    const others: CheckerInboxEnrichedItem[] = [];
    for (const item of items) {
      if (isCheckerInboxItemMaker(item.maker, user)) {
        mine.push(item);
      } else {
        others.push(item);
      }
    }
    return { toReviewItems: others, mySubmissionItems: mine };
  }, [items, user]);

  const tabItems = isMySubmissionsTab ? mySubmissionItems : toReviewItems;
  const filterOptions = useMemo(() => buildCheckerInboxClientFilterOptions(tabItems), [tabItems]);
  const activeFilterCount = countActiveCheckerInboxClientFilters(filters);
  const selfBlockedSelectedItems = useMemo(
    () =>
      selectedItems.filter(
        (item) => resolveCheckerInboxSelfApprovalBlock(item.maker, user, item.context).blocked
      ),
    [selectedItems, user]
  );
  const hasSelfBlockedSelection = selfBlockedSelectedItems.length > 0;
  const checkerActionsDisabled =
    pending || !hasSelection || hasSelfBlockedSelection || isMySubmissionsTab;
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

  const navigateTab = useCallback(
    (nextTab: CheckerInboxTab) => {
      setActiveTab(nextTab);
      setSelectedItems([]);
      setSelectionEpoch((epoch) => epoch + 1);
      setConfirmAction(null);
      const params = new URLSearchParams(searchParams.toString());
      if (nextTab === CHECKER_INBOX_TAB_TO_REVIEW) {
        params.delete('tab');
      } else {
        params.set('tab', nextTab);
      }
      const query = params.toString();
      const href = query
        ? `${pathname || CHECKER_INBOX_LIST_PATH}?${query}`
        : pathname || CHECKER_INBOX_LIST_PATH;
      startTransition(() => {
        router.replace(href, { scroll: false });
      });
    },
    [pathname, router, searchParams]
  );

  function runBulkAction(action: ConfirmAction) {
    if (hasSelfBlockedSelection || isMySubmissionsTab) {
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
      const result = await bulkExecuteCheckerInboxActionAction(ids, action, itemsById);
      if (!toastCheckerInboxActionOutcome(action, result, {
        stageLabel:
          selectedItems.length === 1
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
        description={pageDescription(activeTab, approvalWorkflowsEnabled)}
        actions={
          !isMySubmissionsTab ? (
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
                variant="outline"
                disabled={checkerActionsDisabled}
                onClick={() => setConfirmAction('reject')}
              >
                <X className="mr-2 size-4" />
                Reject
              </Button>
            </>
          ) : undefined
        }
      >
        <div className="space-y-4">
          <Tabs
            value={activeTab}
            onValueChange={(value) => navigateTab(value as CheckerInboxTab)}
          >
            <TabsList>
              <TabsTrigger value={CHECKER_INBOX_TAB_TO_REVIEW} disabled={pending}>
                To review ({toReviewItems.length})
              </TabsTrigger>
              <TabsTrigger value={CHECKER_INBOX_TAB_MY_SUBMISSIONS} disabled={pending}>
                My submissions ({mySubmissionItems.length})
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <CheckerInboxTable
            key={`${activeTab}-${selectionEpoch}`}
            items={tabItems}
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
          {hasSelfBlockedSelection && !isMySubmissionsTab ? (
            <CheckerInboxSelfApprovalNotice block={bulkSelfApprovalBlock} className="mt-4" />
          ) : null}
        </div>
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
                : `Reject ${selectedItems.length} checker item${selectedItems.length === 1 ? '' : 's'}`}
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
                : singleSelectedItem
                  ? checkerInboxWorkflowStageConfirmDescription(
                      singleSelectedItem.context,
                      'reject',
                      checkerInboxConfirmDescription(
                        singleSelectedItem.context,
                        singleSelectedItem.id
                      )
                    )
                  : bulkWorkflowStageDescription ??
                    'These requests will be rejected and will not be applied.'}
            </DialogDescription>
          </DialogHeader>
          <CheckerInboxSelfApprovalNotice block={bulkSelfApprovalBlock} />
          {singleSelectedItem && confirmAction ? (
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
                : singleSelectedItem
                  ? checkerInboxWorkflowStageActionButtonLabel(
                      singleSelectedItem.context,
                      'reject',
                      'Reject'
                    )
                  : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
