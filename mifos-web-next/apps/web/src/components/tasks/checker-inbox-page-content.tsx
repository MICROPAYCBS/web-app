'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { CheckerInboxListItem } from '@mifos/api-client';
import { Check, Trash2, X } from 'lucide-react';
import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { toastFineractError } from '@/lib/toast-fineract-error';
import {
  bulkDeleteCheckerInboxItemsAction,
  bulkExecuteCheckerInboxActionAction
} from '@/actions/checker-inbox';
import { ListFilterTrigger } from '@/components/composites/list-filter-sheet';
import { ListPage } from '@/components/composites/list-page';
import { CheckerInboxFilterSheet } from '@/components/tasks/checker-inbox-filter-sheet';
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
import {
  buildCheckerInboxClientFilterOptions,
  countActiveCheckerInboxClientFilters,
  type CheckerInboxClientFilters
} from '@/lib/checker-inbox/client-filters';
import { notifyCheckerInboxPendingChanged } from '@/lib/checker-inbox/pending-count';

type ConfirmAction = 'approve' | 'reject' | 'delete';

export function CheckerInboxPageContent({ items }: { items: CheckerInboxListItem[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState<CheckerInboxClientFilters>({});
  const [selectedItems, setSelectedItems] = useState<CheckerInboxListItem[]>([]);
  const [selectionEpoch, setSelectionEpoch] = useState(0);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const hasSelection = selectedItems.length > 0;
  const filterOptions = useMemo(() => buildCheckerInboxClientFilterOptions(items), [items]);
  const activeFilterCount = countActiveCheckerInboxClientFilters(filters);

  function runBulkAction(action: ConfirmAction) {
    const ids = selectedItems.map((item) => item.id);
    startTransition(async () => {
      const result =
        action === 'delete'
          ? await bulkDeleteCheckerInboxItemsAction(ids)
          : await bulkExecuteCheckerInboxActionAction(ids, action);
      if (!result.ok) {
        toastFineractError(result.message);
        return;
      }
      toast.success(
        action === 'approve'
          ? 'Selected items approved.'
          : action === 'reject'
            ? 'Selected items rejected.'
            : 'Selected items deleted.'
      );
      setConfirmAction(null);
      setSelectedItems([]);
      setSelectionEpoch((epoch) => epoch + 1);
      notifyCheckerInboxPendingChanged();
      router.refresh();
    });
  }

  return (
    <>
      <ListPage
        title="Pending tasks"
        description="Review and approve pending maker-checker requests."
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
                ? 'Are you sure you want to approve the selected checker items?'
                : confirmAction === 'reject'
                  ? 'Are you sure you want to reject the selected checker items?'
                  : 'Are you sure you want to delete the selected checker items?'}
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
