'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractGlAccountListItem } from '@mifos/api-client';
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
  type PaginationState
} from '@tanstack/react-table';
import { Check, Circle, X } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { DataTable } from '@/components/composites/data-table/data-table';
import { DataTablePagination } from '@/components/composites/data-table/data-table-pagination';
import { Input } from '@/components/ui/input';
import { formatGlAccountTypeLabel } from '@/lib/accounting/gl-account-display';
import { cn } from '@/lib/utils';

export function GlAccountsTable({ accounts }: { accounts: FineractGlAccountListItem[] }) {
  const [filter, setFilter] = useState('');
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25
  });

  const columns = useMemo<ColumnDef<FineractGlAccountListItem>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Account',
        cell: ({ row }) => (
          <Link
            href={`/accounting/chart-of-accounts/${row.original.id}`}
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            {row.original.name}
          </Link>
        )
      },
      {
        accessorKey: 'glCode',
        header: 'GL code',
        cell: ({ row }) => row.original.glCode
      },
      {
        id: 'type',
        header: 'Type',
        cell: ({ row }) => formatGlAccountTypeLabel(row.original.type)
      },
      {
        id: 'disabled',
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
        id: 'manualEntriesAllowed',
        header: 'Manual entries',
        cell: ({ row }) =>
          row.original.manualEntriesAllowed ? (
            <Check className="size-4 text-primary" aria-label="Allowed" />
          ) : (
            <X className="size-4 text-muted-foreground" aria-label="Not allowed" />
          )
      },
      {
        id: 'usage',
        header: 'Used as',
        cell: ({ row }) => row.original.usage.value
      }
    ],
    []
  );

  const table = useReactTable({
    data: accounts,
    columns,
    state: { pagination, globalFilter: filter },
    onPaginationChange: setPagination,
    onGlobalFilterChange: setFilter,
    globalFilterFn: (row, _columnId, filterValue) => {
      const query = String(filterValue).trim().toLowerCase();
      if (!query) {
        return true;
      }
      const account = row.original;
      return (
        account.name.toLowerCase().includes(query) ||
        account.glCode.toLowerCase().includes(query) ||
        (account.type.value ?? '').toLowerCase().includes(query) ||
        (account.usage.value ?? '').toLowerCase().includes(query)
      );
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  });

  return (
    <div className="space-y-4">
      <Input
        placeholder="Filter accounts…"
        value={filter}
        onChange={(event) => {
          setFilter(event.target.value);
          setPagination((current) => ({ ...current, pageIndex: 0 }));
        }}
        className="max-w-sm"
        aria-label="Filter GL accounts"
      />
      <DataTable
        table={table}
        stickyHeader={false}
        emptyMessage="No GL accounts found"
        emptyDescription="Add an account to build your chart of accounts."
      />
      <DataTablePagination table={table} totalRecords={table.getFilteredRowModel().rows.length} />
    </div>
  );
}
