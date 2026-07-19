'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractEntityDatatableCheck } from '@mifos/api-client';
import { Can } from '@mifos/auth';
import {
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
  type PaginationState
} from '@tanstack/react-table';
import { CircleCheck, CircleX, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useState, useTransition } from 'react';
import { deleteEntityDatatableCheckAction } from '@/actions/entity-datatable-check';
import { DataTable } from '@/components/composites/data-table/data-table';
import { DataTablePagination } from '@/components/composites/data-table/data-table-pagination';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { formatEntityCheckEntity } from '@/lib/fineract/entity-datatable-check-display';

function formatStatus(status: FineractEntityDatatableCheck['status']): string {
  return status?.value ?? status?.code ?? '—';
}

export function EntityDatatableChecksTable({
  checks
}: {
  checks: FineractEntityDatatableCheck[];
}) {
  const router = useRouter();
  const [filter, setFilter] = useState('');
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25
  });
  const [deleteTarget, setDeleteTarget] = useState<FineractEntityDatatableCheck | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const filteredRows = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) {
      return checks;
    }
    return checks.filter((row) => {
      const haystack = [
        row.entity,
        formatEntityCheckEntity(row.entity),
        row.productName,
        row.datatableName,
        formatStatus(row.status)
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [checks, filter]);

  const columns = useMemo<ColumnDef<FineractEntityDatatableCheck>[]>(
    () => [
      {
        id: 'entity',
        header: 'Entity',
        cell: ({ row }) => formatEntityCheckEntity(row.original.entity)
      },
      {
        accessorKey: 'productName',
        header: 'Product name',
        cell: ({ row }) => row.original.productName ?? '—'
      },
      {
        accessorKey: 'datatableName',
        header: 'Data table'
      },
      {
        id: 'status',
        header: 'Status',
        cell: ({ row }) => formatStatus(row.original.status)
      },
      {
        id: 'systemDefined',
        header: 'System defined',
        cell: ({ row }) =>
          row.original.systemDefined ? (
            <CircleCheck className="size-5 text-primary" aria-label="Yes" />
          ) : (
            <CircleX className="size-5 text-muted-foreground" aria-label="No" />
          )
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <Can permission="DELETE_ENTITY_DATATABLE_CHECK">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => {
                setActionError(null);
                setDeleteTarget(row.original);
              }}
            >
              <Trash2 className="mr-2 size-4" />
              Delete
            </Button>
          </Can>
        )
      }
    ],
    []
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
      const result = await deleteEntityDatatableCheckAction(deleteTarget.id);
      if (!result.ok) {
        setActionError(result.message);
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
          placeholder="Filter checks…"
          value={filter}
          onChange={(event) => {
            setFilter(event.target.value);
            setPagination((prev) => ({ ...prev, pageIndex: 0 }));
          }}
          className="max-w-sm"
          aria-label="Filter entity data table checks"
        />
        <DataTable
          table={table}
          emptyMessage="No entity data table checks found"
          emptyDescription="Create a check to require a data table when an entity reaches a status."
        />
        <DataTablePagination table={table} totalRecords={filteredRows.length} />
      </div>

      <Dialog open={deleteTarget != null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete entity data table check</DialogTitle>
            <DialogDescription>
              Delete check #{deleteTarget?.id} for &ldquo;{deleteTarget?.datatableName}&rdquo;?
              This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {actionError ? <p className="text-sm text-destructive">{actionError}</p> : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={handleDelete} disabled={pending}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
