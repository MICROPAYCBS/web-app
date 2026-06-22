'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractJournalEntryListItem } from '@mifos/api-client';
import { getCoreRowModel, useReactTable, type ColumnDef } from '@tanstack/react-table';
import { useMemo } from 'react';
import { DataTable } from '@/components/composites/data-table/data-table';
import {
  formatJournalEntryAmount,
  formatJournalEntryDate
} from '@/lib/accounting/journal-entry-display';

function buildColumns(): ColumnDef<FineractJournalEntryListItem>[] {
  return [
    {
      accessorKey: 'id',
      header: 'Entry ID',
      cell: ({ row }) => <span className="tabular-nums">{row.original.id}</span>
    },
    {
      id: 'glAccountType',
      accessorFn: (row) => row.glAccountType.value,
      header: 'Type',
      cell: ({ row }) => row.original.glAccountType.value
    },
    {
      accessorKey: 'glAccountCode',
      header: 'Account code',
      cell: ({ row }) => row.original.glAccountCode
    },
    {
      accessorKey: 'glAccountName',
      header: 'Account name',
      cell: ({ row }) => row.original.glAccountName
    },
    {
      id: 'debit',
      header: () => <span className="block w-full text-right">Debit</span>,
      cell: ({ row }) => (
        <span className="block w-full text-right tabular-nums">
          {formatJournalEntryAmount(row.original, 'DEBIT')}
        </span>
      )
    },
    {
      id: 'credit',
      header: () => <span className="block w-full text-right">Credit</span>,
      cell: ({ row }) => (
        <span className="block w-full text-right tabular-nums">
          {formatJournalEntryAmount(row.original, 'CREDIT')}
        </span>
      )
    },
    {
      id: 'transactionDate',
      header: 'Entry date',
      cell: ({ row }) => formatJournalEntryDate(row.original.transactionDate)
    }
  ];
}

export function JournalEntryLinesTable({
  entries
}: {
  entries: FineractJournalEntryListItem[];
}) {
  const columns = useMemo(() => buildColumns(), []);
  const table = useReactTable({
    data: entries,
    columns,
    getCoreRowModel: getCoreRowModel()
  });

  return (
    <DataTable
      table={table}
      stickyHeader={false}
      emptyMessage="No ledger entries."
    />
  );
}
