'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { TaxGroupListItem } from '@mifos/api-client';
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
import { taxGroupDetailPath } from '@/lib/fineract/tax-paths';

const columns: ColumnDef<TaxGroupListItem>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ row }) => (
      <Link
        href={taxGroupDetailPath(row.original.id)}
        className="font-medium text-primary underline-offset-4 hover:underline"
      >
        {row.original.name ?? '—'}
      </Link>
    )
  },
  {
    id: 'components',
    header: () => <span className="block w-full text-right">Components</span>,
    cell: ({ row }) => (
      <span className="block w-full text-right tabular-nums">
        {row.original.taxAssociations?.length ?? 0}
      </span>
    )
  }
];

export function TaxGroupsTable({ groups }: { groups: TaxGroupListItem[] }) {
  const [filter, setFilter] = useState('');
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25
  });

  const filteredRows = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) {
      return groups;
    }
    return groups.filter((row) =>
      [row.name, String(row.taxAssociations?.length ?? '')].join(' ').toLowerCase().includes(q)
    );
  }, [filter, groups]);

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
        placeholder="Filter tax groups…"
        value={filter}
        onChange={(event) => {
          setFilter(event.target.value);
          setPagination((prev) => ({ ...prev, pageIndex: 0 }));
        }}
        className="max-w-sm"
      />
      <DataTable table={table} stickyHeader={false} emptyMessage="No tax groups match your filter." />
      <DataTablePagination table={table} totalRecords={filteredRows.length} />
    </div>
  );
}
