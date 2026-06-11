'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { ProductMixProductOption } from '@mifos/api-client';
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

const columns: ColumnDef<ProductMixProductOption>[] = [
  {
    accessorKey: 'name',
    header: 'Product name',
    cell: ({ row }) => row.original.name ?? `Product #${row.original.id}`
  }
];

export function ProductMixProductsTable({
  title,
  products,
  emptyMessage
}: {
  title: string;
  products: ProductMixProductOption[];
  emptyMessage: string;
}) {
  const [filter, setFilter] = useState('');
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10
  });

  const filteredRows = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) {
      return products;
    }
    return products.filter((row) =>
      [row.name, String(row.id)].filter(Boolean).join(' ').toLowerCase().includes(q)
    );
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
      <h3 className="text-base font-medium">{title}</h3>
      <Input
        placeholder={`Filter ${title.toLowerCase()}…`}
        value={filter}
        onChange={(event) => {
          setFilter(event.target.value);
          setPagination((prev) => ({ ...prev, pageIndex: 0 }));
        }}
        className="max-w-sm"
      />
      <DataTable table={table} stickyHeader={false} emptyMessage={emptyMessage} />
      <DataTablePagination table={table} totalRecords={filteredRows.length} />
    </div>
  );
}
