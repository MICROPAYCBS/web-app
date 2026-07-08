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
import { toastFineractError } from '@/lib/toast-fineract-error';
import {
  bulkDeleteCheckerInboxItemsAction,
  bulkExecuteCheckerInboxActionAction
} from '@/actions/checker-inbox';
import { ListFilterTrigger } from '@/components/composites/list-filter-sheet';
import { ListPage } from '@/components/composites/list-page';
import { CheckerInboxFilterSheet } from '@/components/tasks/checker-inbox-filter-sheet';
import {
  CheckerInboxConfirmItemList
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
  const [pending, startTransition] = useTransition();
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState<CheckerInboxClientFilters>(initialClientFilters);
  const [selectedItems, setSelectedItems] = useState<CheckerInboxEnrichedItem[]>([]);
  const [selectionEpoch, setSelectionEpoch] = useState(0);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const hasSelection = selectedItems.length > 0;
  const filterOptions = useMemo(() => buildCheckerInboxClientFilterOptions(items), [items]);
  const activeFilterCount = countActiveCheckerInboxClientFilters(filters);

  function runBulkAction(action: ConfirmAction) {
    const ids = selectedItems.map((item) => item.id);
    const itemsById = Object.fromEntries(
      selectedItems.map((item) => [
        item.id,
        { actionName: item.actionName, entityName: item.entityName }
      ])
    );
    startTransition(async () => {
      const result =
        action === 'delete'
          ? await bulkDeleteCheckerInboxItemsAction(ids)
          : await bulkExecuteCheckerInboxActionAction(ids, action, itemsById);
      if (!toastCheckerInboxActionOutcome(action, result)) {
        toastFineractError(result.message);
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
              disabled={pending || !hasSelection}
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
              disabled={pending || !hasSelection}
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
                ? 'Review the selected requests before approving.'
                : confirmAction === 'reject'
                  ? 'These requests will be rejected and will not be applied.'
                  : 'These pending requests will be removed from the inbox.'}
            </DialogDescription>
          </DialogHeader>
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
