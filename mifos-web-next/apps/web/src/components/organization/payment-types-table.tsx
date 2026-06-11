'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { OrganizationPaymentType } from '@mifos/api-client';
import { formatActionErrorMessage } from '@mifos/validation';
import {
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
  type PaginationState
} from '@tanstack/react-table';
import { CheckCircle2, Pencil, Trash2, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState, useTransition } from 'react';
import { deletePaymentTypeAction } from '@/actions/payment-type';
import { DataTable } from '@/components/composites/data-table/data-table';
import { DataTablePagination } from '@/components/composites/data-table/data-table-pagination';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { paymentTypeEditPath } from '@/lib/fineract/payment-type-paths';
import { cn } from '@/lib/utils';

function BooleanIcon({ value }: { value?: boolean }) {
  return value ? (
    <CheckCircle2 className="mx-auto size-4 text-primary" aria-label="Yes" />
  ) : (
    <XCircle className="mx-auto size-4 text-muted-foreground" aria-label="No" />
  );
}

export function PaymentTypesTable({
  paymentTypes,
  canEdit,
  canDelete
}: {
  paymentTypes: OrganizationPaymentType[];
  canEdit: boolean;
  canDelete: boolean;
}) {
  const [filter, setFilter] = useState('');
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25
  });
  const router = useRouter();
  const [deleteTarget, setDeleteTarget] = useState<OrganizationPaymentType | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const filteredRows = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) {
      return paymentTypes;
    }
    return paymentTypes.filter((row) => {
      const haystack = [
        row.name,
        row.description,
        row.codeName,
        row.position,
        row.isSystemDefined ? 'system' : 'custom',
        row.isCashPayment ? 'cash' : 'non-cash'
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [paymentTypes, filter]);

  const columns = useMemo<ColumnDef<OrganizationPaymentType>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => <span className="font-medium">{row.original.name}</span>
      },
      {
        accessorKey: 'description',
        header: 'Description',
        cell: ({ row }) => row.original.description ?? '—'
      },
      {
        accessorKey: 'codeName',
        header: 'Code',
        cell: ({ row }) => row.original.codeName ?? '—'
      },
      {
        id: 'isSystemDefined',
        header: 'System defined',
        cell: ({ row }) => <BooleanIcon value={row.original.isSystemDefined} />
      },
      {
        id: 'isCashPayment',
        header: 'Cash payment',
        cell: ({ row }) => <BooleanIcon value={row.original.isCashPayment} />
      },
      {
        accessorKey: 'position',
        header: 'Position',
        cell: ({ row }) => row.original.position ?? '—'
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-2">
            {canEdit ? (
              <Link
                href={paymentTypeEditPath(row.original.id)}
                className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
              >
                <Pencil className="mr-1 size-4" />
                Edit
              </Link>
            ) : null}
            {canDelete && !row.original.isSystemDefined ? (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => {
                  setActionError(null);
                  setDeleteTarget(row.original);
                }}
              >
                <Trash2 className="mr-1 size-4" />
                Delete
              </Button>
            ) : null}
          </div>
        )
      }
    ],
    [canDelete, canEdit]
  );

  const table = useReactTable({
    data: filteredRows,
    columns,
    state: { pagination },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  });

  function handleDelete() {
    if (!deleteTarget) {
      return;
    }
    setActionError(null);
    startTransition(async () => {
      const result = await deletePaymentTypeAction(deleteTarget.id);
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
      <div className="space-y-4">
        <Input
          placeholder="Filter payment types…"
          value={filter}
          onChange={(event) => {
            setFilter(event.target.value);
            setPagination((prev) => ({ ...prev, pageIndex: 0 }));
          }}
          className="max-w-sm"
          aria-label="Filter payment types"
        />
        <DataTable
          table={table}
          emptyMessage="No payment types found"
          emptyDescription="Create a payment type to classify how money is received or disbursed."
        />
        <DataTablePagination table={table} totalRecords={filteredRows.length} />
      </div>

      <Dialog open={deleteTarget != null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete payment type</DialogTitle>
            <DialogDescription>
              Delete {deleteTarget?.name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {actionError ? <p className="text-sm text-destructive">{actionError}</p> : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={handleDelete} disabled={pending}>
              {pending ? 'Deleting…' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
