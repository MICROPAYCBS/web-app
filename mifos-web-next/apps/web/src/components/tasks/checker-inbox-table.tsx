'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { CheckerInboxListItem } from '@mifos/api-client';
import {
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
  type RowSelectionState
} from '@tanstack/react-table';
import Link from 'next/link';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { DataTable } from '@/components/composites/data-table/data-table';
import { DataTablePagination } from '@/components/composites/data-table/data-table-pagination';
import { Checkbox } from '@/components/ui/checkbox';
import {
  applyCheckerInboxClientFilters,
  countActiveCheckerInboxClientFilters,
  type CheckerInboxClientFilters
} from '@/lib/checker-inbox/client-filters';
import { formatAuditTrailDateTime } from '@/lib/fineract/audit-trail-display';
import { checkerInboxDetailPath } from '@/lib/fineract/checker-inbox-paths';

export function CheckerInboxTable({
  items,
  filters,
  onSelectedItemsChange,
  toolbar
}: {
  items: CheckerInboxListItem[];
  filters: CheckerInboxClientFilters;
  onSelectedItemsChange?: (items: CheckerInboxListItem[]) => void;
  toolbar?: ReactNode;
}) {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 25 });

  const filteredItems = useMemo(
    () => applyCheckerInboxClientFilters(items, filters),
    [items, filters]
  );
  const activeFilterCount = countActiveCheckerInboxClientFilters(filters);

  const selectedItems = useMemo(
    () =>
      Object.entries(rowSelection)
        .filter(([, selected]) => selected)
        .map(([id]) => filteredItems.find((item) => String(item.id) === id))
        .filter((item): item is CheckerInboxListItem => item != null),
    [filteredItems, rowSelection]
  );

  useEffect(() => {
    onSelectedItemsChange?.(selectedItems);
  }, [onSelectedItemsChange, selectedItems]);

  useEffect(() => {
    setRowSelection({});
    setPagination((current) => ({ ...current, pageIndex: 0 }));
  }, [filters]);

  const columns = useMemo<ColumnDef<CheckerInboxListItem>[]>(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(value === true)}
            aria-label="Select all items on this page"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(value === true)}
            onClick={(event) => event.stopPropagation()}
            aria-label={`Select checker item ${row.original.id}`}
          />
        ),
        enableSorting: false
      },
      {
        accessorKey: 'id',
        header: 'ID',
        cell: ({ row }) => (
          <Link
            href={checkerInboxDetailPath(row.original.id)}
            className="font-medium text-primary hover:underline"
            onClick={(event) => event.stopPropagation()}
          >
            {row.original.id}
          </Link>
        )
      },
      {
        id: 'madeOnDate',
        header: 'Made on date',
        cell: ({ row }) => formatAuditTrailDateTime(row.original.madeOnDate)
      },
      {
        accessorKey: 'processingResult',
        header: 'Status',
        cell: ({ row }) => row.original.processingResult ?? '—'
      },
      {
        accessorKey: 'maker',
        header: 'User',
        cell: ({ row }) => row.original.maker ?? '—'
      },
      {
        accessorKey: 'actionName',
        header: 'Action',
        cell: ({ row }) => row.original.actionName ?? '—'
      },
      {
        accessorKey: 'entityName',
        header: 'Entity',
        cell: ({ row }) => row.original.entityName ?? '—'
      }
    ],
    []
  );

  const table = useReactTable({
    data: filteredItems,
    columns,
    state: {
      rowSelection,
      pagination
    },
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    getRowId: (row) => String(row.id),
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  });

  return (
    <div className="space-y-4">
      {toolbar ? (
        <div className="flex flex-wrap items-center justify-end gap-2">{toolbar}</div>
      ) : null}
      <DataTable
        table={table}
        emptyMessage={
          activeFilterCount > 0
            ? 'No items match the current filters'
            : 'No checker inbox data available'
        }
        emptyDescription={
          activeFilterCount > 0
            ? 'Try clearing or adjusting the filters.'
            : 'There are no pending maker-checker items for this account.'
        }
      />
      <DataTablePagination table={table} totalRecords={filteredItems.length} />
    </div>
  );
}
