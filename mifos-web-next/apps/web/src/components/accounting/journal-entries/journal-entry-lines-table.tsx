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
  formatJournalEntryDate,
  formatJournalEntryLineAmount,
  formatJournalEntrySideLabel
} from '@/lib/accounting/journal-entry-display';

function buildColumns(): ColumnDef<FineractJournalEntryListItem>[] {
  return [
    {
      accessorKey: 'id',
      header: 'Entry ID',
      cell: ({ row }) => <span className="tabular-nums">{row.original.id}</span>
    },
    {
      accessorKey: 'officeName',
      header: 'Branch',
      cell: ({ row }) => row.original.officeName || '—'
    },
    {
      id: 'glAccountType',
      accessorFn: (row) => row.glAccountType.value,
      header: 'Account type',
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
