'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { getCoreRowModel, useReactTable, type ColumnDef } from '@tanstack/react-table';
import { useMemo } from 'react';
import { DataTable } from '@/components/composites/data-table/data-table';
import { Badge } from '@/components/ui/badge';

export interface ClientAccountRow {
  id: number;
  accountNo: string;
  productName?: string;
  statusLabel?: string;
  statusCode?: string;
  balanceLabel?: string;
  extraLabel?: string;
}

function statusVariant(code?: string): 'default' | 'secondary' | 'outline' | 'destructive' {
  if (!code) {
    return 'secondary';
  }
  if (code.includes('active')) {
    return 'default';
  }
  if (code.includes('closed') || code.includes('reject') || code.includes('withdrawn')) {
    return 'destructive';
  }
  return 'outline';
}

function buildColumns(includeExtra: boolean): ColumnDef<ClientAccountRow>[] {
  const cols: ColumnDef<ClientAccountRow>[] = [
    {
      accessorKey: 'accountNo',
      header: 'Account no.',
      cell: ({ row }) => <span className="font-medium tabular-nums">{row.original.accountNo}</span>
    },
    {
      accessorKey: 'productName',
      header: 'Product',
      cell: ({ row }) => row.original.productName ?? '—'
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={statusVariant(row.original.statusCode)}>
          {row.original.statusLabel ?? '—'}
        </Badge>
      )
    },
    {
      accessorKey: 'balanceLabel',
      header: () => <span className="block w-full text-right">Balance</span>,
      cell: ({ row }) => (
        <span className="block w-full text-right tabular-nums">
          {row.original.balanceLabel ?? '—'}
        </span>
      )
    }
  ];
  if (includeExtra) {
    cols.push({
      accessorKey: 'extraLabel',
      header: 'Details',
      cell: ({ row }) => row.original.extraLabel ?? '—'
    });
  }
  return cols;
}

export function ClientAccountsTable({
  rows,
  emptyMessage
}: {
  rows: ClientAccountRow[];
  emptyMessage: string;
}) {
  const includeExtra = rows.some((r) => r.extraLabel);
  const columns = useMemo(() => buildColumns(includeExtra), [includeExtra]);

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel()
  });

  return <DataTable table={table} emptyMessage={emptyMessage} />;
}
