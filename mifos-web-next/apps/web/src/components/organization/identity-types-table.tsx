'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { IdentityType } from '@mifos/api-client';
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
import { deleteIdentityTypeAction } from '@/actions/identity-type';
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
import { identityTypeEditPath } from '@/lib/fineract/identity-type-paths';
import { cn } from '@/lib/utils';

export function IdentityTypesTable({
  identityTypes,
  canEdit,
  canDelete
}: {
  identityTypes: IdentityType[];
  canEdit: boolean;
  canDelete: boolean;
}) {
  const [filter, setFilter] = useState('');
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 25 });
  const router = useRouter();
  const [deleteTarget, setDeleteTarget] = useState<IdentityType | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const filteredRows = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) {
      return identityTypes;
    }
    return identityTypes.filter((row) =>
      [
        row.codeValueName,
        row.example,
        row.formatDescription,
        row.validationRegex,
        row.status
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  }, [identityTypes, filter]);

  const columns = useMemo<ColumnDef<IdentityType>[]>(
    () => [
      {
        accessorKey: 'codeValueName',
        header: 'Identifier type'
      },
      {
        accessorKey: 'example',
        header: 'Example',
        cell: ({ row }) => row.original.example ?? '—'
      },
      {
        accessorKey: 'formatDescription',
        header: 'Format',
        cell: ({ row }) => row.original.formatDescription ?? '—'
      },
      {
        accessorKey: 'validationRegex',
        header: 'Regex',
        cell: ({ row }) =>
          row.original.validationRegex ? (
            <span className="font-mono text-xs">{row.original.validationRegex}</span>
          ) : (
            '—'
          )
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
                href={identityTypeEditPath(row.original.id)}
                className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }))}
                aria-label={`Edit ${row.original.codeValueName}`}
              >
                <Pencil className="size-4" />
              </Link>
            ) : null}
            {canDelete ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Delete ${row.original.codeValueName}`}
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

  function confirmDelete() {
    if (!deleteTarget) {
      return;
    }
    startTransition(async () => {
      const result = await deleteIdentityTypeAction(deleteTarget.id);
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
      <div className="mb-4">
        <Input
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          placeholder="Filter identity type guides…"
          className="max-w-sm"
        />
      </div>
      <DataTable table={table} />
      <DataTablePagination table={table} totalRecords={filteredRows.length} />
      <Dialog open={deleteTarget != null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete identity type guide</DialogTitle>
            <DialogDescription>
              Delete the guide for &ldquo;{deleteTarget?.codeValueName}&rdquo;? Customers may no
              longer see format hints for this identifier type.
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
