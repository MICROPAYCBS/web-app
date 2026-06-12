'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { CheckerInboxListItem, CheckerInboxSearchTemplate } from '@mifos/api-client';
import { Check, ChevronDown, ChevronUp, Trash2, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useState, useTransition } from 'react';
import { toast } from 'sonner';
import {
  bulkDeleteCheckerInboxItemsAction,
  bulkExecuteCheckerInboxActionAction
} from '@/actions/checker-inbox';
import { TextField } from '@/components/composites/text-field';
import { CheckerInboxAndTasksLayout } from '@/components/tasks/checker-inbox-and-tasks-layout';
import { CheckerInboxFilters } from '@/components/tasks/checker-inbox-filters';
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
import type { CheckerInboxSearchFilters } from '@/lib/fineract/checker-inbox-query';
import { buildCheckerInboxListUrl } from '@/lib/fineract/checker-inbox-query';

type ConfirmAction = 'approve' | 'reject' | 'delete';

export function CheckerInboxPageContent({
  items,
  filters,
  template,
  hasActiveSearch
}: {
  items: CheckerInboxListItem[];
  filters: CheckerInboxSearchFilters;
  template: CheckerInboxSearchTemplate;
  hasActiveSearch: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [userFilter, setUserFilter] = useState('');
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(hasActiveSearch);
  const [selectedItems, setSelectedItems] = useState<CheckerInboxListItem[]>([]);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);

  const navigate = useCallback(
    (nextFilters: CheckerInboxSearchFilters) => {
      startTransition(() => {
        router.push(buildCheckerInboxListUrl(nextFilters));
      });
    },
    [router]
  );

  function runBulkAction(action: ConfirmAction) {
    const ids = selectedItems.map((item) => item.id);
    startTransition(async () => {
      const result =
        action === 'delete'
          ? await bulkDeleteCheckerInboxItemsAction(ids)
          : await bulkExecuteCheckerInboxActionAction(ids, action);
      if (!result.ok) {
        toast.error(result.message);
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
      router.refresh();
    });
  }

  const showEmptySearch = hasActiveSearch && items.length === 0;
  const showEmptyAccount = !hasActiveSearch && items.length === 0;

  return (
    <CheckerInboxAndTasksLayout>
      <div className="space-y-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[220px] flex-1">
            <TextField
              id="checker-inbox-user-filter"
              label="Search by user"
              value={userFilter}
              onChange={(value) => setUserFilter(value)}
              disabled={pending}
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label={showAdvancedSearch ? 'Hide advanced search' : 'Show advanced search'}
            aria-expanded={showAdvancedSearch}
            onClick={() => setShowAdvancedSearch((current) => !current)}
          >
            {showAdvancedSearch ? (
              <ChevronUp className="size-4" />
            ) : (
              <ChevronDown className="size-4" />
            )}
          </Button>
          <Button
            type="button"
            disabled={pending || selectedItems.length === 0}
            onClick={() => setConfirmAction('approve')}
          >
            <Check className="mr-2 size-4" />
            Approve
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={pending || selectedItems.length === 0}
            onClick={() => setConfirmAction('delete')}
          >
            <Trash2 className="mr-2 size-4" />
            Delete
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={pending || selectedItems.length === 0}
            onClick={() => setConfirmAction('reject')}
          >
            <X className="mr-2 size-4" />
            Reject
          </Button>
        </div>

        {showAdvancedSearch ? (
          <CheckerInboxFilters
            template={template}
            filters={filters}
            onApply={navigate}
            disabled={pending}
          />
        ) : null}

        {showEmptySearch ? (
          <p className="rounded-md border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
            No checker inbox data available for this search.
          </p>
        ) : null}

        {showEmptyAccount ? (
          <p className="rounded-md border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
            No checker inbox data available for this account.
          </p>
        ) : null}

        {items.length > 0 ? (
          <CheckerInboxTable
            items={items}
            userFilter={userFilter}
            onSelectedItemsChange={setSelectedItems}
          />
        ) : null}

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
      </div>
    </CheckerInboxAndTasksLayout>
  );
}
