'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractJournalEntryListItem, FineractJournalEntriesPage } from '@mifos/api-client';
import {
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type PaginationState,
  type Table,
  type VisibilityState
} from '@tanstack/react-table';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { JournalEntryTransactionLink } from '@/components/accounting/journal-entries/journal-entry-transaction-panel';
import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { DataTable } from '@/components/composites/data-table/data-table';
import { DataTablePagination } from '@/components/composites/data-table/data-table-pagination';
import { Button } from '@/components/ui/button';
import {
  formatJournalEntryAmount,
  formatJournalEntryDate,
  formatJournalEntryDateTime
} from '@/lib/accounting/journal-entry-display';
import {
  readStoredColumnVisibility,
  writeStoredColumnVisibility
} from '@/lib/data-table/column-visibility';

const SORTABLE_COLUMNS = [
  'id',
  'officeName',
  'transactionDate',
  'createdByUserName',
  'submittedOnDate',
  'glAccountCode',
  'glAccountName',
  'referenceNumber',
  'debit',
  'credit'
] as const;

export type JournalEntrySortColumn = (typeof SORTABLE_COLUMNS)[number];

const COLUMN_VISIBILITY_STORAGE_KEY = 'journal-entries-column-visibility';

export const JOURNAL_ENTRIES_DEFAULT_COLUMN_VISIBILITY: VisibilityState = {
  officeName: false,
  glAccountType: false,
  createdByUserName: false,
  submittedOnDate: false,
  currency: false
};

function SortableHeader({
  label,
  column,
  activeColumn,
  sortOrder,
  onSort
}: {
  label: string;
  column: JournalEntrySortColumn;
  activeColumn?: string;
  sortOrder?: string;
  onSort: (column: JournalEntrySortColumn) => void;
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

export function useJournalEntriesTable({
  page,
  pageSize,
  pageIndex,
  orderBy,
  sortOrder,
  onSort,
  onPaginationChange
}: {
  page: FineractJournalEntriesPage;
  pageSize: number;
  pageIndex: number;
  orderBy: string;
  sortOrder: string;
  onSort: (column: JournalEntrySortColumn) => void;
  onPaginationChange: (pagination: PaginationState) => void;
}) {
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    JOURNAL_ENTRIES_DEFAULT_COLUMN_VISIBILITY
  );

  useEffect(() => {
    const stored = readStoredColumnVisibility(COLUMN_VISIBILITY_STORAGE_KEY);
    if (stored) {
      setColumnVisibility({ ...JOURNAL_ENTRIES_DEFAULT_COLUMN_VISIBILITY, ...stored });
    }
  }, []);

  useEffect(() => {
    writeStoredColumnVisibility(COLUMN_VISIBILITY_STORAGE_KEY, columnVisibility);
  }, [columnVisibility]);

  const pagination: PaginationState = {
    pageIndex,
    pageSize
  };

  const columns = useMemo<ColumnDef<FineractJournalEntryListItem>[]>(
    () => [
      {
        accessorKey: 'id',
        meta: { label: 'Entry ID' },
        header: () => (
          <SortableHeader
            label="Entry ID"
            column="id"
            activeColumn={orderBy}
            sortOrder={sortOrder}
            onSort={onSort}
          />
        ),
        cell: ({ row }) => row.original.id
      },
      {
        accessorKey: 'officeName',
        meta: { label: 'Branch' },
        header: () => (
          <SortableHeader
            label="Branch"
            column="officeName"
            activeColumn={orderBy}
            sortOrder={sortOrder}
            onSort={onSort}
          />
        ),
        cell: ({ row }) => row.original.officeName
      },
      {
        accessorKey: 'transactionId',
        enableHiding: false,
        meta: { label: 'Transaction ID' },
        header: 'Transaction ID',
        cell: ({ row }) => (
          <JournalEntryTransactionLink transactionId={row.original.transactionId} />
        )
      },
      {
        id: 'transactionDate',
        meta: { label: 'Transaction date' },
        header: () => (
          <SortableHeader
            label="Transaction date"
            column="transactionDate"
            activeColumn={orderBy}
            sortOrder={sortOrder}
            onSort={onSort}
          />
        ),
        cell: ({ row }) => formatJournalEntryDate(row.original.transactionDate)
      },
      {
        id: 'glAccountType',
        accessorFn: (row) => row.glAccountType.value,
        meta: { label: 'Type' },
        header: 'Type',
        cell: ({ row }) => row.original.glAccountType.value
      },
      {
        accessorKey: 'createdByUserName',
        meta: { label: 'Created by' },
        header: () => (
          <SortableHeader
            label="Created by"
            column="createdByUserName"
            activeColumn={orderBy}
            sortOrder={sortOrder}
            onSort={onSort}
          />
        ),
        cell: ({ row }) => row.original.createdByUserName ?? '—'
      },
      {
        id: 'submittedOnDate',
        meta: { label: 'Submitted on' },
        header: () => (
          <SortableHeader
            label="Submitted on"
            column="submittedOnDate"
            activeColumn={orderBy}
            sortOrder={sortOrder}
            onSort={onSort}
          />
        ),
        cell: ({ row }) => formatJournalEntryDateTime(row.original.submittedOnDate)
      },
      {
        accessorKey: 'glAccountCode',
        meta: { label: 'Account code' },
        header: () => (
          <SortableHeader
            label="Account code"
            column="glAccountCode"
            activeColumn={orderBy}
            sortOrder={sortOrder}
            onSort={onSort}
          />
        ),
        cell: ({ row }) => row.original.glAccountCode
      },
      {
        accessorKey: 'glAccountName',
        meta: { label: 'Account name' },
        header: () => (
          <SortableHeader
            label="Account name"
            column="glAccountName"
            activeColumn={orderBy}
            sortOrder={sortOrder}
            onSort={onSort}
          />
        ),
        cell: ({ row }) => row.original.glAccountName
      },
      {
        id: 'currency',
        accessorFn: (row) => row.currency.code,
        meta: { label: 'Currency' },
        header: 'Currency',
        cell: ({ row }) => row.original.currency.code
      },
      {
        id: 'debit',
        meta: { label: 'Debit' },
        header: () => (
          <SortableHeader
            label="Debit"
            column="debit"
            activeColumn={orderBy}
            sortOrder={sortOrder}
            onSort={onSort}
          />
        ),
        cell: ({ row }) => formatJournalEntryAmount(row.original, 'DEBIT')
      },
      {
        id: 'credit',
        meta: { label: 'Credit' },
        header: () => (
          <SortableHeader
            label="Credit"
            column="credit"
            activeColumn={orderBy}
            sortOrder={sortOrder}
            onSort={onSort}
          />
        ),
        cell: ({ row }) => formatJournalEntryAmount(row.original, 'CREDIT')
      }
    ],
    [onSort, orderBy, sortOrder]
  );

  const table = useReactTable({
    data: page.pageItems,
    columns,
    state: { pagination, columnVisibility },
    manualPagination: true,
    pageCount: Math.max(1, Math.ceil(page.totalFilteredRecords / pageSize)),
    onPaginationChange: (updater) => {
      const next = typeof updater === 'function' ? updater(pagination) : updater;
      onPaginationChange(next);
    },
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel()
  });

  function resetColumnVisibility() {
    setColumnVisibility(JOURNAL_ENTRIES_DEFAULT_COLUMN_VISIBILITY);
  }

  return { table, resetColumnVisibility };
}

export function JournalEntriesTableView({
  table,
  page,
  pending = false,
  toolbar
}: {
  table: Table<FineractJournalEntryListItem>;
  page: FineractJournalEntriesPage;
  pending?: boolean;
  toolbar?: ReactNode;
}) {
  return (
    <div className="space-y-4">
      {toolbar ? (
        <div className="flex flex-wrap items-center justify-end gap-2">{toolbar}</div>
      ) : null}
      <DataTable
        table={table}
        stickyHeader={false}
        emptyMessage={pending ? 'Loading journal entries…' : 'No journal entries found'}
        emptyDescription="Try adjusting your filters or date range."
      />
      <DataTablePagination table={table} totalRecords={page.totalFilteredRecords} />
    </div>
  );
}
