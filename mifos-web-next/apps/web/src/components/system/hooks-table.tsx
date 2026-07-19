'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractHookListItem } from '@mifos/api-client';
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
  type PaginationState
} from '@tanstack/react-table';
import { Circle } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { DataTable } from '@/components/composites/data-table/data-table';
import { DataTablePagination } from '@/components/composites/data-table/data-table-pagination';
import { Input } from '@/components/ui/input';
import { hookTemplateLabel } from '@/lib/fineract/hook-display';
import { cn } from '@/lib/utils';

export function HooksTable({ hooks }: { hooks: FineractHookListItem[] }) {
  const [filter, setFilter] = useState('');
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25
  });

  const columns = useMemo<ColumnDef<FineractHookListItem>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Hook template',
        cell: ({ row }) => hookTemplateLabel(row.original.name)
      },
      {
        accessorKey: 'displayName',
        header: 'Hook name',
        cell: ({ row }) => (
          <Link
            href={`/system/hooks/${row.original.id}`}
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            {row.original.displayName}
          </Link>
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
                row.original.isActive ? 'text-primary' : 'text-muted-foreground'
              )}
              aria-hidden
            />
            <span className="text-sm text-muted-foreground">
              {row.original.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        )
      }
    ],
    []
  );

  const table = useReactTable({
    data: hooks,
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
      const hook = row.original;
      return (
        hook.displayName.toLowerCase().includes(query) ||
        hook.name.toLowerCase().includes(query) ||
        hookTemplateLabel(hook.name).toLowerCase().includes(query)
      );
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  });

  return (
    <div className="space-y-4">
      <Input
        placeholder="Filter hooks…"
        value={filter}
        onChange={(event) => {
          setFilter(event.target.value);
          setPagination((current) => ({ ...current, pageIndex: 0 }));
        }}
        className="max-w-sm"
        aria-label="Filter hooks"
      />
      <DataTable
        table={table}
        stickyHeader={false}
        emptyMessage="No hooks found"
        emptyDescription="Create a hook to run custom actions when platform events occur."
      />
      <DataTablePagination table={table} totalRecords={table.getFilteredRowModel().rows.length} />
    </div>
  );
}
