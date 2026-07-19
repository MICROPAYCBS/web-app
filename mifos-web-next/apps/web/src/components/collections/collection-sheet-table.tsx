'use client';

/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
  type PaginationState
} from '@tanstack/react-table';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { DataTable } from '@/components/composites/data-table/data-table';
import { DataTablePagination } from '@/components/composites/data-table/data-table-pagination';
import { Input } from '@/components/ui/input';
import type { CollectionSheetRow } from '@/lib/collections/collection-sheet-rows';
import { formatFineractDateArray } from '@/lib/fineract/dates';
import { formatAccountMoney } from '@/lib/fineract/format-account-money';

export function CollectionSheetTable({ rows }: { rows: CollectionSheetRow[] }) {
  const [filter, setFilter] = useState('');
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25
  });

  const columns = useMemo<ColumnDef<CollectionSheetRow>[]>(
    () => [
      {
        id: 'clientName',
        header: 'Customer',
        accessorFn: (row) => row.clientName,
        cell: ({ row }) => (
          <Link
            href={`/clients/${row.original.clientId}`}
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            {row.original.clientName}
          </Link>
        )
      },
      {
        id: 'loanAmountDue',
        header: 'Loan due',
        accessorFn: (row) => row.loanAmountDue,
        cell: ({ row }) => (
          <span className="block text-right tabular-nums">
            {formatAccountMoney(row.original.loanAmountDue)}
          </span>
        )
      },
      {
        id: 'savingsDue',
        header: 'Savings due',
        accessorFn: (row) => row.savingsDue,
        cell: ({ row }) => (
          <span className="block text-right tabular-nums">
            {formatAccountMoney(row.original.savingsDue)}
          </span>
        )
      },
      {
        id: 'totalAmountDue',
        header: 'Total due',
        accessorFn: (row) => row.totalAmountDue,
        cell: ({ row }) => (
          <span className="block text-right font-medium tabular-nums">
            {formatAccountMoney(row.original.totalAmountDue)}
          </span>
        )
      },
      {
        id: 'dueDate',
        header: 'Collection date',
        accessorFn: (row) => formatFineractDateArray(row.dueDate) ?? '',
        cell: ({ row }) => formatFineractDateArray(row.original.dueDate) ?? '—'
      }
    ],
    []
  );

  const table = useReactTable({
    data: rows,
    columns,
    state: { globalFilter: filter, pagination },
    onPaginationChange: setPagination,
    onGlobalFilterChange: setFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: (row, _columnId, value) => {
      const query = String(value ?? '')
        .trim()
        .toLowerCase();
      if (!query) {
        return true;
      }
      return row.original.clientName.toLowerCase().includes(query);
    }
  });

  return (
    <div className="space-y-3">
      <Input
        value={filter}
        onChange={(event) => setFilter(event.target.value)}
        placeholder="Search customers…"
        className="max-w-sm"
      />
      <DataTable table={table} emptyMessage="No repayments due for these parameters." />
      <DataTablePagination
        table={table}
        totalRecords={table.getFilteredRowModel().rows.length}
      />
    </div>
  );
}
