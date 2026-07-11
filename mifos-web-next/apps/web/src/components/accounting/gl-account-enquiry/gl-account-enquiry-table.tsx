'use client';

/**
 * Copyright since 2026 MicroPay
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
import Link from 'next/link';
import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { DataTable } from '@/components/composites/data-table/data-table';
import { DataTablePagination } from '@/components/composites/data-table/data-table-pagination';
import { Button } from '@/components/ui/button';
import {
  formatJournalEntryAmount,
  formatJournalEntryDate,
  formatJournalEntryDateTime,
  formatJournalEntryDepartment
} from '@/lib/accounting/journal-entry-display';
import { formatGlAccountEnquiryMoney } from '@/lib/accounting/gl-account-enquiry-display';
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
  'referenceNumber',
  'debit',
  'credit'
] as const;

export type GlAccountEnquirySortColumn = (typeof SORTABLE_COLUMNS)[number];

const COLUMN_VISIBILITY_STORAGE_KEY = 'gl-account-enquiry-column-visibility';

export const GL_ACCOUNT_ENQUIRY_DEFAULT_COLUMN_VISIBILITY: VisibilityState = {
  officeName: false,
  glAccountType: false,
  createdByUserName: false,
  submittedOnDate: false,
  currency: false,
  department: false,
  referenceNumber: false,
  comments: false
};

function SortableHeader({
  label,
  column,
  activeColumn,
  sortOrder,
  onSort
}: {
  label: string;
  column: GlAccountEnquirySortColumn;
  activeColumn?: string;
  sortOrder?: string;
  onSort: (column: GlAccountEnquirySortColumn) => void;
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

function readRunningBalance(
  entry: FineractJournalEntryListItem,
  balanceScope: 'office' | 'organization'
): number | undefined {
  const value =
    balanceScope === 'office' ? entry.officeRunningBalance : entry.organizationRunningBalance;
  return value != null && Number.isFinite(value) ? value : undefined;
}

export function useGlAccountEnquiryTable({
  page,
  pageSize,
  pageIndex,
  orderBy,
  sortOrder,
  balanceScope,
  onSort,
  onPaginationChange
}: {
  page: FineractJournalEntriesPage;
  pageSize: number;
  pageIndex: number;
  orderBy: string;
  sortOrder: string;
  balanceScope: 'office' | 'organization';
  onSort: (column: GlAccountEnquirySortColumn) => void;
  onPaginationChange: (pagination: PaginationState) => void;
}) {
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    GL_ACCOUNT_ENQUIRY_DEFAULT_COLUMN_VISIBILITY
  );

  useEffect(() => {
    const stored = readStoredColumnVisibility(COLUMN_VISIBILITY_STORAGE_KEY);
    if (stored) {
      setColumnVisibility({ ...GL_ACCOUNT_ENQUIRY_DEFAULT_COLUMN_VISIBILITY, ...stored });
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
          <Link
            href={`/accounting/journal-entries/transactions/${row.original.transactionId}`}
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            {row.original.transactionId}
          </Link>
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
        id: 'department',
        meta: { label: 'Department' },
        header: 'Department',
        cell: ({ row }) => formatJournalEntryDepartment(row.original) ?? '—'
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
        id: 'currency',
        accessorFn: (row) => row.currency.code,
        meta: { label: 'Currency' },
        header: 'Currency',
        cell: ({ row }) => row.original.currency.code
      },
      {
        accessorKey: 'referenceNumber',
        meta: { label: 'Reference' },
        header: () => (
          <SortableHeader
            label="Reference"
            column="referenceNumber"
            activeColumn={orderBy}
            sortOrder={sortOrder}
            onSort={onSort}
          />
        ),
        cell: ({ row }) => row.original.referenceNumber ?? '—'
      },
      {
        id: 'comments',
        accessorFn: (row) => row.comments ?? '',
        meta: { label: 'Comments' },
        header: 'Comments',
        cell: ({ row }) => row.original.comments ?? '—'
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
      },
      {
        id: 'runningBalance',
        enableHiding: false,
        meta: {
          label: balanceScope === 'office' ? 'Branch balance' : 'Organization balance'
        },
        header: balanceScope === 'office' ? 'Branch balance' : 'Organization balance',
        cell: ({ row }) =>
          formatGlAccountEnquiryMoney(
            readRunningBalance(row.original, balanceScope),
            row.original.currency.code
          )
      }
    ],
    [balanceScope, onSort, orderBy, sortOrder]
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
    setColumnVisibility(GL_ACCOUNT_ENQUIRY_DEFAULT_COLUMN_VISIBILITY);
  }

  return { table, resetColumnVisibility };
}

export function GlAccountEnquiryTableView({
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
        emptyMessage={pending ? 'Loading entries…' : 'No journal entries found'}
        emptyDescription="Try adjusting your filters or date range."
      />
      <DataTablePagination table={table} totalRecords={page.totalFilteredRecords} />
    </div>
  );
}
