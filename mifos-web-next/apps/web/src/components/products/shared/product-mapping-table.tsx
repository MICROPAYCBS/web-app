'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import {
  getCoreRowModel,
  useReactTable,
  type ColumnDef
} from '@tanstack/react-table';
import { DataTable } from '@/components/composites/data-table/data-table';
import { EmptyState } from '@/components/composites';

export function ProductMappingTable({
  rows,
  leftHeader,
  rightHeader,
  emptyMessage
}: {
  rows: { left: string; right: string }[];
  leftHeader: string;
  rightHeader: string;
  emptyMessage: string;
}) {
  if (rows.length === 0) {
    return <EmptyState title={emptyMessage} />;
  }

  const columns: ColumnDef<{ left: string; right: string }>[] = [
    { accessorKey: 'left', header: leftHeader },
    { accessorKey: 'right', header: rightHeader }
  ];

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel()
  });

  return <DataTable table={table} stickyHeader={false} />;
}
