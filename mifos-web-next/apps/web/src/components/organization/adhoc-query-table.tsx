'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { AdhocQueryListItem } from '@mifos/api-client';
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
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { adhocQueryDetailPath } from '@/lib/fineract/adhoc-query-paths';
import { formatAdhocQueryActive } from '@/lib/fineract/adhoc-query-display';

export function AdhocQueryTable({ queries }: { queries: AdhocQueryListItem[] }) {
  const [filter, setFilter] = useState('');
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25
  });

  const filteredRows = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) {
      return queries;
    }
    return queries.filter((row) => {
      const haystack = [
        row.name,
        row.query,
        row.tableName,
        row.email,
        row.reportRunFrequencyLabel,
        row.createdBy
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [queries, filter]);

  const columns = useMemo<ColumnDef<AdhocQueryListItem>[]>(
    () => [
      {
        id: 'name',
        header: 'Name',
        cell: ({ row }) => (
          <Link
            href={adhocQueryDetailPath(row.original.id)}
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            {row.original.name}
          </Link>
        )
      },
      {
        accessorKey: 'query',
        header: 'SQL query',
        cell: ({ row }) => (
          <span className="line-clamp-2 max-w-md font-mono text-xs" title={row.original.query}>
            {row.original.query ?? '—'}
          </span>
        )
      },
      {
        accessorKey: 'tableName',
        header: 'Table affected',
        cell: ({ row }) => row.original.tableName ?? '—'
      },
      {
        accessorKey: 'email',
        header: 'Email',
        cell: ({ row }) => row.original.email ?? '—'
      },
      {
        id: 'reportRunFrequency',
        header: 'Report run frequency',
        cell: ({ row }) => row.original.reportRunFrequencyLabel ?? '—'
      },
      {
        id: 'isActive',
        header: 'Status',
        cell: ({ row }) => (
          <Badge variant={row.original.isActive ? 'default' : 'secondary'}>
            {formatAdhocQueryActive(row.original.isActive)}
          </Badge>
        )
      },
      {
        accessorKey: 'createdBy',
        header: 'Created by',
        cell: ({ row }) => row.original.createdBy ?? '—'
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

  return (
    <div className="space-y-4">
      <Input
        placeholder="Filter ad hoc queries…"
        value={filter}
        onChange={(event) => {
          setFilter(event.target.value);
          setPagination((prev) => ({ ...prev, pageIndex: 0 }));
        }}
        className="max-w-sm"
        aria-label="Filter ad hoc queries"
      />
      <DataTable
        table={table}
        emptyMessage="No ad hoc queries found"
        emptyDescription="Create an ad hoc query to schedule custom SQL reports."
      />
      <DataTablePagination table={table} totalRecords={filteredRows.length} />
    </div>
  );
}
