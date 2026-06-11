'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { TaxComponentListItem } from '@mifos/api-client';
import {
  getCoreRowModel,
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
import {
  formatTaxDate,
  formatTaxGlAccount
} from '@/lib/fineract/tax-display';
import { taxComponentDetailPath } from '@/lib/fineract/tax-paths';

const columns: ColumnDef<TaxComponentListItem>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ row }) => (
      <Link
        href={taxComponentDetailPath(row.original.id)}
        className="font-medium text-primary underline-offset-4 hover:underline"
      >
        {row.original.name ?? '—'}
      </Link>
    )
  },
  {
    id: 'percentage',
    header: () => <span className="block w-full text-right">Percentage</span>,
    cell: ({ row }) => (
      <span className="block w-full text-right tabular-nums">
        {row.original.percentage !== undefined ? `${row.original.percentage}%` : '—'}
      </span>
    )
  },
  {
    id: 'startDate',
    header: 'Start date',
    cell: ({ row }) => formatTaxDate(row.original.startDate)
  },
  {
    id: 'account',
    header: 'Account',
    cell: ({ row }) => formatTaxGlAccount(row.original.creditAccount)
  }
];

export function TaxComponentsTable({ components }: { components: TaxComponentListItem[] }) {
  const [filter, setFilter] = useState('');
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25
  });

  const filteredRows = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) {
      return components;
    }
    return components.filter((row) => {
      const haystack = [
        row.name,
        String(row.percentage ?? ''),
        formatTaxDate(row.startDate),
        formatTaxGlAccount(row.creditAccount)
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [components, filter]);

  const table = useReactTable({
    data: filteredRows,
    columns,
    state: { pagination },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  });

  return (
    <div className="space-y-4">
      <Input
        placeholder="Filter tax components…"
        value={filter}
        onChange={(event) => {
          setFilter(event.target.value);
          setPagination((prev) => ({ ...prev, pageIndex: 0 }));
        }}
        className="max-w-sm"
      />
      <DataTable
        table={table}
        stickyHeader={false}
        emptyMessage="No tax components match your filter."
      />
      <DataTablePagination table={table} totalRecords={filteredRows.length} />
    </div>
  );
}
