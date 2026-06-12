'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { CenterListItem, CentersPage } from '@mifos/api-client';
import {
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type PaginationState
} from '@tanstack/react-table';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { DataTable } from '@/components/composites/data-table/data-table';
import { DataTablePagination } from '@/components/composites/data-table/data-table-pagination';
import { TextField } from '@/components/composites/text-field';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { centerStatusVariant } from '@/lib/fineract/center-display';
import { centerGeneralPath } from '@/lib/fineract/center-paths';
import {
  buildCentersListApiQuery,
  centerListSortColumnFromField,
  centerListSortField,
  type CenterListSortColumn,
  type CenterListSortOrder,
  type CentersListQuery
} from '@/lib/fineract/centers-list-query';

const DEBOUNCE_MS = 400;

function SortableHeader({
  label,
  column,
  activeColumn,
  sortOrder,
  onSort
}: {
  label: string;
  column: CenterListSortColumn;
  activeColumn?: CenterListSortColumn;
  sortOrder?: CenterListSortOrder;
  onSort: (column: CenterListSortColumn) => void;
}) {
  const isActive = activeColumn === column;
  const Icon = isActive ? (sortOrder === 'ASC' ? ArrowUp : ArrowDown) : ArrowUpDown;

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

export function CentersTable({
  initialPage,
  initialQuery
}: {
  initialPage: CentersPage;
  initialQuery: CentersListQuery;
}) {
  const router = useRouter();
  const [data, setData] = useState(initialPage);
  const [name, setName] = useState(initialQuery.name ?? '');
  const [externalId, setExternalId] = useState(initialQuery.externalId ?? '');
  const [debouncedName, setDebouncedName] = useState(initialQuery.name ?? '');
  const [debouncedExternalId, setDebouncedExternalId] = useState(initialQuery.externalId ?? '');
  const [includeClosed, setIncludeClosed] = useState(initialQuery.includeClosed);
  const [sortColumn, setSortColumn] = useState<CenterListSortColumn | undefined>(
    initialQuery.orderBy ? centerListSortColumnFromField(initialQuery.orderBy) : undefined
  );
  const [sortOrder, setSortOrder] = useState<CenterListSortOrder | undefined>(
    initialQuery.sortOrder
  );
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: Math.floor(initialQuery.offset / initialQuery.limit),
    pageSize: initialQuery.limit
  });
  const [pending, startTransition] = useTransition();
  const skipInitialFetch = useRef(true);
  const filterKey = `${debouncedName}|${debouncedExternalId}|${includeClosed}|${sortColumn ?? ''}|${sortOrder ?? ''}`;
  const prevFilterKey = useRef(filterKey);

  const syncUrl = useCallback(
    (query: CentersListQuery) => {
      const params = new URLSearchParams(buildCentersListApiQuery(query));
      const page = Math.floor(query.offset / query.limit);
      if (page > 0) {
        params.set('page', String(page));
      }
      if (query.includeClosed) {
        params.set('includeClosed', 'true');
      }
      const qs = params.toString();
      router.replace(qs ? `/centers?${qs}` : '/centers', { scroll: false });
    },
    [router]
  );

  const fetchPage = useCallback(
    (query: CentersListQuery) => {
      startTransition(async () => {
        const res = await fetch(
          `/api/centers?${new URLSearchParams(buildCentersListApiQuery(query)).toString()}`,
          {
            credentials: 'include'
          }
        );
        if (!res.ok) {
          return;
        }
        const json = (await res.json()) as CentersPage;
        setData(json);
        syncUrl(query);
      });
    },
    [syncUrl]
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedName(name);
      setDebouncedExternalId(externalId);
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [name, externalId]);

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
    fetchPage({
      offset: pagination.pageIndex * pagination.pageSize,
      limit: pagination.pageSize,
      name: debouncedName || undefined,
      externalId: debouncedExternalId || undefined,
      includeClosed,
      orderBy: sortColumn ? centerListSortField(sortColumn) : undefined,
      sortOrder
    });
  }, [
    pagination,
    debouncedName,
    debouncedExternalId,
    includeClosed,
    sortColumn,
    sortOrder,
    fetchPage
  ]);

  const handleSort = useCallback(
    (column: CenterListSortColumn) => {
      if (sortColumn === column) {
        setSortOrder((prev) => (prev === 'ASC' ? 'DESC' : 'ASC'));
        return;
      }
      setSortColumn(column);
      setSortOrder('ASC');
    },
    [sortColumn]
  );

  const columns = useMemo<ColumnDef<CenterListItem>[]>(
    () => [
      {
        accessorKey: 'name',
        header: () => (
          <SortableHeader
            label="Name"
            column="name"
            activeColumn={sortColumn}
            sortOrder={sortOrder}
            onSort={handleSort}
          />
        ),
        cell: ({ row }) => (
          <Link
            href={centerGeneralPath(row.original.id)}
            className="font-medium text-primary hover:underline"
          >
            {row.original.name}
          </Link>
        )
      },
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
        cell: ({ row }) => row.original.accountNo ?? '—'
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
          <Badge variant={centerStatusVariant(row.original.status?.code)}>
            {row.original.status?.value ?? '—'}
          </Badge>
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
      }
    ],
    [handleSort, sortColumn, sortOrder]
  );

  const table = useReactTable({
    data: data.pageItems,
    columns,
    state: { pagination },
    onPaginationChange: setPagination,
    manualPagination: true,
    pageCount: Math.max(1, Math.ceil(data.totalFilteredRecords / pagination.pageSize)),
    getCoreRowModel: getCoreRowModel()
  });

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <TextField
          id="centers-name-filter"
          label="Name"
          value={name}
          onChange={setName}
          disabled={pending}
        />
        <TextField
          id="centers-external-id-filter"
          label="External ID"
          value={externalId}
          onChange={setExternalId}
          disabled={pending}
        />
      </div>
      <div className="flex items-center gap-2">
        <Checkbox
          id="centers-include-closed"
          checked={includeClosed}
          onCheckedChange={(value) => setIncludeClosed(value === true)}
        />
        <Label htmlFor="centers-include-closed" className="text-sm font-normal">
          Show closed centers
        </Label>
      </div>
      <DataTable
        table={table}
        isLoading={pending}
        emptyMessage="No centers found"
        emptyDescription="Try adjusting your filters or create a new center."
      />
      <DataTablePagination table={table} totalRecords={data.totalFilteredRecords} />
    </div>
  );
}
