'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractJournalEntryListItem } from '@mifos/api-client';
import {
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
  type PaginationState
} from '@tanstack/react-table';
import { BookOpen } from 'lucide-react';
import { useMemo, useState } from 'react';
import { JournalEntryTransactionLink } from '@/components/accounting/journal-entries/journal-entry-transaction-panel';
import { EmptyState } from '@/components/composites';
import { DataTable } from '@/components/composites/data-table/data-table';
import { DataTablePagination } from '@/components/composites/data-table/data-table-pagination';
import {
  formatJournalEntryDate,
  formatJournalEntryLineAmount,
  formatJournalEntrySideLabel
} from '@/lib/accounting/journal-entry-display';

const PAGE_SIZE = 25;

function buildColumns(): ColumnDef<FineractJournalEntryListItem>[] {
  return [
    {
      id: 'transactionDate',
      header: 'Entry date',
      cell: ({ row }) => formatJournalEntryDate(row.original.transactionDate)
    },
    {
      accessorKey: 'transactionId',
      header: 'Transaction',
      cell: ({ row }) => (
        <JournalEntryTransactionLink
          transactionId={row.original.transactionId}
          className="font-mono text-sm"
        />
      )
    },
    {
      accessorKey: 'glAccountCode',
      header: 'Account code',
      cell: ({ row }) => (
        <span className="font-mono text-sm">{row.original.glAccountCode}</span>
      )
    },
    {
      accessorKey: 'glAccountName',
      header: 'Account name',
      cell: ({ row }) => row.original.glAccountName
    },
    {
      id: 'entryType',
      accessorFn: (row) => row.entryType.value,
      header: () => <span className="block w-full text-right">Entry type</span>,
      cell: ({ row }) => {
        const entry = row.original;
        return (
          <div className="flex items-baseline justify-end gap-3 tabular-nums text-right">
            <span>{formatJournalEntrySideLabel(entry)}</span>
            <span>{formatJournalEntryLineAmount(entry)}</span>
          </div>
        );
      }
    }
  ];
}

export function AccountJournalEntriesView({
  entries,
  loadFailed = false,
  totalRecords,
  productLabel
}: {
  entries: FineractJournalEntryListItem[];
  loadFailed?: boolean;
  totalRecords?: number;
  /** e.g. "this loan", "this savings account" */
  productLabel: string;
}) {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: PAGE_SIZE
  });
  const columns = useMemo(() => buildColumns(), []);
  const table = useReactTable({
    data: entries,
    columns,
    state: { pagination },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  });

  if (loadFailed) {
    return (
      <EmptyState
        icon={BookOpen}
        title="Journal entries unavailable"
        description={`Journal entries could not be loaded for ${productLabel}.`}
      />
    );
  }

  if (entries.length === 0) {
    return (
      <EmptyState
        icon={BookOpen}
        title="No journal entries"
        description={`No journal entries are linked to ${productLabel}. That is normal when the product does not post to the ledger.`}
      />
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Showing {entries.length}
        {totalRecords != null && totalRecords > entries.length ? ` of ${totalRecords}` : ''}{' '}
        journal {entries.length === 1 ? 'entry' : 'entries'}, newest first. Select a transaction
        to open the full posting.
      </p>
      <DataTable table={table} stickyHeader={false} emptyMessage="No journal entries." />
      {entries.length > PAGE_SIZE ? (
        <DataTablePagination table={table} totalRecords={entries.length} />
      ) : null}
    </div>
  );
}
