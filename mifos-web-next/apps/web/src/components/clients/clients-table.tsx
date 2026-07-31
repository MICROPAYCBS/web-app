'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractClientSummary } from '@mifos/api-client';
import { formatUgandaPhonePresentation } from '@mifos/validation';
import {
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type PaginationState,
  type SortingState
} from '@tanstack/react-table';
import { ArrowDown, ArrowUp, ArrowUpDown, Search } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { DataTable } from '@/components/composites/data-table/data-table';
import { DataTablePagination } from '@/components/composites/data-table/data-table-pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { clientDisplayName } from '@/lib/fineract/clients-display';
import {
  filterClientsForTable,
  type ClientListFilters
} from '@/lib/fineract/clients-table-filter';

function statusVariant(code?: string): 'default' | 'secondary' | 'outline' | 'destructive' {
  if (!code) {
    return 'secondary';
  }
  if (code.includes('draft') || code.includes('incomplete')) {
    return 'secondary';
  }
  if (code.includes('pending')) {
    return 'outline';
  }
  if (code.includes('active')) {
    return 'default';
  }
  if (code.includes('closed') || code.includes('reject')) {
    return 'destructive';
  }
  return 'outline';
}

function SortableColumnHeader({
  label,
  sorted,
  onToggle
}: {
  label: string;
  sorted: false | 'asc' | 'desc';
  onToggle: () => void;
}) {
  const Icon = sorted === 'asc' ? ArrowUp : sorted === 'desc' ? ArrowDown : ArrowUpDown;

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="-ml-3 h-8 gap-1 font-medium"
      onClick={onToggle}
    >
      {label}
      <Icon className="size-3.5 opacity-60" aria-hidden />
    </Button>
  );
}

export function ClientsTable({
  clients,
  appliedFilters,
  truncated = false,
  totalRecords,
  filterTrigger
}: {
  clients: FineractClientSummary[];
  appliedFilters: ClientListFilters;
  truncated?: boolean;
  totalRecords?: number;
  filterTrigger?: ReactNode;
}) {
  const [search, setSearch] = useState('');
  const [sorting, setSorting] = useState<SortingState>([{ id: 'accountNo', desc: false }]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25
  });

  const filteredClients = useMemo(
    () => filterClientsForTable(clients, search, appliedFilters),
    [clients, search, appliedFilters]
  );

  useEffect(() => {
    setPagination((current) => ({ ...current, pageIndex: 0 }));
  }, [appliedFilters, search]);

  const columns = useMemo<ColumnDef<FineractClientSummary>[]>(
    () => [
      {
        id: 'accountNo',
        accessorKey: 'accountNo',
        header: ({ column }) => (
          <SortableColumnHeader
            label="Customer number"
            sorted={column.getIsSorted()}
            onToggle={() => column.toggleSorting()}
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
        accessorFn: (row) => clientDisplayName(row),
        header: ({ column }) => (
          <SortableColumnHeader
            label="Name"
            sorted={column.getIsSorted()}
            onToggle={() => column.toggleSorting()}
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
        id: 'officeName',
        accessorKey: 'officeName',
        enableSorting: false,
        header: 'Branch',
        cell: ({ row }) => row.original.officeName ?? '—'
      },
      {
        id: 'status',
        accessorFn: (row) => row.status?.value ?? '',
        enableSorting: false,
        header: 'Status',
        cell: ({ row }) => (
          <Badge variant={statusVariant(row.original.status?.code)}>
            {row.original.status?.value ?? '—'}
          </Badge>
        )
      },
      {
        id: 'mobileNo',
        accessorKey: 'mobileNo',
        enableSorting: false,
        header: 'Phone',
        cell: ({ row }) => formatUgandaPhonePresentation(row.original.mobileNo) || '—'
      },
      {
        id: 'emailAddress',
        accessorKey: 'emailAddress',
        enableSorting: false,
        header: 'Email',
        cell: ({ row }) => (
          <span className="break-all">{row.original.emailAddress?.trim() || '—'}</span>
        )
      },
      {
        id: 'externalId',
        accessorKey: 'externalId',
        header: ({ column }) => (
          <SortableColumnHeader
            label="External ID"
            sorted={column.getIsSorted()}
            onToggle={() => column.toggleSorting()}
          />
        ),
        cell: ({ row }) => row.original.externalId ?? '—'
      }
    ],
    []
  );

  const table = useReactTable({
    data: filteredClients,
    columns,
    state: { sorting, pagination },
    onSortingChange: setSorting,
    onPaginationChange: (updater) => {
      setPagination((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater;
        return next;
      });
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    autoResetPageIndex: true
  });

  const loadedCount = clients.length;
  const serverTotal = totalRecords ?? loadedCount;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="relative min-w-0 max-w-md flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            placeholder="Search name, customer number, phone, email…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-9"
            aria-label="Search customers"
          />
        </div>
        {filterTrigger ? (
          <div className="flex flex-wrap items-center justify-end gap-2">{filterTrigger}</div>
        ) : null}
      </div>

      <p className="text-xs text-muted-foreground">
        {truncated
          ? `Showing the first ${loadedCount.toLocaleString()} of ${serverTotal.toLocaleString()} customers. Narrow branch or status filters to refine results.`
          : `Searching ${loadedCount.toLocaleString()} customer${loadedCount === 1 ? '' : 's'} on this page.`}
        {filteredClients.length !== loadedCount
          ? ` ${filteredClients.length.toLocaleString()} match your filters.`
          : null}
      </p>

      <DataTable
        table={table}
        emptyMessage="No customers found"
        emptyDescription="Try a different search or adjust branch and status filters."
      />
      <DataTablePagination table={table} totalRecords={filteredClients.length} />
    </div>
  );
}
