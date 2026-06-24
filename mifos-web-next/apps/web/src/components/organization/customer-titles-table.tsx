'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { CustomerTitle, CustomerTitleTemplate } from '@mifos/api-client';
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
import { deleteCustomerTitleAction } from '@/actions/customer-title';
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
import { customerTitleEditPath } from '@/lib/fineract/customer-title-paths';
import { cn } from '@/lib/utils';

function genderLabel(genderId: number | null | undefined, template: CustomerTitleTemplate): string {
  if (genderId == null) {
    return 'Neutral';
  }
  return template.genderOptions.find((option) => option.id === genderId)?.name ?? String(genderId);
}

export function CustomerTitlesTable({
  customerTitles,
  template,
  canEdit,
  canDelete
}: {
  customerTitles: CustomerTitle[];
  template: CustomerTitleTemplate;
  canEdit: boolean;
  canDelete: boolean;
}) {
  const [filter, setFilter] = useState('');
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 25 });
  const router = useRouter();
  const [deleteTarget, setDeleteTarget] = useState<CustomerTitle | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const filteredRows = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) {
      return customerTitles;
    }
    return customerTitles.filter((row) =>
      [row.titleCode, row.titleName, genderLabel(row.genderId, template), row.status]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  }, [customerTitles, filter, template]);

  const columns = useMemo<ColumnDef<CustomerTitle>[]>(
    () => [
      {
        accessorKey: 'titleCode',
        header: 'Code',
        cell: ({ row }) => <span className="font-mono text-sm">{row.original.titleCode}</span>
      },
      {
        accessorKey: 'titleName',
        header: 'Name'
      },
      {
        id: 'gender',
        header: 'Gender',
        cell: ({ row }) => genderLabel(row.original.genderId, template)
      },
      {
        accessorKey: 'displayOrder',
        header: 'Order',
        cell: ({ row }) => row.original.displayOrder ?? '—'
      },
      {
        accessorKey: 'status',
        header: 'Status'
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <div className="flex justify-end gap-2">
            {canEdit ? (
              <Link
                href={customerTitleEditPath(row.original.id)}
                className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }))}
                aria-label={`Edit ${row.original.titleName}`}
              >
                <Pencil className="size-4" />
              </Link>
            ) : null}
            {canDelete ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Delete ${row.original.titleName}`}
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
    [canDelete, canEdit, template]
  );

  const table = useReactTable({
    data: filteredRows,
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
      const result = await deleteCustomerTitleAction(deleteTarget.id);
      if (!result.ok) {
        setActionError(formatActionErrorMessage(result));
        return;
      }
      setDeleteTarget(null);
      router.refresh();
    });
  }

  return (
    <>
      <div className="mb-4">
        <Input
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          placeholder="Filter customer titles…"
          className="max-w-sm"
        />
      </div>
      <DataTable table={table} />
      <DataTablePagination table={table} />
      <Dialog open={deleteTarget != null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete customer title</DialogTitle>
            <DialogDescription>
              Delete &ldquo;{deleteTarget?.titleName}&rdquo;? Customers already using this title may
              be affected.
            </DialogDescription>
          </DialogHeader>
          {actionError ? <p className="text-sm text-destructive">{actionError}</p> : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" disabled={pending} onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
