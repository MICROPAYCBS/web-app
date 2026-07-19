'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

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
import { deleteSectorAction } from '@/actions/sector';
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
import { sectorEditPath } from '@/lib/fineract/sector-paths';
import type { Sector } from '@/lib/fineract/sectors';
import { cn } from '@/lib/utils';

export function SectorsTable({
  sectors,
  canEdit,
  canDelete
}: {
  sectors: Sector[];
  canEdit: boolean;
  canDelete: boolean;
}) {
  const [filter, setFilter] = useState('');
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 25 });
  const router = useRouter();
  const [deleteTarget, setDeleteTarget] = useState<Sector | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const filteredRows = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) {
      return sectors;
    }
    return sectors.filter((row) =>
      [row.sectorCode, row.sectorName, row.parentSectorName, row.riskLevel, row.status]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  }, [sectors, filter]);

  const columns = useMemo<ColumnDef<Sector>[]>(
    () => [
      {
        accessorKey: 'sectorCode',
        header: 'Code',
        cell: ({ row }) => <span className="font-mono text-sm">{row.original.sectorCode}</span>
      },
      { accessorKey: 'sectorName', header: 'Name' },
      {
        accessorKey: 'parentSectorName',
        header: 'Parent',
        cell: ({ row }) => row.original.parentSectorName ?? '—'
      },
      {
        accessorKey: 'riskLevel',
        header: 'Risk',
        cell: ({ row }) => row.original.riskLevel ?? '—'
      },
      { accessorKey: 'status', header: 'Status' },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <div className="flex justify-end gap-2">
            {canEdit ? (
              <Link
                href={sectorEditPath(row.original.id)}
                className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }))}
                aria-label={`Edit ${row.original.sectorName}`}
              >
                <Pencil className="size-4" />
              </Link>
            ) : null}
            {canDelete ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Delete ${row.original.sectorName}`}
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
      const result = await deleteSectorAction(deleteTarget.id);
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
          placeholder="Filter sectors…"
          className="max-w-sm"
        />
      </div>
      <DataTable table={table} />
      <DataTablePagination table={table} totalRecords={filteredRows.length} />
      <Dialog open={deleteTarget != null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete sector</DialogTitle>
            <DialogDescription>
              Delete &ldquo;{deleteTarget?.sectorName}&rdquo;? Industries linked to this sector may be affected.
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
