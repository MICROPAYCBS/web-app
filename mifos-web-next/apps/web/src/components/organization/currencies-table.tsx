'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractCurrencyOption } from '@mifos/api-client';
import {
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
  type PaginationState
} from '@tanstack/react-table';
import { useMemo, useState } from 'react';
import { DataTable } from '@/components/composites/data-table/data-table';
import { DataTablePagination } from '@/components/composites/data-table/data-table-pagination';
import { Input } from '@/components/ui/input';

export function CurrenciesTable({ currencies }: { currencies: FineractCurrencyOption[] }) {
  const [filter, setFilter] = useState('');
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25
  });

  const filteredRows = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) {
      return currencies;
    }
    return currencies.filter((row) => {
      const haystack = [row.name, row.code].filter(Boolean).join(' ').toLowerCase();
      return haystack.includes(q);
    });
  }, [currencies, filter]);

  const columns = useMemo<ColumnDef<FineractCurrencyOption>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Currency name',
        cell: ({ row }) => row.original.name ?? '—'
      },
      {
        accessorKey: 'code',
        header: 'Currency code',
        cell: ({ row }) => row.original.code ?? '—'
      }
    ],
    []
  );

  const table = useReactTable({
    data: filteredRows,
    columns,
    state: { pagination },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  });

  return (
    <div className="space-y-4">
      <Input
        placeholder="Filter currencies…"
        value={filter}
        onChange={(event) => {
          setFilter(event.target.value);
          setPagination((prev) => ({ ...prev, pageIndex: 0 }));
        }}
        className="max-w-sm"
        aria-label="Filter currencies"
      />
      <DataTable
        table={table}
        emptyMessage="No currencies configured"
        emptyDescription="Add currencies your organization will use for accounts and transactions."
      />
      <DataTablePagination table={table} totalRecords={filteredRows.length} />
    </div>
  );
}
