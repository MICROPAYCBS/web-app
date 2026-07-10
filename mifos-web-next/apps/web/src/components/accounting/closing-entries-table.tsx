'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractGlClosureListItem } from '@mifos/api-client';
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

export function ClosingEntriesTable({ closures }: { closures: FineractGlClosureListItem[] }) {
  const [officeFilter, setOfficeFilter] = useState('');
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25
  });

  const filteredClosures = useMemo(() => {
    const query = officeFilter.trim().toLowerCase();
    if (!query) {
      return closures;
    }
    return closures.filter((closure) => closure.officeName.toLowerCase().includes(query));
  }, [closures, officeFilter]);

  const columns = useMemo<ColumnDef<FineractGlClosureListItem>[]>(
    () => [
      {
        id: 'officeName',
        accessorKey: 'officeName',
        header: 'Branch',
        cell: ({ row }) => (
          <Link
            href={`/accounting/closing-entries/${row.original.id}`}
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            {row.original.officeName || '—'}
          </Link>
        )
      },
      {
        id: 'closingDate',
        accessorKey: 'closingDate',
        header: 'Closure date',
        cell: ({ row }) => row.original.closingDate || '—'
      },
      {
        id: 'comments',
        accessorKey: 'comments',
        header: 'Comments',
        cell: ({ row }) => row.original.comments?.trim() || '—'
      },
      {
        id: 'createdByUsername',
        accessorKey: 'createdByUsername',
        header: 'Created by',
        cell: ({ row }) => row.original.createdByUsername || '—'
      }
    ],
    []
  );

  const table = useReactTable({
    data: filteredClosures,
    columns,
    state: { pagination },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  });

  return (
    <div className="space-y-4">
      <Input
        placeholder="Filter by branch…"
        value={officeFilter}
        onChange={(event) => {
          setOfficeFilter(event.target.value);
          setPagination((current) => ({ ...current, pageIndex: 0 }));
        }}
        className="max-w-sm"
        aria-label="Filter closures by branch"
      />
      <DataTable
        table={table}
        stickyHeader={false}
        emptyMessage="No closures found"
        emptyDescription="Create a closure to lock accounting for a branch."
      />
      <DataTablePagination table={table} totalRecords={filteredClosures.length} />
    </div>
  );
}
