'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractDatatableRegistration } from '@mifos/api-client';
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
  formatApplicationTableLabel,
  formatEntitySubType
} from '@/lib/fineract/system-datatables-display';

const columns: ColumnDef<FineractDatatableRegistration>[] = [
  {
    accessorKey: 'registeredTableName',
    header: 'Data table name',
    cell: ({ row }) => (
      <Link
        href={`/system/data-tables/${encodeURIComponent(row.original.registeredTableName)}`}
        className="font-medium text-primary underline-offset-4 hover:underline"
      >
        {row.original.registeredTableName}
      </Link>
    )
  },
  {
    id: 'applicationTableName',
    header: 'Associated with',
    cell: ({ row }) => formatApplicationTableLabel(row.original.applicationTableName)
  },
  {
    id: 'entitySubType',
    header: 'Sub type',
    cell: ({ row }) => formatEntitySubType(row.original.entitySubType ?? row.original.subentityType)
  }
];

export function SystemDataTablesTable({
  datatables
}: {
  datatables: FineractDatatableRegistration[];
}) {
  const [filter, setFilter] = useState('');
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25
  });

  const filteredRows = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) {
      return datatables;
    }
    return datatables.filter((row) => {
      const haystack = [
        row.registeredTableName,
        row.applicationTableName,
        row.entitySubType,
        row.subentityType,
        formatApplicationTableLabel(row.applicationTableName)
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [datatables, filter]);

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
        placeholder="Filter data tables…"
        value={filter}
        onChange={(event) => {
          setFilter(event.target.value);
          setPagination((prev) => ({ ...prev, pageIndex: 0 }));
        }}
        className="max-w-sm"
        aria-label="Filter data tables"
      />
      <DataTable
        table={table}
        emptyMessage="No data tables found"
        emptyDescription="Try adjusting your filter, or create a new data table."
      />
      <DataTablePagination table={table} totalRecords={filteredRows.length} />
    </div>
  );
}
