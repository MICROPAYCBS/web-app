'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { CollateralProductListItem } from '@mifos/api-client';
import {
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
  type PaginationState
} from '@tanstack/react-table';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { MoneyValue } from '@/components/composites/detail/money-value';
import { DataTable } from '@/components/composites/data-table/data-table';
import { collateralProductCurrencyCode } from '@/lib/fineract/collateral-product-display';
import { DataTablePagination } from '@/components/composites/data-table/data-table-pagination';
import { Input } from '@/components/ui/input';
import {
  productListAccountingLabel,
  productListCurrencyCode
} from '@/lib/fineract/product-list-display';

const columns: ColumnDef<CollateralProductListItem>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ row }) => (
      <Link
        href={`/products/collaterals/${row.original.id}`}
        className="font-medium text-primary underline-offset-4 hover:underline"
      >
        {row.original.name ?? '—'}
      </Link>
    )
  },
  {
    accessorKey: 'quality',
    header: 'Type/quality',
    cell: ({ row }) => row.original.quality ?? '—'
  },
  {
    id: 'currencyCode',
    header: 'Currency',
    cell: ({ row }) => (
      <span className="font-medium tabular-nums">{productListCurrencyCode(row.original)}</span>
    )
  },
  {
    id: 'accountingRule',
    header: 'Accounting',
    cell: () => productListAccountingLabel(undefined)
  },
  {
    id: 'basePrice',
    header: () => <span className="block w-full text-right">Base price</span>,
    cell: ({ row }) => (
      <span className="block w-full text-right">
        <MoneyValue
          amount={row.original.basePrice}
          currencyCode={collateralProductCurrencyCode(row.original.currency) ?? 'USD'}
        />
      </span>
    )
  },
  {
    id: 'pctToBase',
    header: () => <span className="block w-full text-right">Base %</span>,
    cell: ({ row }) => (
      <span className="block w-full text-right tabular-nums">
        {row.original.pctToBase ?? '—'}
      </span>
    )
  },
  {
    accessorKey: 'unitType',
    header: 'Unit type',
    cell: ({ row }) => row.original.unitType ?? '—'
  }
];

export function CollateralProductsTable({
  products
}: {
  products: CollateralProductListItem[];
}) {
  const [filter, setFilter] = useState('');
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25
  });

  const filteredRows = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) {
      return products;
    }
    return products.filter((row) => {
      const haystack = [
        row.name,
        row.quality,
        productListCurrencyCode(row),
        row.unitType,
        String(row.basePrice ?? ''),
        String(row.pctToBase ?? '')
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [filter, products]);

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
        placeholder="Filter collateral products…"
        value={filter}
        onChange={(event) => {
          setFilter(event.target.value);
          setPagination((prev) => ({ ...prev, pageIndex: 0 }));
        }}
        className="max-w-sm"
      />
      <DataTable
        table={table}
        stickyHeader={false}
        emptyMessage="No collateral products match your filter."
      />
      <DataTablePagination table={table} totalRecords={filteredRows.length} />
    </div>
  );
}
