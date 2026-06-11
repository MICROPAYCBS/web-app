'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractProvisioningJournalEntry } from '@mifos/api-client';
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
  type PaginationState
} from '@tanstack/react-table';
import { useMemo, useState } from 'react';
import { DataTable } from '@/components/composites/data-table/data-table';
import { DataTablePagination } from '@/components/composites/data-table/data-table-pagination';
import { Input } from '@/components/ui/input';
import {
  formatJournalDebitCredit,
  formatProvisioningJournalDate
} from '@/lib/fineract/provisioning-entry-display';

export function ProvisioningJournalEntriesTable({
  entries
}: {
  entries: FineractProvisioningJournalEntry[];
}) {
  const [filter, setFilter] = useState('');
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25
  });

  const columns = useMemo<ColumnDef<FineractProvisioningJournalEntry>[]>(
    () => [
      {
        id: 'id',
        accessorKey: 'id',
        header: 'Entry ID'
      },
      {
        id: 'officeName',
        accessorKey: 'officeName',
        header: 'Office'
      },
      {
        id: 'transactionDate',
        header: 'Transaction date',
        cell: ({ row }) => formatProvisioningJournalDate(row.original.transactionDate)
      },
      {
        id: 'transactionId',
        accessorKey: 'transactionId',
        header: 'Transaction ID'
      },
      {
        id: 'glAccountType',
        header: 'Type',
        cell: ({ row }) => row.original.glAccountType.value || '—'
      },
      {
        id: 'createdByUserName',
        accessorKey: 'createdByUserName',
        header: 'Created by'
      },
      {
        id: 'glAccountCode',
        accessorKey: 'glAccountCode',
        header: 'Account code'
      },
      {
        id: 'glAccountName',
        accessorKey: 'glAccountName',
        header: 'Account name'
      },
      {
        id: 'debit',
        header: 'Debit',
        cell: ({ row }) => formatJournalDebitCredit(row.original).debit || '—'
      },
      {
        id: 'credit',
        header: 'Credit',
        cell: ({ row }) => formatJournalDebitCredit(row.original).credit || '—'
      }
    ],
    []
  );

  const table = useReactTable({
    data: entries,
    columns,
    state: {
      globalFilter: filter,
      pagination
    },
    onPaginationChange: setPagination,
    onGlobalFilterChange: setFilter,
    globalFilterFn: (row, _columnId, filterValue) => {
      const query = String(filterValue).trim().toLowerCase();
      if (!query) {
        return true;
      }
      const entry = row.original;
      return (
        String(entry.id).includes(query) ||
        entry.officeName.toLowerCase().includes(query) ||
        entry.transactionId.toLowerCase().includes(query) ||
        entry.glAccountCode.toLowerCase().includes(query) ||
        entry.glAccountName.toLowerCase().includes(query) ||
        entry.createdByUserName.toLowerCase().includes(query)
      );
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  });

  return (
    <div className="space-y-4">
      <Input
        placeholder="Filter journal entries…"
        value={filter}
        onChange={(event) => {
          setFilter(event.target.value);
          setPagination((current) => ({ ...current, pageIndex: 0 }));
        }}
        className="max-w-sm"
        aria-label="Filter journal entries"
      />
      <DataTable
        table={table}
        stickyHeader={false}
        emptyMessage="No journal entries found"
        emptyDescription="Journal entries have not been created for this provisioning entry yet."
      />
      <DataTablePagination table={table} totalRecords={table.getFilteredRowModel().rows.length} />
    </div>
  );
}
