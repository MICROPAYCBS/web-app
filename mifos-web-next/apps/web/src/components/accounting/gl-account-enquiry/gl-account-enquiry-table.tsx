'use client';

/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

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
import type { GlAccountEnquiryLine } from '@/lib/fineract/gl-account-enquiry-query';
import {
  readStoredColumnVisibility,
  writeStoredColumnVisibility
} from '@/lib/data-table/column-visibility';

const COLUMN_VISIBILITY_STORAGE_KEY = 'gl-account-enquiry-column-visibility-v2';

export const GL_ACCOUNT_ENQUIRY_DEFAULT_COLUMN_VISIBILITY: VisibilityState = {
  description: false,
  source: true
};

export function useGlAccountEnquiryTable({ lines }: { lines: GlAccountEnquiryLine[] }) {
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

  const columns = useMemo<ColumnDef<GlAccountEnquiryLine>[]>(
    () => [
      {
        accessorKey: 'transactionId',
        header: 'Transaction ID',
        enableHiding: false,
        cell: ({ row }) =>
          row.original.transactionId && row.original.transactionId !== '—' ? (
            <JournalEntryTransactionLink transactionId={row.original.transactionId} />
          ) : (
            '—'
          )
      },
      {
        accessorKey: 'entryDate',
        header: 'Transaction date',
        enableHiding: false,
        cell: ({ row }) => formatJournalEntryDate(row.original.entryDate)
      },
      {
        id: 'source',
        accessorKey: 'source',
        header: 'Source',
        cell: ({ row }) => row.original.source
      },
      {
        id: 'description',
        accessorKey: 'description',
        header: 'Description',
        cell: ({ row }) => row.original.description?.trim() || '—'
      },
      {
        id: 'debit',
        header: 'Debit',
        enableHiding: false,
        cell: ({ row }) =>
          row.original.debitAmount > 0
            ? formatGlAccountEnquiryAmountOnly(row.original.debitAmount)
            : '—'
      },
      {
        id: 'credit',
        header: 'Credit',
        enableHiding: false,
        cell: ({ row }) =>
          row.original.creditAmount > 0
            ? formatGlAccountEnquiryAmountOnly(row.original.creditAmount)
            : '—'
      },
      {
        id: 'runningBalance',
        header: 'Balance',
        enableHiding: false,
        cell: ({ row }) => formatGlAccountEnquiryAmountOnly(row.original.cumulativeSum)
      }
    ],
    []
  );

  const table = useReactTable({
    data: lines,
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
  table: Table<GlAccountEnquiryLine>;
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
        emptyDescription="Try adjusting your account, branch, currency, or date range."
      />
    </div>
  );
}
