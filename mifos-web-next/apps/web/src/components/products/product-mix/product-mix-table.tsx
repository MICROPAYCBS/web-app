'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { ProductMixListItem } from '@mifos/api-client';
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
import { productMixDetailPath } from '@/lib/fineract/product-mix-paths';

const columns: ColumnDef<ProductMixListItem>[] = [
  {
    accessorKey: 'productName',
    header: 'Product name',
    cell: ({ row }) => (
      <Link
        href={productMixDetailPath(row.original.productId)}
        className="font-medium text-primary underline-offset-4 hover:underline"
      >
        {row.original.productName ?? `Product #${row.original.productId}`}
      </Link>
    )
  },
  {
    id: 'restrictedCount',
    header: () => <span className="block w-full text-right">Restricted</span>,
    cell: ({ row }) => (
      <span className="block w-full text-right tabular-nums">
        {row.original.restrictedProducts?.length ?? 0}
      </span>
    )
  },
  {
    id: 'allowedCount',
    header: () => <span className="block w-full text-right">Allowed</span>,
    cell: ({ row }) => (
      <span className="block w-full text-right tabular-nums">
        {row.original.allowedProducts?.length ?? 0}
      </span>
    )
  }
];

export function ProductMixTable({ mixes }: { mixes: ProductMixListItem[] }) {
  const [filter, setFilter] = useState('');
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25
  });

  const filteredRows = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) {
      return mixes;
    }
    return mixes.filter((row) => {
      const haystack = [
        row.productName,
        String(row.productId),
        String(row.restrictedProducts?.length ?? ''),
        String(row.allowedProducts?.length ?? '')
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [filter, mixes]);

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
        placeholder="Filter product mixes…"
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
        emptyMessage="No product mixes match your filter."
      />
      <DataTablePagination table={table} totalRecords={filteredRows.length} />
    </div>
  );
}
