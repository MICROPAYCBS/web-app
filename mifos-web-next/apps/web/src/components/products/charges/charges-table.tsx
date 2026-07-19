'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { ChargeListItem } from '@mifos/api-client';
import {
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
  type PaginationState
} from '@tanstack/react-table';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { DataTable } from '@/components/composites/data-table/data-table';
import { DataTablePagination } from '@/components/composites/data-table/data-table-pagination';
import { Input } from '@/components/ui/input';
import {
  chargeAppliesToLabel,
  chargeCalculationTypeLabel,
  chargeCurrencyCode,
  chargeTimeTypeLabel,
  formatChargeAmountDisplay
} from '@/lib/fineract/charge-display';
import { chargeDetailPath } from '@/lib/fineract/charge-paths';
import { filterChargeListItems, type ChargeListFilters } from '@/lib/fineract/charge-list-query';
import { formatYesNo } from '@/lib/fineract/client-detail-labels';

function buildColumns(): ColumnDef<ChargeListItem>[] {
  return [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <Link
          href={chargeDetailPath(row.original.id)}
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          {row.original.name ?? '—'}
        </Link>
      )
    },
    {
      id: 'chargeAppliesTo',
      header: 'Applies to',
      cell: ({ row }) => chargeAppliesToLabel(row.original)
    },
    {
      id: 'chargeTimeType',
      header: 'Time',
      cell: ({ row }) => chargeTimeTypeLabel(row.original)
    },
    {
      id: 'chargeCalculationType',
      header: 'Calculation',
      cell: ({ row }) => chargeCalculationTypeLabel(row.original)
    },
    {
      id: 'amount',
      header: () => <span className="block w-full text-right">Amount</span>,
      cell: ({ row }) => {
        const code = chargeCurrencyCode(row.original);
        const formatted = formatChargeAmountDisplay(
          row.original,
          code === '—' ? undefined : code
        );
        return (
          <span className="block w-full text-right tabular-nums">{formatted}</span>
        );
      }
    },
    {
      id: 'penalty',
      header: 'Penalty',
      cell: ({ row }) => formatYesNo(row.original.penalty)
    },
    {
      id: 'active',
      header: 'Active',
      cell: ({ row }) => formatYesNo(row.original.active)
    }
  ];
}

export function ChargesTable({
  charges,
  appliedFilters,
  filterTrigger
}: {
  charges: ChargeListItem[];
  appliedFilters: ChargeListFilters;
  filterTrigger?: ReactNode;
}) {
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25
  });

  const filteredRows = useMemo(
    () => filterChargeListItems(charges, search, appliedFilters),
    [appliedFilters, charges, search]
  );

  useEffect(() => {
    setPagination((current) => ({ ...current, pageIndex: 0 }));
  }, [appliedFilters, search]);

  const table = useReactTable({
    data: filteredRows,
    columns: buildColumns(),
    state: { pagination },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <Input
          placeholder="Filter charges…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="max-w-sm"
        />
        {filterTrigger ? (
          <div className="flex flex-wrap items-center justify-end gap-2">{filterTrigger}</div>
        ) : null}
      </div>
      <DataTable table={table} stickyHeader={false} emptyMessage="No charges match your search or filters." />
      <DataTablePagination table={table} totalRecords={filteredRows.length} />
    </div>
  );
}
