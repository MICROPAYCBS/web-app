'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { CurrencyLegalTender } from '@mifos/api-client';
import { formatMoney } from '@mifos/domain';
import { formatActionErrorMessage } from '@mifos/validation';
import {
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
  type PaginationState
} from '@tanstack/react-table';
import { Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState, useTransition } from 'react';
import { deleteLegalTenderAction } from '@/actions/legal-tender';
import { DataTable } from '@/components/composites/data-table/data-table';
import { DataTablePagination } from '@/components/composites/data-table/data-table-pagination';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { FINERACT_LOCALE } from '@/lib/fineract/dates';
import { legalTenderEditPath } from '@/lib/fineract/legal-tender-paths';
import { cn } from '@/lib/utils';

export function LegalTendersTable({
  currencyCode,
  decimalPlaces,
  legalTenders,
  canEdit,
  canDelete
}: {
  currencyCode: string;
  decimalPlaces: number;
  legalTenders: CurrencyLegalTender[];
  canEdit: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25
  });
  const [deleteTarget, setDeleteTarget] = useState<CurrencyLegalTender | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const columns = useMemo<ColumnDef<CurrencyLegalTender>[]>(
    () => [
      {
        accessorKey: 'label',
        header: 'Label',
        cell: ({ row }) => <span className="font-medium">{row.original.label}</span>
      },
      {
        id: 'value',
        header: 'Face value',
        cell: ({ row }) =>
          formatMoney(row.original.value, currencyCode, FINERACT_LOCALE) ?? row.original.value
      },
      {
        id: 'tenderType',
        header: 'Type',
        cell: ({ row }) => (
          <Badge variant="outline">{row.original.tenderType === 'COIN' ? 'Coin' : 'Note'}</Badge>
        )
      },
      {
        accessorKey: 'displayOrder',
        header: 'Order'
      },
      {
        id: 'active',
        header: 'Status',
        cell: ({ row }) => (
          <Badge variant={row.original.active ? 'default' : 'secondary'}>
            {row.original.active ? 'Active' : 'Inactive'}
          </Badge>
        )
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <div className="flex justify-end gap-1">
            {canEdit ? (
              <Link
                href={legalTenderEditPath(currencyCode, row.original.id)}
                className={cn(buttonVariants({ variant: 'ghost', size: 'icon-sm' }))}
                aria-label={`Edit ${row.original.label}`}
              >
                <Pencil className="size-4" />
              </Link>
            ) : null}
            {canDelete ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={`Delete ${row.original.label}`}
                onClick={() => {
                  setActionError(null);
                  setDeleteTarget(row.original);
                }}
              >
                <Trash2 className="size-4" />
              </Button>
            ) : null}
          </div>
        )
      }
    ],
    [canDelete, canEdit, currencyCode, decimalPlaces]
  );

  const table = useReactTable({
    data: legalTenders,
    columns,
    state: { pagination },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  });

  function confirmDelete() {
    if (!deleteTarget) {
      return;
    }
    startTransition(async () => {
      const result = await deleteLegalTenderAction(currencyCode, deleteTarget.id);
      if (!result.ok) {
        setActionError(formatActionErrorMessage(result.message, result.fieldErrors));
        return;
      }
      setDeleteTarget(null);
      router.refresh();
    });
  }

  return (
    <>
      <DataTable
        table={table}
        stickyHeader={false}
        emptyMessage="No legal tenders"
        emptyDescription={`Add note and coin denominations for ${currencyCode}.`}
      />
      <DataTablePagination table={table} totalRecords={legalTenders.length} />

      <Dialog open={deleteTarget != null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete legal tender</DialogTitle>
            <DialogDescription>
              Delete {deleteTarget?.label}? This is blocked when the denomination is referenced by
              cashier transactions.
            </DialogDescription>
          </DialogHeader>
          {actionError ? <p className="text-sm text-destructive">{actionError}</p> : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteTarget(null)} disabled={pending}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={confirmDelete} disabled={pending}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
