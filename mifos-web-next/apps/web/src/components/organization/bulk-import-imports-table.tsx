'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { BulkImportHistoryItem } from '@mifos/api-client';
import { Can } from '@mifos/auth';
import {
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
  type PaginationState
} from '@tanstack/react-table';
import { Download } from 'lucide-react';
import { useMemo, useState } from 'react';
import { DataTable } from '@/components/composites/data-table/data-table';
import { DataTablePagination } from '@/components/composites/data-table/data-table-pagination';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { bulkImportDocumentApiPath } from '@/lib/fineract/bulk-import-paths';
import { formatFineractDateArray } from '@/lib/fineract/dates';

function formatImportTimestamp(value: BulkImportHistoryItem['importTime']) {
  if (value == null) {
    return '—';
  }
  return formatFineractDateArray(value) ?? String(value);
}

function formatCompleted(value: BulkImportHistoryItem['completed']) {
  if (value == null || value === '') {
    return '—';
  }
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  return String(value);
}

export function BulkImportImportsTable({ imports }: { imports: BulkImportHistoryItem[] }) {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25
  });

  const columns = useMemo<ColumnDef<BulkImportHistoryItem>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => row.original.name
      },
      {
        id: 'importTime',
        header: 'Import time',
        cell: ({ row }) => formatImportTimestamp(row.original.importTime)
      },
      {
        id: 'endTime',
        header: 'End time',
        cell: ({ row }) => formatImportTimestamp(row.original.endTime)
      },
      {
        id: 'completed',
        header: 'Completed',
        cell: ({ row }) => formatCompleted(row.original.completed)
      },
      {
        accessorKey: 'totalRecords',
        header: 'Total records',
        cell: ({ row }) => row.original.totalRecords ?? '—'
      },
      {
        accessorKey: 'successCount',
        header: 'Success count',
        cell: ({ row }) => row.original.successCount ?? '—'
      },
      {
        accessorKey: 'failureCount',
        header: 'Failure count',
        cell: ({ row }) => row.original.failureCount ?? '—'
      },
      {
        id: 'download',
        header: 'Download',
        cell: ({ row }) => (
          <Can permission="READ_DOCUMENT">
            <a
              href={bulkImportDocumentApiPath(row.original.importId)}
              download
              aria-label={`Download ${row.original.name}`}
              className={cn(buttonVariants({ variant: 'ghost', size: 'icon-sm' }))}
            >
              <Download className="size-4" />
            </a>
          </Can>
        )
      }
    ],
    []
  );

  const table = useReactTable({
    data: imports,
    columns,
    state: { pagination },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  });

  return (
    <div className="space-y-4">
      <DataTable table={table} emptyMessage="No imports found" />
      <DataTablePagination table={table} totalRecords={imports.length} />
    </div>
  );
}
