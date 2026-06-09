'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractRoleListItem } from '@mifos/api-client';
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
  type PaginationState
} from '@tanstack/react-table';
import { Circle, Pencil } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { DataTable } from '@/components/composites/data-table/data-table';
import { DataTablePagination } from '@/components/composites/data-table/data-table-pagination';
import { buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { isSuperUserRole } from '@/lib/fineract/role-display';
import { cn } from '@/lib/utils';

export function RolesTable({
  roles,
  canUpdate
}: {
  roles: FineractRoleListItem[];
  canUpdate: boolean;
}) {
  const [filter, setFilter] = useState('');
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25
  });

  const columns = useMemo<ColumnDef<FineractRoleListItem>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => (
          <Link
            href={`/system/roles-and-permissions/${row.original.id}`}
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            {row.original.name}
          </Link>
        )
      },
      {
        accessorKey: 'description',
        header: 'Description',
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.description || '—'}</span>
        )
      },
      {
        id: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Circle
              className={cn(
                'size-3 fill-current',
                row.original.disabled ? 'text-muted-foreground' : 'text-primary'
              )}
              aria-hidden
            />
            <span className="text-sm text-muted-foreground">
              {row.original.disabled ? 'Disabled' : 'Enabled'}
            </span>
          </div>
        )
      },
      {
        id: 'actions',
        header: 'Actions',
        meta: { sticky: 'right' },
        cell: ({ row }) =>
          canUpdate && !isSuperUserRole(row.original.name) ? (
            <Link
              href={`/system/roles-and-permissions/${row.original.id}/edit`}
              className={cn(buttonVariants({ variant: 'ghost', size: 'icon-sm' }))}
              aria-label={`Edit ${row.original.name}`}
              onClick={(event) => event.stopPropagation()}
            >
              <Pencil className="size-4" />
            </Link>
          ) : null
      }
    ],
    [canUpdate]
  );

  const table = useReactTable({
    data: roles,
    columns,
    state: {
      pagination,
      globalFilter: filter
    },
    onPaginationChange: setPagination,
    onGlobalFilterChange: setFilter,
    globalFilterFn: (row, _columnId, filterValue) => {
      const query = String(filterValue).trim().toLowerCase();
      if (!query) {
        return true;
      }
      const role = row.original;
      return (
        role.name.toLowerCase().includes(query) || role.description.toLowerCase().includes(query)
      );
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  });

  return (
    <div className="space-y-4">
      <Input
        placeholder="Filter roles…"
        value={filter}
        onChange={(event) => {
          setFilter(event.target.value);
          setPagination((current) => ({ ...current, pageIndex: 0 }));
        }}
        className="max-w-sm"
        aria-label="Filter roles"
      />
      <DataTable
        table={table}
        stickyHeader={false}
        emptyMessage="No roles found"
        emptyDescription="Create a role to assign permissions to users."
      />
      <DataTablePagination table={table} totalRecords={table.getFilteredRowModel().rows.length} />
    </div>
  );
}
