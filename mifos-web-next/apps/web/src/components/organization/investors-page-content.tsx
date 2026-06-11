'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { InvestorTransferItem, InvestorTransferSearchPage } from '@mifos/api-client';
import { Filter, Users } from 'lucide-react';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import {
  cancelInvestorTransferAction,
  searchInvestorsAction
} from '@/actions/investors';
import { InvestorTransferItemCard } from '@/components/organization/investor-transfer-item';
import {
  EMPTY_INVESTOR_SEARCH,
  InvestorsParameterSheet,
  toInvestorSearchRequest,
  type InvestorSearchForm
} from '@/components/organization/investors-parameter-sheet';
import { EmptyState } from '@/components/composites';
import { ListPage } from '@/components/composites/list-page';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { investorTransferKey } from '@/lib/fineract/investor-display';

const PAGE_SIZE_OPTIONS = [50, 100, 200] as const;

export function InvestorsPageContent({
  initialData
}: {
  initialData: InvestorTransferSearchPage;
}) {
  const [form, setForm] = useState<InvestorSearchForm>(EMPTY_INVESTOR_SEARCH);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [sheetOpen, setSheetOpen] = useState(false);
  const [page, setPage] = useState(initialData.number ?? 0);
  const [pageSize, setPageSize] = useState(initialData.size ?? 50);
  const [items, setItems] = useState<InvestorTransferItem[]>(initialData.content);
  const [totalElements, setTotalElements] = useState(initialData.totalElements);
  const [cancelTarget, setCancelTarget] = useState<InvestorTransferItem | null>(null);
  const [pending, startTransition] = useTransition();

  function updateForm<K extends keyof InvestorSearchForm>(key: K, value: InvestorSearchForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function runSearch(nextPage: number, nextPageSize: number, nextForm: InvestorSearchForm) {
    setFieldErrors({});
    startTransition(async () => {
      const result = await searchInvestorsAction({
        request: toInvestorSearchRequest(nextForm),
        page: nextPage,
        size: nextPageSize
      });
      if (!result.ok) {
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
          setSheetOpen(true);
        }
        toast.error(result.message);
        return;
      }
      setItems(result.data.content);
      setTotalElements(result.data.totalElements);
      setPage(result.data.number ?? nextPage);
      setPageSize(result.data.size ?? nextPageSize);
      setSheetOpen(false);
    });
  }

  function handleSearchSubmit() {
    runSearch(0, pageSize, form);
  }

  function handlePageChange(nextPage: number) {
    runSearch(nextPage, pageSize, form);
  }

  function handlePageSizeChange(nextSize: number) {
    runSearch(0, nextSize, form);
  }

  function confirmCancel() {
    if (!cancelTarget?.transferId || !cancelTarget.transferExternalId) {
      return;
    }
    startTransition(async () => {
      const result = await cancelInvestorTransferAction({
        transferId: cancelTarget.transferId!,
        transferExternalId: cancelTarget.transferExternalId!
      });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success('Pending sale cancelled.');
      setCancelTarget(null);
      runSearch(page, pageSize, form);
    });
  }

  const pageCount = totalElements > 0 ? Math.ceil(totalElements / pageSize) : 0;
  const showingFrom = totalElements === 0 ? 0 : page * pageSize + 1;
  const showingTo = Math.min((page + 1) * pageSize, totalElements);

  const parametersButton = (
    <Button
      type="button"
      variant="outline"
      onClick={() => setSheetOpen(true)}
      disabled={pending}
    >
      <Filter className="mr-2 size-4" />
      Parameters
    </Button>
  );

  return (
    <>
      <ListPage
        title="Investors"
        description="View loan account transfers associated with external asset owners."
        actions={parametersButton}
      >
        {items.length ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Showing {showingFrom}–{showingTo} of {totalElements}
            </p>
            <div className="space-y-3">
              {items.map((item, index) => (
                <InvestorTransferItemCard
                  key={investorTransferKey(item, index)}
                  item={item}
                  onCancel={setCancelTarget}
                />
              ))}
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Rows</span>
                <Select
                  value={String(pageSize)}
                  onValueChange={(value) => handlePageSizeChange(Number(value))}
                  disabled={pending}
                >
                  <SelectTrigger className="h-8 w-[88px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAGE_SIZE_OPTIONS.map((size) => (
                      <SelectItem key={size} value={String(size)}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={pending || page <= 0}
                  onClick={() => handlePageChange(page - 1)}
                >
                  Previous
                </Button>
                <span className="text-sm tabular-nums">
                  Page {pageCount === 0 ? 0 : page + 1} of {pageCount}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={pending || page + 1 >= pageCount}
                  onClick={() => handlePageChange(page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <EmptyState
            icon={Users}
            title="No transfers found"
            description="Adjust search parameters or clear filters to see investor transfer history."
            action={parametersButton}
          />
        )}
      </ListPage>

      <InvestorsParameterSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        form={form}
        fieldErrors={fieldErrors}
        pending={pending}
        onFormChange={updateForm}
        onSubmit={handleSearchSubmit}
      />

      <Dialog open={cancelTarget != null} onOpenChange={(open) => !open && setCancelTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel pending sale?</DialogTitle>
            <DialogDescription>
              This cancels the asset transfer for owner external ID{' '}
              <span className="font-medium text-foreground">
                {cancelTarget?.owner?.externalId ?? '—'}
              </span>
              . This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setCancelTarget(null)}
              disabled={pending}
            >
              Keep transfer
            </Button>
            <Button type="button" variant="destructive" onClick={confirmCancel} disabled={pending}>
              {pending ? 'Cancelling…' : 'Cancel sale'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
