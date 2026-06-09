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
import { ArrowDown, ArrowUp, ArrowUpDown, Search } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { DataTable } from '@/components/composites/data-table/data-table';
import { DataTablePagination } from '@/components/composites/data-table/data-table-pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  buildClientsListApiQuery,
  CLIENTS_LIST_DEBOUNCE_MS,
  clientListSortField,
  type ClientListSortColumn,
  type ClientListSortOrder
} from '@/lib/fineract/clients-list-query';
import { clientDisplayName } from '@/lib/fineract/clients-display';
import { cn } from '@/lib/utils';

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

function SortableHeader({
  label,
  column,
  activeColumn,
  sortOrder,
  onSort
}: {
  label: string;
  column: ClientListSortColumn;
  activeColumn?: ClientListSortColumn;
  sortOrder?: ClientListSortOrder;
  onSort: (column: ClientListSortColumn) => void;
}) {
  const isActive = activeColumn === column;
  const Icon = isActive
    ? sortOrder === 'ASC'
      ? ArrowUp
      : ArrowDown
    : ArrowUpDown;

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="-ml-3 h-8 gap-1 font-medium"
      onClick={() => onSort(column)}
    >
      {label}
      <Icon className="size-3.5 opacity-60" aria-hidden />
    </Button>
  );
}

export function ClientsTable({
  initialPage,
  initialPageSize = 25,
  initialQuery = '',
  initialIncludeClosed = false,
  initialSortColumn = 'id',
  initialSortOrder = 'DESC'
}: {
  initialPage: FineractClientsPage;
  initialPageSize?: number;
  initialQuery?: string;
  initialIncludeClosed?: boolean;
  initialSortColumn?: ClientListSortColumn;
  initialSortOrder?: ClientListSortOrder;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [data, setData] = useState(initialPage);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: Number(searchParams.get('page') ?? '0') || 0,
    pageSize: initialPageSize
  });
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [includeClosed, setIncludeClosed] = useState(initialIncludeClosed);
  const [sortColumn, setSortColumn] = useState<ClientListSortColumn>(initialSortColumn);
  const [sortOrder, setSortOrder] = useState<ClientListSortOrder>(initialSortOrder);
  const [pending, startTransition] = useTransition();
  const skipInitialFetch = useRef(true);
  const filterKey = `${debouncedQuery}|${includeClosed}|${sortColumn}|${sortOrder}`;
  const prevFilterKey = useRef(filterKey);

  const handleSort = useCallback((column: ClientListSortColumn) => {
    if (sortColumn === column) {
      setSortOrder((prev) => (prev === 'ASC' ? 'DESC' : 'ASC'));
      return;
    }
    setSortColumn(column);
    setSortOrder('ASC');
  }, [sortColumn]);

  const syncUrl = useCallback(
    (next: {
      query: string;
      includeClosed: boolean;
      sortColumn: ClientListSortColumn;
      sortOrder: ClientListSortOrder;
      pageIndex: number;
      pageSize: number;
    }) => {
      const apiQuery = buildClientsListApiQuery({
        offset: next.pageIndex * next.pageSize,
        limit: next.pageSize,
        query: next.query,
        includeClosed: next.includeClosed,
        orderBy: clientListSortField(next.sortColumn),
        sortOrder: next.sortOrder
      });
      const params = new URLSearchParams(apiQuery);
      if (next.pageIndex > 0) {
        params.set('page', String(next.pageIndex));
      }
      const qs = params.toString();
      router.replace(qs ? `/clients?${qs}` : '/clients', { scroll: false });
    },
    [router]
  );

  const fetchPage = useCallback(
    (next: {
      pagination: PaginationState;
      query: string;
      includeClosed: boolean;
      sortColumn: ClientListSortColumn;
      sortOrder: ClientListSortOrder;
    }) => {
      startTransition(async () => {
        const offset = next.pagination.pageIndex * next.pagination.pageSize;
        const apiQuery = buildClientsListApiQuery({
          offset,
          limit: next.pagination.pageSize,
          query: next.query,
          includeClosed: next.includeClosed,
          orderBy: clientListSortField(next.sortColumn),
          sortOrder: next.sortOrder
        });
        const res = await fetch(`/api/clients?${apiQuery}`, { credentials: 'include' });
        if (!res.ok) {
          return;
        }
        const json = (await res.json()) as FineractClientsPage;
        setData(json);
        syncUrl({
          query: next.query,
          includeClosed: next.includeClosed,
          sortColumn: next.sortColumn,
          sortOrder: next.sortOrder,
          pageIndex: next.pagination.pageIndex,
          pageSize: next.pagination.pageSize
        });
      });
    },
    [syncUrl]
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(query);
    }, CLIENTS_LIST_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (prevFilterKey.current !== filterKey) {
      prevFilterKey.current = filterKey;
      setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    }
  }, [filterKey]);

  useEffect(() => {
    if (skipInitialFetch.current) {
      skipInitialFetch.current = false;
      return;
    }
    fetchPage({ pagination, query: debouncedQuery, includeClosed, sortColumn, sortOrder });
  }, [pagination, debouncedQuery, includeClosed, sortColumn, sortOrder, fetchPage]);

  const columns = useMemo<ColumnDef<FineractClientSummary>[]>(
    () => [
      {
        accessorKey: 'accountNo',
        header: () => (
          <SortableHeader
            label="Account no."
            column="accountNo"
            activeColumn={sortColumn}
            sortOrder={sortOrder}
            onSort={handleSort}
          />
        ),
        cell: ({ row }) => (
          <Link
            href={`/clients/${row.original.id}/general`}
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            {row.original.accountNo}
          </Link>
        )
      },
      {
        id: 'displayName',
        header: () => (
          <SortableHeader
            label="Name"
            column="displayName"
            activeColumn={sortColumn}
            sortOrder={sortOrder}
            onSort={handleSort}
          />
        ),
        cell: ({ row }) => (
          <Link
            href={`/clients/${row.original.id}/general`}
            className="text-primary underline-offset-4 hover:underline"
          >
            {clientDisplayName(row.original)}
          </Link>
        )
      },
      {
        accessorKey: 'officeName',
        header: () => (
          <SortableHeader
            label="Branch"
            column="officeName"
            activeColumn={sortColumn}
            sortOrder={sortOrder}
            onSort={handleSort}
          />
        ),
        cell: ({ row }) => row.original.officeName ?? '—'
      },
      {
        id: 'status',
        header: () => (
          <SortableHeader
            label="Status"
            column="status"
            activeColumn={sortColumn}
            sortOrder={sortOrder}
            onSort={handleSort}
          />
        ),
        cell: ({ row }) => (
          <Badge variant={statusVariant(row.original.status?.code)}>
            {row.original.status?.value ?? '—'}
          </Badge>
        )
      },
      {
        accessorKey: 'externalId',
        header: () => (
          <SortableHeader
            label="External ID"
            column="externalId"
            activeColumn={sortColumn}
            sortOrder={sortOrder}
            onSort={handleSort}
          />
        ),
        cell: ({ row }) => row.original.externalId ?? '—'
      }
    ],
    [sortColumn, sortOrder, handleSort]
  );

  const pageCount = Math.max(1, Math.ceil(data.totalFilteredRecords / pagination.pageSize));

  const table = useReactTable({
    data: data.pageItems,
    columns,
    pageCount,
    state: { pagination },
    onPaginationChange: (updater) => {
      setPagination((prev) => (typeof updater === 'function' ? updater(prev) : updater));
    },
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="relative min-w-0 flex-1 sm:max-w-md">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            placeholder="Search clients…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setDebouncedQuery(query.trim());
              }
            }}
            className="pl-9"
            aria-label="Search clients"
          />
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="clients-show-closed"
            checked={includeClosed}
            onCheckedChange={(checked) => setIncludeClosed(checked === true)}
          />
          <Label htmlFor="clients-show-closed" className="cursor-pointer text-sm font-normal">
            Show closed clients
          </Label>
        </div>
      </div>
      <p className={cn('text-xs text-muted-foreground', pending && 'opacity-70')}>
        {debouncedQuery.trim()
          ? 'Searching all clients on the server.'
          : includeClosed
            ? 'Showing all client statuses.'
            : 'Hiding closed, rejected, and withdrawn clients.'}
      </p>
      <DataTable
        table={table}
        isLoading={pending}
        emptyMessage="No clients found"
        emptyDescription="Try a different search or include closed clients."
      />
      <DataTablePagination table={table} totalRecords={data.totalFilteredRecords} />
    </div>
  );
}
