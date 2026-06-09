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
import { useMemo, useState } from 'react';
import { DataTable } from '@/components/composites/data-table/data-table';
import { DataTablePagination } from '@/components/composites/data-table/data-table-pagination';
import { SelectField } from '@/components/composites/select-field';
import { Input } from '@/components/ui/input';
import {
  chargeAppliesToLabel,
  chargeCalculationTypeLabel,
  chargeCurrencyCode,
  chargeTimeTypeLabel,
  formatChargeAmountDisplay
} from '@/lib/fineract/charge-display';
import { chargeDetailPath } from '@/lib/fineract/charge-paths';
import { formatYesNo } from '@/lib/fineract/client-detail-labels';
import { fineractOptionLabel } from '@/lib/form/select-options';

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
  appliesToOptions
}: {
  charges: ChargeListItem[];
  appliesToOptions: { id: number; value?: string; name?: string }[];
}) {
  const [filter, setFilter] = useState('');
  const [appliesToFilter, setAppliesToFilter] = useState<string | undefined>();
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25
  });

  const filteredRows = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return charges.filter((row) => {
      if (appliesToFilter && appliesToFilter !== 'all' && String(row.chargeAppliesTo?.id) !== appliesToFilter) {
        return false;
      }
      if (!q) {
        return true;
      }
      const haystack = [
        row.name,
        chargeAppliesToLabel(row),
        chargeTimeTypeLabel(row),
        chargeCalculationTypeLabel(row),
        chargeCurrencyCode(row),
        String(row.amount ?? '')
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [appliesToFilter, charges, filter]);

  const table = useReactTable({
    data: filteredRows,
    columns: buildColumns(),
    state: { pagination },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  });

  const appliesToSelectOptions = appliesToOptions.map((option) => ({
    value: String(option.id),
    label: fineractOptionLabel(option)
  }));

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <Input
          placeholder="Filter charges…"
          value={filter}
          onChange={(event) => {
            setFilter(event.target.value);
            setPagination((prev) => ({ ...prev, pageIndex: 0 }));
          }}
          className="max-w-sm"
        />
        <SelectField
          id="charges-applies-to-filter"
          label="Applies to"
          optional
          value={appliesToFilter ?? 'all'}
          onValueChange={(value) => {
            setAppliesToFilter(value === 'all' ? undefined : value);
            setPagination((prev) => ({ ...prev, pageIndex: 0 }));
          }}
          options={[{ value: 'all', label: 'All' }, ...appliesToSelectOptions]}
          className="max-w-xs"
        />
      </div>
      <DataTable table={table} stickyHeader={false} emptyMessage="No charges match your filter." />
      <DataTablePagination table={table} totalRecords={filteredRows.length} />
    </div>
  );
}
