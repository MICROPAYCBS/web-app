'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractSearchResult } from '@mifos/api-client';
import {
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
  type PaginationState
} from '@tanstack/react-table';
import { Eye } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { DataTable } from '@/components/composites/data-table/data-table';
import { DataTablePagination } from '@/components/composites/data-table/data-table-pagination';
import { buttonVariants } from '@/components/ui/button';
import {
  formatSearchEntityType,
  formatSearchParentType,
  searchResultTarget
} from '@/lib/search/entity-search';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

function formatValue(value: string | undefined): string {
  return value?.trim() ? value : '—';
}

export function SearchResultsTable({ results }: { results: FineractSearchResult[] }) {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25
  });

  const columns = useMemo<ColumnDef<FineractSearchResult>[]>(
    () => [
      {
        id: 'entityType',
        header: 'Entity type',
        cell: ({ row }) => formatSearchEntityType(row.original.entityType)
      },
      {
        accessorKey: 'entityName',
        header: 'Entity name',
        cell: ({ row }) => formatValue(row.original.entityName)
      },
      {
        id: 'entityAccountNo',
        header: 'Account no.',
        cell: ({ row }) => formatValue(row.original.entityAccountNo)
      },
      {
        id: 'entityExternalId',
        header: 'External ID',
        cell: ({ row }) => formatValue(row.original.entityExternalId)
      },
      {
        id: 'entityMobileNo',
        header: 'Mobile',
        cell: ({ row }) => formatValue(row.original.entityMobileNo)
      },
      {
        id: 'entityEmail',
        header: 'Email',
        cell: ({ row }) => formatValue(row.original.entityEmail)
      },
      {
        id: 'parentType',
        header: 'Parent type',
        cell: ({ row }) => formatSearchParentType(row.original)
      },
      {
        accessorKey: 'parentName',
        header: 'Parent name',
        cell: ({ row }) => formatValue(row.original.parentName)
      },
      {
        id: 'actions',
        header: 'Details',
        cell: ({ row }) => {
          const target = searchResultTarget(row.original);
          if (target.status === 'soon') {
            return (
              <Badge variant="outline" className="text-[10px] font-normal">
                Soon
              </Badge>
            );
          }
          if (!target.href) {
            return '—';
          }
          return (
            <Link href={target.href} className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}>
              <Eye className="mr-2 size-4" />
              View
            </Link>
          );
        }
      }
    ],
    []
  );

  const table = useReactTable({
    data: results,
    columns,
    state: { pagination },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  });

  return (
    <div className="space-y-4">
      <DataTable table={table} emptyMessage="No data found" />
      <DataTablePagination table={table} totalRecords={results.length} />
    </div>
  );
}
