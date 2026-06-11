'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractAccountingRuleListItem } from '@mifos/api-client';
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
  type PaginationState
} from '@tanstack/react-table';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { DataTable } from '@/components/composites/data-table/data-table';
import { DataTablePagination } from '@/components/composites/data-table/data-table-pagination';
import { Input } from '@/components/ui/input';
import {
  formatAccountingRuleCreditAccount,
  formatAccountingRuleCreditTags,
  formatAccountingRuleDebitAccount,
  formatAccountingRuleDebitTags
} from '@/lib/accounting/accounting-rule-display';

export function AccountingRulesTable({ rules }: { rules: FineractAccountingRuleListItem[] }) {
  const [filter, setFilter] = useState('');
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25
  });

  const columns = useMemo<ColumnDef<FineractAccountingRuleListItem>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => (
          <Link
            href={`/accounting/accounting-rules/${row.original.id}`}
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            {row.original.name}
          </Link>
        )
      },
      {
        accessorKey: 'officeName',
        header: 'Branch',
        cell: ({ row }) => row.original.officeName
      },
      {
        id: 'debitTags',
        header: 'Debit tags',
        cell: ({ row }) => formatAccountingRuleDebitTags(row.original)
      },
      {
        id: 'debitAccount',
        header: 'Debit account',
        cell: ({ row }) => formatAccountingRuleDebitAccount(row.original)
      },
      {
        id: 'creditTags',
        header: 'Credit tags',
        cell: ({ row }) => formatAccountingRuleCreditTags(row.original)
      },
      {
        id: 'creditAccount',
        header: 'Credit account',
        cell: ({ row }) => formatAccountingRuleCreditAccount(row.original)
      }
    ],
    []
  );

  const table = useReactTable({
    data: rules,
    columns,
    state: {
      pagination,
      globalFilter: filter
    },
    onPaginationChange: setPagination,
    onGlobalFilterChange: setFilter,
    globalFilterFn: (row, _columnId, filterValue) => {
      const query = String(filterValue).trim().toLowerCase();
      if (!query) {
        return true;
      }
      const rule = row.original;
      return (
        rule.name.toLowerCase().includes(query) ||
        rule.officeName.toLowerCase().includes(query) ||
        formatAccountingRuleDebitTags(rule).toLowerCase().includes(query) ||
        formatAccountingRuleDebitAccount(rule).toLowerCase().includes(query) ||
        formatAccountingRuleCreditTags(rule).toLowerCase().includes(query) ||
        formatAccountingRuleCreditAccount(rule).toLowerCase().includes(query)
      );
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  });

  return (
    <div className="space-y-4">
      <Input
        value={filter}
        onChange={(event) => setFilter(event.target.value)}
        placeholder="Search accounting rules…"
        className="max-w-sm"
        aria-label="Search accounting rules"
      />
      <DataTable
        table={table}
        stickyHeader={false}
        emptyMessage="No accounting rules found"
        emptyDescription="Create a rule to automate debit and credit GL entries."
      />
      <DataTablePagination table={table} totalRecords={table.getFilteredRowModel().rows.length} />
    </div>
  );
}
