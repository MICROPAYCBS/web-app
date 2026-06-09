'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractSurveyListItem } from '@mifos/api-client';
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
  type PaginationState
} from '@tanstack/react-table';
import { Circle } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { DataTable } from '@/components/composites/data-table/data-table';
import { DataTablePagination } from '@/components/composites/data-table/data-table-pagination';
import { Input } from '@/components/ui/input';
import { isSurveyActive } from '@/lib/fineract/survey-display';
import { cn } from '@/lib/utils';

export function SurveysTable({ surveys }: { surveys: FineractSurveyListItem[] }) {
  const [filter, setFilter] = useState('');
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25
  });

  const columns = useMemo<ColumnDef<FineractSurveyListItem>[]>(
    () => [
      {
        accessorKey: 'key',
        header: 'Key',
        cell: ({ row }) => (
          <Link
            href={`/system/surveys/${row.original.id}`}
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            {row.original.key}
          </Link>
        )
      },
      { accessorKey: 'name', header: 'Name' },
      {
        accessorKey: 'description',
        header: 'Description',
        cell: ({ row }) => row.original.description ?? '—'
      },
      { accessorKey: 'countryCode', header: 'Country code' },
      {
        id: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const active = isSurveyActive(row.original.validFrom, row.original.validTo);
          return (
            <div className="flex items-center gap-2">
              <Circle
                className={cn(
                  'size-3 fill-current',
                  active ? 'text-primary' : 'text-muted-foreground'
                )}
                aria-hidden
              />
              <span className="text-sm text-muted-foreground">
                {active ? 'Active' : 'Inactive'}
              </span>
            </div>
          );
        }
      }
    ],
    []
  );

  const table = useReactTable({
    data: surveys,
    columns,
    state: {
      globalFilter: filter,
      pagination
    },
    onPaginationChange: setPagination,
    onGlobalFilterChange: setFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  });

  return (
    <div className="space-y-4">
      <Input
        placeholder="Filter surveys…"
        value={filter}
        onChange={(event) => setFilter(event.target.value)}
        className="max-w-sm"
      />
      <DataTable
        table={table}
        stickyHeader={false}
        emptyMessage="No surveys found"
        emptyDescription="Surveys you create will appear here."
      />
      <DataTablePagination table={table} totalRecords={table.getFilteredRowModel().rows.length} />
    </div>
  );
}
