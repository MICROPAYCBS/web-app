'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { LoanProductKind, LoanProductListItem } from '@mifos/api-client';
import {
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
  type PaginationState
} from '@tanstack/react-table';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import { DateValue } from '@/components/composites/detail/date-value';
import { DataTable } from '@/components/composites/data-table/data-table';
import { DataTablePagination } from '@/components/composites/data-table/data-table-pagination';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { loanProductDetailPath } from '@/lib/fineract/loan-product-paths';
import {
  productListAccountingLabel,
  productListCurrencyCode
} from '@/lib/fineract/product-list-display';
import {
  productStatusLabel,
  productStatusVariant
} from '@/lib/fineract/product-status-display';

function buildColumns(kind: LoanProductKind): ColumnDef<LoanProductListItem>[] {
  return [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <Link
          href={loanProductDetailPath(row.original.id, kind)}
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
        <span className="font-medium tabular-nums">{productListCurrencyCode(row.original)}</span>
      )
    },
    {
      id: 'accountingRule',
      header: 'Accounting',
      cell: ({ row }) => productListAccountingLabel(row.original.accountingRule)
    },
    {
      accessorKey: 'closeDate',
      header: 'Expiry date',
      cell: ({ row }) => <DateValue value={row.original.closeDate} />
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={productStatusVariant(row.original.status)}>
          {productStatusLabel(row.original.status)}
        </Badge>
      )
    }
  ];
}

export function LoanProductsTable({
  products,
  productKind,
  filterTrigger
}: {
  products: LoanProductListItem[];
  productKind: LoanProductKind;
  filterTrigger?: ReactNode;
}) {
  const [filter, setFilter] = useState('');
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25
  });

  const columns = useMemo(() => buildColumns(productKind), [productKind]);

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
        productListAccountingLabel(row.accountingRule),
        row.status,
        row.closeDate
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <Input
          placeholder="Filter loan products…"
          value={filter}
          onChange={(event) => {
            setFilter(event.target.value);
            setPagination((prev) => ({ ...prev, pageIndex: 0 }));
          }}
          className="max-w-sm"
        />
        {filterTrigger ? (
          <div className="flex flex-wrap items-center justify-end gap-2">{filterTrigger}</div>
        ) : null}
      </div>
      <DataTable
        table={table}
        stickyHeader={false}
        emptyMessage="No loan products match your filter."
      />
      <DataTablePagination table={table} totalRecords={filteredRows.length} />
    </div>
  );
}
