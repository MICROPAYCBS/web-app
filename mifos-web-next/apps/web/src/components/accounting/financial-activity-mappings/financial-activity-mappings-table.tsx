'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractFinancialActivityMappingListItem } from '@mifos/api-client';
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
  type PaginationState
} from '@tanstack/react-table';
import { Pencil } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { DataTable } from '@/components/composites/data-table/data-table';
import { DataTablePagination } from '@/components/composites/data-table/data-table-pagination';
import { buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  formatFinancialActivityGlAccountLabel,
  formatFinancialActivityLabel,
  formatMappedGlAccountTypeLabel
} from '@/lib/accounting/financial-activity-mapping-display';
import {
  financialActivityMappingDetailPath,
  financialActivityMappingEditPath
} from '@/lib/fineract/financial-activity-mapping-paths';
import { cn } from '@/lib/utils';

export function FinancialActivityMappingsTable({
  mappings,
  canUpdate
}: {
  mappings: FineractFinancialActivityMappingListItem[];
  canUpdate: boolean;
}) {
  const [filter, setFilter] = useState('');
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25
  });

  const columns = useMemo<ColumnDef<FineractFinancialActivityMappingListItem>[]>(
    () => [
      {
        id: 'financialActivity',
        header: 'Financial activity',
        accessorFn: (row) => formatFinancialActivityLabel(row.financialActivityData),
        cell: ({ row }) => (
          <Link
            href={financialActivityMappingDetailPath(row.original.id)}
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            {formatFinancialActivityLabel(row.original.financialActivityData)}
          </Link>
        )
      },
      {
        id: 'glAccountType',
        header: 'Account type',
        accessorFn: (row) =>
          formatMappedGlAccountTypeLabel(row.financialActivityData.mappedGLAccountType),
        cell: ({ row }) =>
          formatMappedGlAccountTypeLabel(row.original.financialActivityData.mappedGLAccountType)
      },
      {
        id: 'glAccountCode',
        header: 'Account code',
        accessorFn: (row) => row.glAccountData.glCode,
        cell: ({ row }) => row.original.glAccountData.glCode
      },
      {
        id: 'glAccountName',
        header: 'Account name',
        accessorFn: (row) => row.glAccountData.name,
        cell: ({ row }) => formatFinancialActivityGlAccountLabel(row.original.glAccountData)
      },
      ...(canUpdate
        ? [
            {
              id: 'actions',
              header: 'Actions',
              meta: { sticky: 'right' },
              cell: ({ row }: { row: { original: FineractFinancialActivityMappingListItem } }) => (
                <Link
                  href={financialActivityMappingEditPath(row.original.id)}
                  className={cn(buttonVariants({ variant: 'ghost', size: 'icon-sm' }))}
                  aria-label={`Edit ${formatFinancialActivityLabel(row.original.financialActivityData)}`}
                >
                  <Pencil className="size-4" />
                </Link>
              )
            } satisfies ColumnDef<FineractFinancialActivityMappingListItem>
          ]
        : [])
    ],
    [canUpdate]
  );

  const table = useReactTable({
    data: mappings,
    columns,
    state: { globalFilter: filter, pagination },
    onGlobalFilterChange: setFilter,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: (row, _columnId, value) => {
      const query = String(value).trim().toLowerCase();
      if (!query) {
        return true;
      }
      const mapping = row.original;
      const haystack = [
        formatFinancialActivityLabel(mapping.financialActivityData),
        formatMappedGlAccountTypeLabel(mapping.financialActivityData.mappedGLAccountType),
        mapping.glAccountData.glCode,
        mapping.glAccountData.name
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(query);
    }
  });

  return (
    <div className="space-y-4">
      <Input
        value={filter}
        onChange={(event) => setFilter(event.target.value)}
        placeholder="Filter mappings…"
        className="max-w-sm"
        aria-label="Filter financial activity mappings"
      />
      <DataTable
        table={table}
        stickyHeader={false}
        emptyMessage="No mappings found"
        emptyDescription="Define a mapping to link a financial activity to a GL account."
      />
      <DataTablePagination table={table} totalRecords={table.getFilteredRowModel().rows.length} />
    </div>
  );
}
