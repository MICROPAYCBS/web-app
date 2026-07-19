'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractCode } from '@mifos/api-client';
import {
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
  type PaginationState
} from '@tanstack/react-table';
import { CircleCheck, CircleX } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { DataTable } from '@/components/composites/data-table/data-table';
import { DataTablePagination } from '@/components/composites/data-table/data-table-pagination';
import { Input } from '@/components/ui/input';

export function SystemCodesTable({ codes }: { codes: FineractCode[] }) {
  const [filter, setFilter] = useState('');
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25
  });

  const filteredRows = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) {
      return codes;
    }
    return codes.filter((row) => row.name.toLowerCase().includes(q));
  }, [codes, filter]);

  const columns = useMemo<ColumnDef<FineractCode>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Code name',
        cell: ({ row }) => (
          <Link
            href={`/system/codes/${row.original.id}`}
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            {row.original.name}
          </Link>
        )
      },
      {
        id: 'systemDefined',
        header: 'System defined',
        cell: ({ row }) =>
          row.original.systemDefined ? (
            <CircleCheck className="size-5 text-primary" aria-label="Yes" />
          ) : (
            <CircleX className="size-5 text-muted-foreground" aria-label="No" />
          )
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
        placeholder="Filter codes…"
        value={filter}
        onChange={(event) => {
          setFilter(event.target.value);
          setPagination((prev) => ({ ...prev, pageIndex: 0 }));
        }}
        className="max-w-sm"
        aria-label="Filter codes"
      />
      <DataTable
        table={table}
        emptyMessage="No codes found"
        emptyDescription="Create a code to define lookup values used across the application."
      />
      <DataTablePagination table={table} totalRecords={filteredRows.length} />
    </div>
  );
}
