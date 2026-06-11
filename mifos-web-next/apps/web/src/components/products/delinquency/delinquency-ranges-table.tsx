'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { DelinquencyRangeListItem } from '@mifos/api-client';
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
import { formatDelinquencyDays } from '@/lib/fineract/delinquency-display';
import { delinquencyRangeDetailPath } from '@/lib/fineract/delinquency-paths';

const columns: ColumnDef<DelinquencyRangeListItem>[] = [
  {
    accessorKey: 'classification',
    header: 'Classification',
    cell: ({ row }) => (
      <Link
        href={delinquencyRangeDetailPath(row.original.id)}
        className="font-medium text-primary underline-offset-4 hover:underline"
      >
        {row.original.classification ?? '—'}
      </Link>
    )
  },
  {
    id: 'minimumAgeDays',
    header: () => <span className="block w-full text-right">Days from</span>,
    cell: ({ row }) => (
      <span className="block w-full text-right tabular-nums">
        {formatDelinquencyDays(row.original.minimumAgeDays)}
      </span>
    )
  },
  {
    id: 'maximumAgeDays',
    header: () => <span className="block w-full text-right">Days till</span>,
    cell: ({ row }) => (
      <span className="block w-full text-right tabular-nums">
        {formatDelinquencyDays(row.original.maximumAgeDays)}
      </span>
    )
  }
];

export function DelinquencyRangesTable({ ranges }: { ranges: DelinquencyRangeListItem[] }) {
  const [filter, setFilter] = useState('');
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25
  });

  const filteredRows = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) {
      return ranges;
    }
    return ranges.filter((row) => {
      const haystack = [
        row.classification,
        formatDelinquencyDays(row.minimumAgeDays),
        formatDelinquencyDays(row.maximumAgeDays)
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [ranges, filter]);

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
        placeholder="Filter delinquency ranges…"
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
        emptyMessage="No delinquency ranges match your filter."
      />
      <DataTablePagination table={table} totalRecords={filteredRows.length} />
    </div>
  );
}
