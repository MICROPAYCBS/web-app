'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractReportListItem } from '@mifos/api-client';
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef
} from '@tanstack/react-table';
import { Check, X } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { DataTable } from '@/components/composites/data-table/data-table';
import { DataTablePagination } from '@/components/composites/data-table/data-table-pagination';
import { Input } from '@/components/ui/input';
import { formatReportCategory, yesNoLabel } from '@/lib/fineract/report-display';

export function ReportsTable({ reports }: { reports: FineractReportListItem[] }) {
  const [filter, setFilter] = useState('');

  const columns = useMemo<ColumnDef<FineractReportListItem>[]>(
    () => [
      {
        accessorKey: 'reportName',
        header: 'Report name',
        cell: ({ row }) => (
          <Link
            href={`/system/reports/${row.original.id}`}
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            {row.original.reportName}
          </Link>
        )
      },
      {
        accessorKey: 'reportType',
        header: 'Type',
        cell: ({ row }) => row.original.reportType
      },
      {
        accessorKey: 'reportSubType',
        header: 'Sub-type',
        cell: ({ row }) => row.original.reportSubType ?? '—'
      },
      {
        accessorKey: 'reportCategory',
        header: 'Category',
        cell: ({ row }) => formatReportCategory(row.original.reportCategory)
      },
      {
        accessorKey: 'coreReport',
        header: 'Core report',
        cell: ({ row }) =>
          row.original.coreReport ? (
            <Check className="size-4 text-primary" aria-label="Yes" />
          ) : (
            <X className="size-4 text-muted-foreground" aria-label="No" />
          )
      },
      {
        accessorKey: 'useReport',
        header: 'User report',
        cell: ({ row }) => yesNoLabel(row.original.useReport)
      }
    ],
    []
  );

  const table = useReactTable({
    data: reports,
    columns,
    state: { globalFilter: filter },
    onGlobalFilterChange: setFilter,
    globalFilterFn: (row, _columnId, value) => {
      const needle = String(value).toLowerCase();
      const item = row.original;
      return [
        item.reportName,
        item.reportType,
        item.reportSubType,
        item.reportCategory,
        yesNoLabel(item.coreReport),
        yesNoLabel(item.useReport)
      ]
        .filter(Boolean)
        .some((part) => String(part).toLowerCase().includes(needle));
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize: 25 }
    }
  });

  return (
    <div className="space-y-4">
      <Input
        value={filter}
        onChange={(event) => setFilter(event.target.value)}
        placeholder="Filter reports…"
        className="max-w-sm"
      />
      <DataTable<FineractReportListItem>
        table={table}
        stickyHeader={false}
        emptyMessage="No reports found"
        emptyDescription="Create a report to define SQL, parameters, and menu visibility."
      />
      <DataTablePagination<FineractReportListItem>
        table={table}
        totalRecords={table.getFilteredRowModel().rows.length}
      />
    </div>
  );
}
