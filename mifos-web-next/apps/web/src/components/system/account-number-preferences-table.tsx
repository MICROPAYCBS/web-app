'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractAccountNumberPreferenceListItem } from '@mifos/api-client';
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
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  accountNumberFormatModeLabel,
  accountNumberFormatPatternSummary,
  accountNumberPreferenceLabel
} from '@/lib/fineract/account-number-preference-display';

export function AccountNumberPreferencesTable({
  preferences
}: {
  preferences: FineractAccountNumberPreferenceListItem[];
}) {
  const [filter, setFilter] = useState('');
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25
  });

  const columns = useMemo<ColumnDef<FineractAccountNumberPreferenceListItem>[]>(
    () => [
      {
        id: 'accountType',
        accessorFn: (row) => row.accountType.value,
        header: 'Account type',
        cell: ({ row }) => (
          <Link
            href={`/system/account-number-preferences/${row.original.id}`}
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            {accountNumberPreferenceLabel(row.original.accountType)}
          </Link>
        )
      },
      {
        id: 'mode',
        accessorFn: (row) => accountNumberFormatModeLabel(row),
        header: 'Mode',
        cell: ({ row }) => (
          <Badge variant={row.original.structuredEnabled ? 'default' : 'secondary'}>
            {accountNumberFormatModeLabel(row.original)}
          </Badge>
        )
      },
      {
        id: 'summary',
        accessorFn: (row) => accountNumberFormatPatternSummary(row),
        header: 'Format summary',
        cell: ({ row }) => (
          <span className="font-mono text-xs">{accountNumberFormatPatternSummary(row.original)}</span>
        )
      },
      {
        id: 'prefixType',
        accessorFn: (row) => row.prefixType?.value ?? '',
        header: 'Legacy prefix',
        cell: ({ row }) =>
          row.original.structuredEnabled
            ? '—'
            : accountNumberPreferenceLabel(row.original.prefixType)
      }
    ],
    []
  );

  const table = useReactTable({
    data: preferences,
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
      const preference = row.original;
      return (
        preference.accountType.value.toLowerCase().includes(query) ||
        (preference.prefixType?.value.toLowerCase().includes(query) ?? false) ||
        (preference.formatPattern?.toLowerCase().includes(query) ?? false) ||
        accountNumberFormatModeLabel(preference).toLowerCase().includes(query)
      );
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  });

  return (
    <div className="space-y-4">
      <Input
        placeholder="Filter preferences…"
        value={filter}
        onChange={(event) => {
          setFilter(event.target.value);
          setPagination((current) => ({ ...current, pageIndex: 0 }));
        }}
        className="max-w-sm"
        aria-label="Filter account number preferences"
      />
      <DataTable
        table={table}
        stickyHeader={false}
        emptyMessage="No preferences found"
        emptyDescription="Create a preference to control how account numbers are generated."
      />
      <DataTablePagination table={table} totalRecords={table.getFilteredRowModel().rows.length} />
    </div>
  );
}
