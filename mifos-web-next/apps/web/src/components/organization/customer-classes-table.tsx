'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { CustomerClass } from '@mifos/api-client';
import { formatLegalFormLabel } from '@/lib/fineract/customer-class-eligibility';
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
import { deleteCustomerClassAction } from '@/actions/customer-class';
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
import { customerClassEditPath } from '@/lib/fineract/customer-class-paths';
import { cn } from '@/lib/utils';

export function CustomerClassesTable({
  customerClasses,
  canEdit,
  canDelete
}: {
  customerClasses: CustomerClass[];
  canEdit: boolean;
  canDelete: boolean;
}) {
  const [filter, setFilter] = useState('');
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 25 });
  const router = useRouter();
  const [deleteTarget, setDeleteTarget] = useState<CustomerClass | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const filteredRows = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) {
      return customerClasses;
    }
    return customerClasses.filter((row) =>
      [row.classCode, row.className, row.description, formatLegalFormLabel(row.legalFormId), row.customerType, row.riskLevel, row.status]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  }, [customerClasses, filter]);

  const columns = useMemo<ColumnDef<CustomerClass>[]>(
    () => [
      {
        accessorKey: 'classCode',
        header: 'Code',
        cell: ({ row }) => <span className="font-mono text-sm">{row.original.classCode}</span>
      },
      {
        accessorKey: 'className',
        header: 'Name',
        cell: ({ row }) => <span className="font-medium">{row.original.className}</span>
      },
      {
        accessorKey: 'legalFormId',
        header: 'Legal form',
        cell: ({ row }) => formatLegalFormLabel(row.original.legalFormId) ?? '—'
      },
      {
        accessorKey: 'customerType',
        header: 'Segment',
        cell: ({ row }) => row.original.customerType ?? '—'
      },
      {
        accessorKey: 'riskLevel',
        header: 'Risk',
        cell: ({ row }) => row.original.riskLevel ?? '—'
      },
      {
        accessorKey: 'kycLevel',
        header: 'KYC',
        cell: ({ row }) => row.original.kycLevel ?? '—'
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => row.original.status ?? '—'
      },
      {
        id: 'actions',
        header: 'Actions',
        meta: { sticky: 'right' },
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            {canEdit ? (
              <Link
                href={customerClassEditPath(row.original.id)}
                className={cn(buttonVariants({ variant: 'ghost', size: 'icon-sm' }))}
                aria-label={`Edit ${row.original.className}`}
              >
                <Pencil className="size-4" />
              </Link>
            ) : null}
            {canDelete ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="text-destructive hover:text-destructive"
                aria-label={`Delete ${row.original.className}`}
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
      const result = await deleteCustomerClassAction(deleteTarget.id);
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
          placeholder="Filter customer classes…"
          value={filter}
          onChange={(event) => {
            setFilter(event.target.value);
            setPagination((prev) => ({ ...prev, pageIndex: 0 }));
          }}
          className="max-w-sm"
          aria-label="Filter customer classes"
        />
        <DataTable
          table={table}
          stickyHeader={false}
          emptyMessage="No customer classes found"
          emptyDescription="Create a customer class to define onboarding rules and product eligibility."
        />
        <DataTablePagination table={table} totalRecords={filteredRows.length} />
      </div>

      <Dialog open={deleteTarget != null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete customer class</DialogTitle>
            <DialogDescription>
              Delete {deleteTarget?.className} ({deleteTarget?.classCode})? This action cannot be
              undone.
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
