'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { OrganizationCashierListItem } from '@mifos/api-client';
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
import { formatFineractDateArray } from '@/lib/fineract/dates';
import { formatYesNo } from '@/lib/fineract/client-detail-labels';

function formatCashierPeriod(cashier: OrganizationCashierListItem): string {
  const start = formatFineractDateArray(cashier.startDate) ?? '—';
  const end = formatFineractDateArray(cashier.endDate) ?? '—';
  return `${start} – ${end}`;
}

export function CashiersTable({ cashiers }: { cashiers: OrganizationCashierListItem[] }) {
  const [filter, setFilter] = useState('');
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25
  });

  const filteredRows = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) {
      return cashiers;
    }
    return cashiers.filter((row) => {
      const haystack = [row.staffName, formatCashierPeriod(row)]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [cashiers, filter]);

  const columns = useMemo<ColumnDef<OrganizationCashierListItem>[]>(
    () => [
      {
        id: 'period',
        header: 'Period',
        cell: ({ row }) => formatCashierPeriod(row.original)
      },
      {
        accessorKey: 'staffName',
        header: 'Cashier / staff',
        cell: ({ row }) => row.original.staffName ?? '—'
      },
      {
        id: 'isFullDay',
        header: 'Full day',
        cell: ({ row }) => formatYesNo(row.original.isFullDay)
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
        placeholder="Filter cashiers…"
        value={filter}
        onChange={(event) => {
          setFilter(event.target.value);
          setPagination((prev) => ({ ...prev, pageIndex: 0 }));
        }}
        className="max-w-sm"
        aria-label="Filter cashiers"
      />
      <DataTable
        table={table}
        stickyHeader={false}
        emptyMessage="No cashiers found"
        emptyDescription="Cashier assignments for this teller will appear here."
      />
      <DataTablePagination table={table} totalRecords={filteredRows.length} />
    </div>
  );
}
