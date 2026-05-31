'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractClientSummary, FineractClientsPage } from '@mifos/api-client';
import {
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type PaginationState
} from '@tanstack/react-table';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { DataTable } from '@/components/composites/data-table/data-table';
import { DataTablePagination } from '@/components/composites/data-table/data-table-pagination';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { clientDisplayName } from '@/lib/fineract/clients-display';

function statusVariant(code?: string): 'default' | 'secondary' | 'outline' | 'destructive' {
  if (!code) {
    return 'secondary';
  }
  if (code.includes('active')) {
    return 'default';
  }
  if (code.includes('closed') || code.includes('reject')) {
    return 'destructive';
  }
  return 'outline';
}

const columns: ColumnDef<FineractClientSummary>[] = [
  {
    accessorKey: 'accountNo',
    header: 'Account no.',
    cell: ({ row }) => (
      <Link
        href={`/clients/${row.original.id}`}
        className="font-medium text-primary underline-offset-4 hover:underline"
      >
        {row.original.accountNo}
      </Link>
    )
  },
  {
    id: 'displayName',
    header: 'Name',
    cell: ({ row }) => clientDisplayName(row.original)
  },
  {
    accessorKey: 'officeName',
    header: 'Office',
    cell: ({ row }) => row.original.officeName ?? '—'
  },
  {
    id: 'status',
    header: 'Status',
    cell: ({ row }) => (
      <Badge variant={statusVariant(row.original.status?.code)}>
        {row.original.status?.value ?? '—'}
      </Badge>
    )
  },
  {
    accessorKey: 'externalId',
    header: 'External ID',
    cell: ({ row }) => row.original.externalId ?? '—'
  }
];

export function ClientsTable({
  initialPage,
  initialPageSize = 25
}: {
  initialPage: FineractClientsPage;
  initialPageSize?: number;
}) {
  const [data, setData] = useState(initialPage);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: initialPageSize
  });
  const [filter, setFilter] = useState('');
  const [pending, startTransition] = useTransition();
  const skipInitialFetch = useRef(true);

  const pageCount = Math.max(1, Math.ceil(data.totalFilteredRecords / pagination.pageSize));

  const fetchPage = useCallback((next: PaginationState) => {
    startTransition(async () => {
      const offset = next.pageIndex * next.pageSize;
      const res = await fetch(
        `/api/clients?offset=${offset}&limit=${next.pageSize}&orderBy=id&sortOrder=DESC`,
        { credentials: 'include' }
      );
      if (!res.ok) {
        return;
      }
      const json = (await res.json()) as FineractClientsPage;
      setData(json);
    });
  }, []);

  useEffect(() => {
    if (skipInitialFetch.current) {
      skipInitialFetch.current = false;
      return;
    }
    fetchPage(pagination);
  }, [pagination, fetchPage]);

  const filteredRows = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) {
      return data.pageItems;
    }
    return data.pageItems.filter((row) => {
      const haystack = [
        row.accountNo,
        clientDisplayName(row),
        row.officeName,
        row.externalId,
        row.status?.value
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [data.pageItems, filter]);

  const table = useReactTable({
    data: filteredRows,
    columns,
    pageCount,
    state: { pagination },
    onPaginationChange: (updater) => {
      setPagination((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater;
        return next;
      });
    },
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true
  });

  return (
    <div className="space-y-4">
      <Input
        placeholder="Filter current page…"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="max-w-sm"
        aria-label="Filter clients on this page"
      />
      <DataTable table={table} isLoading={pending} emptyMessage="No clients found"
        emptyDescription="Try adjusting search or filters, or create a new client." />
      <DataTablePagination table={table} totalRecords={data.totalFilteredRecords} />
    </div>
  );
}
