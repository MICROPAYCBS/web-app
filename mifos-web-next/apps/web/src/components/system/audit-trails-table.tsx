'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractAuditTrailListItem, FineractAuditTrailsPage } from '@mifos/api-client';
import {
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type PaginationState
} from '@tanstack/react-table';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';
import { DataTable } from '@/components/composites/data-table/data-table';
import { DataTablePagination } from '@/components/composites/data-table/data-table-pagination';
import { Button } from '@/components/ui/button';
import { formatAuditTrailDateTime } from '@/lib/fineract/audit-trail-display';

const SORTABLE_COLUMNS = [
  'id',
  'resourceId',
  'processingResult',
  'maker',
  'actionName',
  'entityName',
  'officeName',
  'madeOnDate',
  'checker',
  'checkedOnDate',
  'clientIp'
] as const;

export type AuditTrailSortColumn = (typeof SORTABLE_COLUMNS)[number];

function SortableHeader({
  label,
  column,
  activeColumn,
  sortOrder,
  onSort
}: {
  label: string;
  column: AuditTrailSortColumn;
  activeColumn?: string;
  sortOrder?: string;
  onSort: (column: AuditTrailSortColumn) => void;
}) {
  const isActive = activeColumn === column;
  const Icon = isActive ? (sortOrder === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown;

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="-ml-3 h-8 gap-1 font-medium"
      onClick={() => onSort(column)}
    >
      {label}
      <Icon className="size-3.5 opacity-60" aria-hidden />
    </Button>
  );
}

export function AuditTrailsTable({
  page,
  pageSize,
  pageIndex,
  orderBy,
  sortOrder,
  onSort,
  onPaginationChange,
  pending = false
}: {
  page: FineractAuditTrailsPage;
  pageSize: number;
  pageIndex: number;
  orderBy: string;
  sortOrder: string;
  onSort: (column: AuditTrailSortColumn) => void;
  onPaginationChange: (pagination: PaginationState) => void;
  pending?: boolean;
}) {
  const pagination: PaginationState = {
    pageIndex,
    pageSize
  };

  const columns = useMemo<ColumnDef<FineractAuditTrailListItem>[]>(
    () => [
      {
        accessorKey: 'id',
        header: () => (
          <SortableHeader
            label="Trail ID"
            column="id"
            activeColumn={orderBy}
            sortOrder={sortOrder}
            onSort={onSort}
          />
        ),
        cell: ({ row }) => (
          <Link
            href={`/system/audit-trails/${row.original.id}`}
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            {row.original.id}
          </Link>
        )
      },
      {
        accessorKey: 'resourceId',
        header: () => (
          <SortableHeader
            label="Resource ID"
            column="resourceId"
            activeColumn={orderBy}
            sortOrder={sortOrder}
            onSort={onSort}
          />
        ),
        cell: ({ row }) => row.original.resourceId ?? '—'
      },
      {
        accessorKey: 'processingResult',
        header: () => (
          <SortableHeader
            label="Status"
            column="processingResult"
            activeColumn={orderBy}
            sortOrder={sortOrder}
            onSort={onSort}
          />
        ),
        cell: ({ row }) => row.original.processingResult ?? '—'
      },
      {
        accessorKey: 'maker',
        header: () => (
          <SortableHeader
            label="Made by"
            column="maker"
            activeColumn={orderBy}
            sortOrder={sortOrder}
            onSort={onSort}
          />
        ),
        cell: ({ row }) => row.original.maker ?? '—'
      },
      {
        accessorKey: 'actionName',
        header: () => (
          <SortableHeader
            label="Action"
            column="actionName"
            activeColumn={orderBy}
            sortOrder={sortOrder}
            onSort={onSort}
          />
        ),
        cell: ({ row }) => row.original.actionName ?? '—'
      },
      {
        accessorKey: 'entityName',
        header: () => (
          <SortableHeader
            label="Entity"
            column="entityName"
            activeColumn={orderBy}
            sortOrder={sortOrder}
            onSort={onSort}
          />
        ),
        cell: ({ row }) => row.original.entityName ?? '—'
      },
      {
        accessorKey: 'officeName',
        header: () => (
          <SortableHeader
            label="Office"
            column="officeName"
            activeColumn={orderBy}
            sortOrder={sortOrder}
            onSort={onSort}
          />
        ),
        cell: ({ row }) => row.original.officeName ?? '—'
      },
      {
        id: 'madeOnDate',
        header: () => (
          <SortableHeader
            label="Made date"
            column="madeOnDate"
            activeColumn={orderBy}
            sortOrder={sortOrder}
            onSort={onSort}
          />
        ),
        cell: ({ row }) => formatAuditTrailDateTime(row.original.madeOnDate)
      },
      {
        accessorKey: 'checker',
        header: () => (
          <SortableHeader
            label="Checker"
            column="checker"
            activeColumn={orderBy}
            sortOrder={sortOrder}
            onSort={onSort}
          />
        ),
        cell: ({ row }) => row.original.checker ?? '—'
      },
      {
        id: 'checkedOnDate',
        header: () => (
          <SortableHeader
            label="Checked date"
            column="checkedOnDate"
            activeColumn={orderBy}
            sortOrder={sortOrder}
            onSort={onSort}
          />
        ),
        cell: ({ row }) => formatAuditTrailDateTime(row.original.checkedOnDate)
      },
      {
        id: 'clientIp',
        accessorFn: (row) => row.ip ?? '',
        header: () => (
          <SortableHeader
            label="Client IP"
            column="clientIp"
            activeColumn={orderBy}
            sortOrder={sortOrder}
            onSort={onSort}
          />
        ),
        cell: ({ row }) => row.original.ip ?? '—'
      }
    ],
    [onSort, orderBy, sortOrder]
  );

  const table = useReactTable({
    data: page.pageItems,
    columns,
    state: { pagination },
    manualPagination: true,
    pageCount: Math.max(1, Math.ceil(page.totalFilteredRecords / pageSize)),
    onPaginationChange: (updater) => {
      const next = typeof updater === 'function' ? updater(pagination) : updater;
      onPaginationChange(next);
    },
    getCoreRowModel: getCoreRowModel()
  });

  return (
    <div className="space-y-4">
      <DataTable
        table={table}
        stickyHeader={false}
        emptyMessage={pending ? 'Loading audit trails…' : 'No audit trails found'}
        emptyDescription="Try adjusting your filters or date range."
      />
      <DataTablePagination table={table} totalRecords={page.totalFilteredRecords} />
    </div>
  );
}
