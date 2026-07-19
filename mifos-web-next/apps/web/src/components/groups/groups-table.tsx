'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { GroupListItem, GroupsPage } from '@mifos/api-client';
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
import { groupStatusVariant } from '@/lib/fineract/group-display';
import { groupGeneralPath } from '@/lib/fineract/group-paths';
import {
  buildGroupsListApiQuery,
  groupListSortColumnFromField,
  groupListSortField,
  type GroupListSortColumn,
  type GroupListSortOrder,
  type GroupsListQuery
} from '@/lib/fineract/groups-list-query';

const DEBOUNCE_MS = 400;

function SortableHeader({
  label,
  column,
  activeColumn,
  sortOrder,
  onSort
}: {
  label: string;
  column: GroupListSortColumn;
  activeColumn?: GroupListSortColumn;
  sortOrder?: GroupListSortOrder;
  onSort: (column: GroupListSortColumn) => void;
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

export function GroupsTable({
  initialPage,
  initialQuery
}: {
  initialPage: GroupsPage;
  initialQuery: GroupsListQuery;
}) {
  const router = useRouter();
  const [data, setData] = useState(initialPage);
  const [name, setName] = useState(initialQuery.name ?? '');
  const [externalId, setExternalId] = useState(initialQuery.externalId ?? '');
  const [debouncedName, setDebouncedName] = useState(initialQuery.name ?? '');
  const [debouncedExternalId, setDebouncedExternalId] = useState(initialQuery.externalId ?? '');
  const [includeClosed, setIncludeClosed] = useState(initialQuery.includeClosed);
  const [sortColumn, setSortColumn] = useState<GroupListSortColumn | undefined>(
    initialQuery.orderBy ? groupListSortColumnFromField(initialQuery.orderBy) : undefined
  );
  const [sortOrder, setSortOrder] = useState<GroupListSortOrder | undefined>(initialQuery.sortOrder);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: Math.floor(initialQuery.offset / initialQuery.limit),
    pageSize: initialQuery.limit
  });
  const [pending, startTransition] = useTransition();
  const skipInitialFetch = useRef(true);
  const filterKey = `${debouncedName}|${debouncedExternalId}|${includeClosed}|${sortColumn ?? ''}|${sortOrder ?? ''}`;
  const prevFilterKey = useRef(filterKey);

  const syncUrl = useCallback(
    (query: GroupsListQuery) => {
      const params = new URLSearchParams(buildGroupsListApiQuery(query));
      const page = Math.floor(query.offset / query.limit);
      if (page > 0) {
        params.set('page', String(page));
      }
      if (query.includeClosed) {
        params.set('includeClosed', 'true');
      }
      const qs = params.toString();
      router.replace(qs ? `/groups?${qs}` : '/groups', { scroll: false });
    },
    [router]
  );

  const fetchPage = useCallback(
    (query: GroupsListQuery) => {
      startTransition(async () => {
        const res = await fetch(
          `/api/groups?${new URLSearchParams(buildGroupsListApiQuery(query)).toString()}`,
          { credentials: 'include' }
        );
        if (!res.ok) {
          return;
        }
        const json = (await res.json()) as GroupsPage;
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
      orderBy: sortColumn ? groupListSortField(sortColumn) : undefined,
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
    (column: GroupListSortColumn) => {
      if (sortColumn === column) {
        setSortOrder((prev) => (prev === 'ASC' ? 'DESC' : 'ASC'));
        return;
      }
      setSortColumn(column);
      setSortOrder('ASC');
    },
    [sortColumn]
  );

  const columns = useMemo<ColumnDef<GroupListItem>[]>(
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
            href={groupGeneralPath(row.original.id)}
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
          <Badge variant={groupStatusVariant(row.original.status?.code)}>
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
          id="groups-name-filter"
          label="Name"
          value={name}
          onChange={setName}
          disabled={pending}
        />
        <TextField
          id="groups-external-id-filter"
          label="External ID"
          value={externalId}
          onChange={setExternalId}
          disabled={pending}
        />
      </div>
      <div className="flex items-center gap-2">
        <Checkbox
          id="groups-include-closed"
          checked={includeClosed}
          onCheckedChange={(value) => setIncludeClosed(value === true)}
        />
        <Label htmlFor="groups-include-closed" className="text-sm font-normal">
          Show closed groups
        </Label>
      </div>
      <DataTable
        table={table}
        isLoading={pending}
        emptyMessage="No groups found"
        emptyDescription="Try adjusting your filters or create a new group."
      />
      <DataTablePagination table={table} totalRecords={data.totalFilteredRecords} />
    </div>
  );
}
