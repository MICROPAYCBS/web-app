'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { OrganizationFund } from '@mifos/api-client';
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
import { buttonVariants } from '@/components/ui/button';
import { fundDetailPath, fundEditPath } from '@/lib/fineract/fund-paths';
import { cn } from '@/lib/utils';

export function FundsTable({
  funds,
  canEdit
}: {
  funds: OrganizationFund[];
  canEdit: boolean;
}) {
  const [filter, setFilter] = useState('');
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25
  });

  const filteredRows = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) {
      return funds;
    }
    return funds.filter((row) =>
      [row.name, row.externalId].filter(Boolean).join(' ').toLowerCase().includes(q)
    );
  }, [funds, filter]);

  const columns = useMemo<ColumnDef<OrganizationFund>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => (
          <Link
            href={fundDetailPath(row.original.id)}
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            {row.original.name}
          </Link>
        )
      },
      {
        accessorKey: 'externalId',
        header: 'External ID',
        cell: ({ row }) => row.original.externalId?.trim() || '—'
      },
      ...(canEdit
        ? [
            {
              id: 'actions',
              header: () => <span className="sr-only">Actions</span>,
              cell: ({ row }) => (
                <Link
                  href={fundEditPath(row.original.id)}
                  className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}
                >
                  Edit
                </Link>
              )
            } satisfies ColumnDef<OrganizationFund>
          ]
        : [])
    ],
    [canEdit]
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
        value={filter}
        onChange={(event) => setFilter(event.target.value)}
        placeholder="Filter funds…"
        className="max-w-sm"
      />
      <DataTable table={table} emptyMessage="No funds found." />
      <DataTablePagination table={table} totalRecords={filteredRows.length} />
    </div>
  );
}
