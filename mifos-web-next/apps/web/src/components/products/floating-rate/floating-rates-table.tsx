'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FloatingRateListItem } from '@mifos/api-client';
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
import { formatFloatingRateYesNo } from '@/lib/fineract/floating-rate-display';
import { floatingRateDetailPath } from '@/lib/fineract/floating-rate-paths';

const columns: ColumnDef<FloatingRateListItem>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ row }) => (
      <Link
        href={floatingRateDetailPath(row.original.id)}
        className="font-medium text-primary underline-offset-4 hover:underline"
      >
        {row.original.name ?? '—'}
      </Link>
    )
  },
  {
    id: 'createdBy',
    header: 'Created by',
    cell: ({ row }) => row.original.createdBy ?? '—'
  },
  {
    id: 'isBaseLendingRate',
    header: 'Base lending rate',
    cell: ({ row }) => formatFloatingRateYesNo(row.original.isBaseLendingRate ?? false)
  },
  {
    id: 'isActive',
    header: 'Active',
    cell: ({ row }) => formatFloatingRateYesNo(row.original.isActive ?? false)
  }
];

export function FloatingRatesTable({ rates }: { rates: FloatingRateListItem[] }) {
  const [filter, setFilter] = useState('');
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25
  });

  const filteredRows = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) {
      return rates;
    }
    return rates.filter((row) => {
      const haystack = [
        row.name,
        row.createdBy,
        formatFloatingRateYesNo(row.isBaseLendingRate ?? false),
        formatFloatingRateYesNo(row.isActive ?? false)
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [rates, filter]);

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
        placeholder="Filter floating rates…"
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
        emptyMessage="No floating rates match your filter."
      />
      <DataTablePagination table={table} totalRecords={filteredRows.length} />
    </div>
  );
}
