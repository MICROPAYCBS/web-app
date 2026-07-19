'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractProvisioningEntryLineItem } from '@mifos/api-client';
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
import { formatProvisioningAmount } from '@/lib/fineract/provisioning-entry-display';

export function ProvisioningEntryEntriesTable({
  lines
}: {
  lines: FineractProvisioningEntryLineItem[];
}) {
  const [officeFilter, setOfficeFilter] = useState('');
  const [productFilter, setProductFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25
  });

  const columns = useMemo<ColumnDef<FineractProvisioningEntryLineItem>[]>(
    () => [
      {
        id: 'officeName',
        accessorKey: 'officeName',
        header: 'Office'
      },
      {
        id: 'productName',
        accessorKey: 'productName',
        header: 'Product'
      },
      {
        id: 'currencyCode',
        accessorKey: 'currencyCode',
        header: 'Currency'
      },
      {
        id: 'categoryName',
        accessorKey: 'categoryName',
        header: 'Category'
      },
      {
        id: 'amountreserved',
        header: 'Provisioning amount',
        cell: ({ row }) =>
          formatProvisioningAmount(row.original.amountreserved, row.original.currencyCode)
      },
      {
        id: 'liabilityAccountName',
        accessorKey: 'liabilityAccountName',
        header: 'Liability account (CR)'
      },
      {
        id: 'expenseAccountName',
        accessorKey: 'expenseAccountName',
        header: 'Expense account (DR)'
      }
    ],
    []
  );

  const filteredLines = useMemo(() => {
    const office = officeFilter.trim().toLowerCase();
    const product = productFilter.trim().toLowerCase();
    const category = categoryFilter.trim().toLowerCase();
    return lines.filter(
      (line) =>
        (!office || line.officeName.toLowerCase().includes(office)) &&
        (!product || line.productName.toLowerCase().includes(product)) &&
        (!category || line.categoryName.toLowerCase().includes(category))
    );
  }, [categoryFilter, lines, officeFilter, productFilter]);

  const table = useReactTable({
    data: filteredLines,
    columns,
    state: { pagination },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  });

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Input
          placeholder="Filter by office…"
          value={officeFilter}
          onChange={(event) => {
            setOfficeFilter(event.target.value);
            setPagination((current) => ({ ...current, pageIndex: 0 }));
          }}
          aria-label="Filter by office"
        />
        <Input
          placeholder="Filter by loan product…"
          value={productFilter}
          onChange={(event) => {
            setProductFilter(event.target.value);
            setPagination((current) => ({ ...current, pageIndex: 0 }));
          }}
          aria-label="Filter by loan product"
        />
        <Input
          placeholder="Filter by category…"
          value={categoryFilter}
          onChange={(event) => {
            setCategoryFilter(event.target.value);
            setPagination((current) => ({ ...current, pageIndex: 0 }));
          }}
          aria-label="Filter by provisioning category"
        />
      </div>
      <DataTable
        table={table}
        stickyHeader={false}
        emptyMessage="No provisioning lines found"
        emptyDescription="This entry has no calculated provisioning lines."
      />
      <DataTablePagination table={table} totalRecords={table.getFilteredRowModel().rows.length} />
    </div>
  );
}
