'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractReportRunResult } from '@mifos/api-client';
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef
} from '@tanstack/react-table';
import { Download } from 'lucide-react';
import { useMemo, useState } from 'react';
import { DataTable } from '@/components/composites/data-table/data-table';
import { DataTablePagination } from '@/components/composites/data-table/data-table-pagination';
import { ReportResultTableSkeleton } from '@/components/reports/report-result-table-skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  formatReportRunCellValue,
  isReportColumnNumeric,
  sanitizeReportRunRows
} from '@/lib/fineract/report-run-display';

function exportRowsToCsv(filename: string, headers: string[], rows: Record<string, unknown>[]) {
  const escape = (value: unknown) => {
    const text = value == null ? '' : String(value);
    if (/[",\n]/.test(text)) {
      return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
  };
  const lines = [
    headers.map(escape).join(','),
    ...rows.map((row) => headers.map((header) => escape(row[header])).join(','))
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function ReportResultTable({
  result,
  reportName,
  loading = false
}: {
  result: FineractReportRunResult | null;
  reportName: string;
  /** True while a report run is in flight (first run or re-run). */
  loading?: boolean;
}) {
  const [filter, setFilter] = useState('');

  const rows = useMemo(() => sanitizeReportRunRows(result), [result]);

  const columns = useMemo<ColumnDef<Record<string, unknown>>[]>(() => {
    if (!result?.columnHeaders?.length) {
      return [];
    }
    return result.columnHeaders.map((column) => {
      const numeric = isReportColumnNumeric(column.columnType);
      return {
        accessorKey: column.columnName,
        header: () => <div className={numeric ? 'text-right' : undefined}>{column.columnName}</div>,
        cell: ({ row }) => (
          <div className={numeric ? 'text-right tabular-nums' : undefined}>
            {formatReportRunCellValue(row.original[column.columnName], column.columnType)}
          </div>
        )
      };
    });
  }, [result]);

  const table = useReactTable({
    data: rows,
    columns,
    state: { globalFilter: filter },
    onGlobalFilterChange: setFilter,
    globalFilterFn: (row, _columnId, value) => {
      const needle = String(value).toLowerCase();
      return Object.values(row.original).some((cell) =>
        String(cell ?? '')
          .toLowerCase()
          .includes(needle)
      );
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize: 50 }
    }
  });

  if (loading) {
    return (
      <ReportResultTableSkeleton
        columnCount={result?.columnHeaders?.length || 4}
      />
    );
  }

  if (!result) {
    return (
      <div className="flex min-h-48 items-center justify-center rounded-lg border border-dashed border-border px-6 py-10 text-center text-sm text-muted-foreground">
        Configure parameters and run the report to see results here.
      </div>
    );
  }

  const headerNames = result.columnHeaders.map((column) => column.columnName);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          placeholder="Filter results…"
          className="max-w-sm"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!rows.length}
          onClick={() =>
            exportRowsToCsv(
              `${reportName.replace(/\s+/g, '-').toLowerCase()}-export.csv`,
              headerNames,
              table.getFilteredRowModel().rows.map((row) => row.original)
            )
          }
        >
          <Download className="mr-2 size-4" />
          Export CSV
        </Button>
      </div>
      <DataTable<Record<string, unknown>>
        table={table}
        emptyMessage="No rows returned"
        emptyDescription="The report completed but returned no data for the selected parameters."
      />
      <DataTablePagination<Record<string, unknown>>
        table={table}
        totalRecords={table.getFilteredRowModel().rows.length}
      />
    </div>
  );
}
