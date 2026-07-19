'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { DelinquencyBucketListItem } from '@mifos/api-client';
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
  bucketTypeToQueryParam,
  formatDelinquencyBucketType
} from '@/lib/fineract/delinquency-display';
import { delinquencyBucketDetailPath } from '@/lib/fineract/delinquency-paths';

const columns: ColumnDef<DelinquencyBucketListItem>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ row }) => (
      <Link
        href={delinquencyBucketDetailPath(row.original.id, bucketTypeToQueryParam(row.original.bucketType))}
        className="font-medium text-primary underline-offset-4 hover:underline"
      >
        {row.original.name ?? '—'}
      </Link>
    )
  },
  {
    id: 'bucketType',
    header: 'Type',
    cell: ({ row }) => formatDelinquencyBucketType(row.original.bucketType)
  }
];

export function DelinquencyBucketsTable({ buckets }: { buckets: DelinquencyBucketListItem[] }) {
  const [filter, setFilter] = useState('');
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25
  });

  const filteredRows = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) {
      return buckets;
    }
    return buckets.filter((row) => {
      const haystack = [row.name, formatDelinquencyBucketType(row.bucketType)].join(' ').toLowerCase();
      return haystack.includes(q);
    });
  }, [buckets, filter]);

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
        placeholder="Filter delinquency buckets…"
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
        emptyMessage="No delinquency buckets match your filter."
      />
      <DataTablePagination table={table} totalRecords={filteredRows.length} />
    </div>
  );
}
