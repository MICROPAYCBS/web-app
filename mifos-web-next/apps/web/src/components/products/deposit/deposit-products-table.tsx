'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { DepositProductKind, DepositProductListItem } from '@mifos/api-client';
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
import { Input } from '@/components/ui/input';
import { depositProductConfig } from '@/lib/fineract/deposit-product-config';
import {
  productListAccountingLabel,
  productListCurrencyCode
} from '@/lib/fineract/product-list-display';

export function DepositProductsTable({
  kind,
  products
}: {
  kind: DepositProductKind;
  products: DepositProductListItem[];
}) {
  const config = depositProductConfig(kind);
  const [filter, setFilter] = useState('');
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25
  });

  const columns = useMemo<ColumnDef<DepositProductListItem>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => (
          <Link
            href={`${config.listPath}/${row.original.id}`}
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            {row.original.name ?? '—'}
          </Link>
        )
      },
      {
        accessorKey: 'shortName',
        header: 'Short name',
        cell: ({ row }) => row.original.shortName ?? '—'
      },
      {
        id: 'currencyCode',
        header: 'Currency',
        cell: ({ row }) => (
          <span className="font-medium tabular-nums">
            {productListCurrencyCode(row.original)}
          </span>
        )
      },
      {
        id: 'accountingRule',
        header: 'Accounting',
        cell: ({ row }) => productListAccountingLabel(row.original.accountingRule)
      }
    ],
    [config.listPath]
  );

  const filteredRows = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) {
      return products;
    }
    return products.filter((row) => {
      const haystack = [
        row.name,
        row.shortName,
        row.currencyCode,
        productListAccountingLabel(row.accountingRule)
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
        placeholder={`Filter ${config.labelPlural.toLowerCase()}…`}
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
        emptyMessage={`No ${config.labelPlural.toLowerCase()} match your filter.`}
      />
      <DataTablePagination table={table} totalRecords={filteredRows.length} />
    </div>
  );
}
