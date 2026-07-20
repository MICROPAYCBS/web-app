'use client';

/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractGlAccountLedgerEntry } from '@mifos/api-client';
import {
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type Table,
  type VisibilityState
} from '@tanstack/react-table';
import { JournalEntryTransactionLink } from '@/components/accounting/journal-entries/journal-entry-transaction-panel';
import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { DataTable } from '@/components/composites/data-table/data-table';
import { formatJournalEntryDate } from '@/lib/accounting/journal-entry-display';
import { formatGlAccountEnquiryAmountOnly } from '@/lib/accounting/gl-account-enquiry-display';
import {
  readStoredColumnVisibility,
  writeStoredColumnVisibility
} from '@/lib/data-table/column-visibility';

const COLUMN_VISIBILITY_STORAGE_KEY = 'gl-account-enquiry-column-visibility-v3';

export const GL_ACCOUNT_ENQUIRY_DEFAULT_COLUMN_VISIBILITY: VisibilityState = {
  description: false,
  source: true
};

export function useGlAccountEnquiryTable({
  entries
}: {
  entries: FineractGlAccountLedgerEntry[];
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

  const columns = useMemo<ColumnDef<FineractGlAccountLedgerEntry>[]>(
    () => [
      {
        accessorKey: 'entryDate',
        header: 'Date',
        enableHiding: false,
        cell: ({ row }) => formatJournalEntryDate(row.original.entryDate)
      },
      {
        accessorKey: 'transactionId',
        header: 'Transaction ID',
        enableHiding: false,
        cell: ({ row }) =>
          row.original.transactionId ? (
            <JournalEntryTransactionLink transactionId={row.original.transactionId} />
          ) : (
            '—'
          )
      },
      {
        id: 'description',
        accessorKey: 'description',
        header: 'Description',
        cell: ({ row }) => row.original.description?.trim() || '—'
      },
      {
        id: 'source',
        accessorKey: 'source',
        header: 'Source',
        cell: ({ row }) => row.original.source
      },
      {
        id: 'debit',
        header: 'Debit',
        enableHiding: false,
        cell: ({ row }) =>
          row.original.debit > 0 ? formatGlAccountEnquiryAmountOnly(row.original.debit) : '—'
      },
      {
        id: 'credit',
        header: 'Credit',
        enableHiding: false,
        cell: ({ row }) =>
          row.original.credit > 0 ? formatGlAccountEnquiryAmountOnly(row.original.credit) : '—'
      },
      {
        id: 'runningBalance',
        header: 'Running balance',
        enableHiding: false,
        cell: ({ row }) => formatGlAccountEnquiryAmountOnly(row.original.runningBalance)
      }
    ],
    []
  );

  const table = useReactTable({
    data: entries,
    columns,
    state: { columnVisibility },
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
  pending = false,
  toolbar
}: {
  table: Table<FineractGlAccountLedgerEntry>;
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
        isLoading={pending}
        emptyMessage="No journal entries found"
        emptyDescription="Try adjusting your branch, currency, department, or date range."
      />
    </div>
  );
}
