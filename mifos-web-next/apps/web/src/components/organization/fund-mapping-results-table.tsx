'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FundMappingSearchResultItem } from '@mifos/api-client';
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef
} from '@tanstack/react-table';
import { useMemo } from 'react';
import { DataTable } from '@/components/composites/data-table/data-table';
import { DataTablePagination } from '@/components/composites/data-table/data-table-pagination';
import {
  formatFundMappingCount,
  formatFundMappingOutstanding,
  formatFundMappingPercentage
} from '@/lib/fineract/fund-mapping-display';

export function FundMappingResultsTable({ items }: { items: FundMappingSearchResultItem[] }) {
  const columns = useMemo<ColumnDef<FundMappingSearchResultItem>[]>(
    () => [
      {
        accessorKey: 'officeName',
        header: 'Branch',
        cell: ({ row }) => row.original.officeName ?? '—'
      },
      {
        accessorKey: 'loanProductName',
        header: 'Product',
        cell: ({ row }) => row.original.loanProductName ?? '—'
      },
      {
        accessorKey: 'count',
        header: 'Count',
        cell: ({ row }) => formatFundMappingCount(row.original.count)
      },
      {
        id: 'loanOutStanding',
        header: 'Outstanding',
        cell: ({ row }) => formatFundMappingOutstanding(row.original.loanOutStanding)
      },
      {
        accessorKey: 'percentage',
        header: 'Percentage',
        cell: ({ row }) => formatFundMappingPercentage(row.original.percentage)
      }
    ],
    []
  );

  const table = useReactTable({
    data: items,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize: 10 }
    }
  });

  return (
    <div className="space-y-4">
      <DataTable<FundMappingSearchResultItem> table={table} stickyHeader={false} />
      <DataTablePagination<FundMappingSearchResultItem> table={table} totalRecords={items.length} />
    </div>
  );
}
