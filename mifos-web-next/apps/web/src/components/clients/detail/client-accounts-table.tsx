'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { getCoreRowModel, useReactTable, type ColumnDef } from '@tanstack/react-table';
import Link from 'next/link';
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
  /** General tab for this account under the client (legacy `*-accounts/{id}/general`). */
  href?: string;
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

function buildColumns(
  includeExtra: boolean,
  balanceHeader = 'Balance',
  extraHeader = 'Details'
): ColumnDef<ClientAccountRow>[] {
  const cols: ColumnDef<ClientAccountRow>[] = [
    {
      accessorKey: 'accountNo',
      header: 'Account no.',
      cell: ({ row }) => {
        const { accountNo, href } = row.original;
        if (href) {
          return (
            <Link
              href={href}
              className="font-medium tabular-nums text-primary underline-offset-4 hover:underline"
            >
              {accountNo}
            </Link>
          );
        }
        return <span className="font-medium tabular-nums">{accountNo}</span>;
      }
    },
    {
      accessorKey: 'productName',
      header: 'Product',
      cell: ({ row }) => {
        const { productName, href } = row.original;
        if (!productName) {
          return '—';
        }
        if (href) {
          return (
            <Link
              href={href}
              className="text-primary underline-offset-4 hover:underline"
            >
              {productName}
            </Link>
          );
        }
        return productName;
      }
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
      header: () => <span className="block w-full text-right">{balanceHeader}</span>,
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
      header: extraHeader,
      cell: ({ row }) => row.original.extraLabel ?? '—'
    });
  }
  return cols;
}

export function ClientAccountsTable({
  rows,
  balanceHeader,
  extraHeader
}: {
  rows: ClientAccountRow[];
  balanceHeader?: string;
  extraHeader?: string;
}) {
  const includeExtra = rows.some((r) => r.extraLabel) || extraHeader != null;
  const columns = useMemo(
    () => buildColumns(includeExtra, balanceHeader, extraHeader),
    [includeExtra, balanceHeader, extraHeader]
  );

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel()
  });

  return (
    <DataTable
      table={table}
      stickyHeader={false}
    />
  );
}
