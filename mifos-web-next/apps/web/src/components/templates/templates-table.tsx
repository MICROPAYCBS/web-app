'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractTemplateListItem } from '@mifos/api-client';
import {
  getCoreRowModel,
  getFilteredRowModel,
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

export function TemplatesTable({ templates }: { templates: FineractTemplateListItem[] }) {
  const [filter, setFilter] = useState('');
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25
  });

  const columns = useMemo<ColumnDef<FineractTemplateListItem>[]>(
    () => [
      {
        accessorKey: 'entity',
        header: 'Entity',
        cell: ({ row }) => row.original.entity
      },
      {
        accessorKey: 'type',
        header: 'Type',
        cell: ({ row }) => row.original.type
      },
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => (
          <Link
            href={`/templates/${row.original.id}`}
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            {row.original.name}
          </Link>
        )
      }
    ],
    []
  );

  const table = useReactTable({
    data: templates,
    columns,
    state: {
      pagination,
      globalFilter: filter
    },
    onPaginationChange: setPagination,
    onGlobalFilterChange: setFilter,
    globalFilterFn: (row, _columnId, filterValue) => {
      const query = String(filterValue).trim().toLowerCase();
      if (!query) {
        return true;
      }
      const template = row.original;
      return (
        template.name.toLowerCase().includes(query) ||
        template.entity.toLowerCase().includes(query) ||
        template.type.toLowerCase().includes(query)
      );
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  });

  return (
    <div className="space-y-4">
      <Input
        placeholder="Filter templates…"
        value={filter}
        onChange={(event) => {
          setFilter(event.target.value);
          setPagination((current) => ({ ...current, pageIndex: 0 }));
        }}
        className="max-w-sm"
        aria-label="Filter templates"
      />
      <DataTable
        table={table}
        stickyHeader={false}
        emptyMessage="No templates found"
        emptyDescription="Create a template to generate documents or SMS messages from client and loan data."
      />
      <DataTablePagination table={table} totalRecords={table.getFilteredRowModel().rows.length} />
    </div>
  );
}
