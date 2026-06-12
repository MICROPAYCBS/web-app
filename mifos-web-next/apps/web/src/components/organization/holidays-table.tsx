'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { HolidayListItem } from '@mifos/api-client';
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
import {
  formatHolidayDate,
  formatHolidayRepaymentsScheduled,
  holidayStatusLabel
} from '@/lib/fineract/holiday-display';
import { holidayDetailPath } from '@/lib/fineract/holiday-paths';

export function HolidaysTable({ holidays }: { holidays: HolidayListItem[] }) {
  const [filter, setFilter] = useState('');
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25
  });

  const filteredRows = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) {
      return holidays;
    }
    return holidays.filter((row) => {
      const haystack = [
        row.name,
        formatHolidayDate(row.fromDate),
        formatHolidayDate(row.toDate),
        formatHolidayRepaymentsScheduled(row),
        holidayStatusLabel(row.status)
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [holidays, filter]);

  const columns = useMemo<ColumnDef<HolidayListItem>[]>(
    () => [
      {
        id: 'name',
        header: 'Holiday name',
        cell: ({ row }) => (
          <Link
            href={holidayDetailPath(row.original.id)}
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            {row.original.name}
          </Link>
        )
      },
      {
        id: 'fromDate',
        header: 'Start date',
        cell: ({ row }) => formatHolidayDate(row.original.fromDate)
      },
      {
        id: 'toDate',
        header: 'End date',
        cell: ({ row }) => formatHolidayDate(row.original.toDate)
      },
      {
        id: 'repaymentsRescheduledTo',
        header: 'Repayments scheduled to',
        cell: ({ row }) => formatHolidayRepaymentsScheduled(row.original)
      },
      {
        id: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <Badge variant="secondary">{holidayStatusLabel(row.original.status)}</Badge>
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
        placeholder="Filter holidays…"
        value={filter}
        onChange={(event) => {
          setFilter(event.target.value);
          setPagination((prev) => ({ ...prev, pageIndex: 0 }));
        }}
        className="max-w-sm"
        aria-label="Filter holidays"
      />
      <DataTable
        table={table}
        emptyMessage="No holidays found"
        emptyDescription="Create a holiday for the selected branch."
      />
      <DataTablePagination table={table} totalRecords={filteredRows.length} />
    </div>
  );
}
