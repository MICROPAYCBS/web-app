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
import { deleteDepartmentAction } from '@/actions/department';
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
import { departmentEditPath } from '@/lib/fineract/department-paths';
import type { Department } from '@/lib/fineract/departments';
import { cn } from '@/lib/utils';

export function DepartmentsTable({
  departments,
  canEdit,
  canDelete
}: {
  departments: Department[];
  canEdit: boolean;
  canDelete: boolean;
}) {
  const [filter, setFilter] = useState('');
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 25 });
  const router = useRouter();
  const [deleteTarget, setDeleteTarget] = useState<Department | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const filteredRows = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) {
      return departments;
    }
    return departments.filter((row) =>
      [row.departmentCode, row.departmentName, row.officeName, row.active ? 'active' : 'inactive']
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  }, [departments, filter]);

  const columns = useMemo<ColumnDef<Department>[]>(
    () => [
      {
        accessorKey: 'departmentCode',
        header: 'Code',
        cell: ({ row }) => <span className="font-mono text-sm">{row.original.departmentCode}</span>
      },
      { accessorKey: 'departmentName', header: 'Name' },
      {
        accessorKey: 'officeName',
        header: 'Branch',
        cell: ({ row }) => row.original.officeName ?? 'All branches'
      },
      {
        accessorKey: 'active',
        header: 'Status',
        cell: ({ row }) => (row.original.active === false ? 'Inactive' : 'Active')
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <div className="flex justify-end gap-2">
            {canEdit ? (
              <Link
                href={departmentEditPath(row.original.id)}
                className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }))}
                aria-label={`Edit ${row.original.departmentName}`}
              >
                <Pencil className="size-4" />
              </Link>
            ) : null}
            {canDelete ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Delete ${row.original.departmentName}`}
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
      const result = await deleteDepartmentAction(deleteTarget.id);
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
          placeholder="Filter departments…"
          className="max-w-sm"
        />
      </div>
      <DataTable table={table} />
      <DataTablePagination table={table} totalRecords={filteredRows.length} />
      <Dialog open={deleteTarget != null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete department</DialogTitle>
            <DialogDescription>
              Delete &ldquo;{deleteTarget?.departmentName}&rdquo;? Journal lines tagged with this
              department will keep their historical reference.
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
