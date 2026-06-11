'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractUserListItem } from '@mifos/api-client';
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
  type PaginationState
} from '@tanstack/react-table';
import { Pencil } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { DataTable } from '@/components/composites/data-table/data-table';
import { DataTablePagination } from '@/components/composites/data-table/data-table-pagination';
import { buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { yesNoLabel } from '@/lib/fineract/user-display';
import { cn } from '@/lib/utils';

export function UsersTable({
  users,
  canUpdate
}: {
  users: FineractUserListItem[];
  canUpdate: boolean;
}) {
  const [filter, setFilter] = useState('');
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25
  });

  const columns = useMemo<ColumnDef<FineractUserListItem>[]>(
    () => [
      {
        accessorKey: 'username',
        header: 'Login name',
        cell: ({ row }) => (
          <Link
            href={`/appusers/${row.original.id}`}
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            {row.original.username}
          </Link>
        )
      },
      {
        accessorKey: 'firstname',
        header: 'First name'
      },
      {
        accessorKey: 'lastname',
        header: 'Last name'
      },
      {
        accessorKey: 'email',
        header: 'Email',
        cell: ({ row }) => row.original.email || '—'
      },
      {
        accessorKey: 'officeName',
        header: 'Office',
        cell: ({ row }) => row.original.officeName || '—'
      },
      {
        accessorKey: 'isSelfServiceUser',
        header: 'Self service',
        cell: ({ row }) => (
          <span className="text-muted-foreground">{yesNoLabel(row.original.isSelfServiceUser)}</span>
        )
      },
      {
        id: 'actions',
        header: 'Actions',
        meta: { sticky: 'right' },
        cell: ({ row }) =>
          canUpdate ? (
            <Link
              href={`/appusers/${row.original.id}/edit`}
              className={cn(buttonVariants({ variant: 'ghost', size: 'icon-sm' }))}
              aria-label={`Edit ${row.original.username}`}
              onClick={(event) => event.stopPropagation()}
            >
              <Pencil className="size-4" />
            </Link>
          ) : null
      }
    ],
    [canUpdate]
  );

  const table = useReactTable({
    data: users,
    columns,
    state: {
      pagination,
      globalFilter: filter
    },
    onPaginationChange: setPagination,
    onGlobalFilterChange: setFilter,
    globalFilterFn: (row, _columnId, filterValue) => {
      const query = String(filterValue).trim().toLowerCase();
      if (!query) {
        return true;
      }
      const user = row.original;
      return (
        user.username.toLowerCase().includes(query) ||
        user.firstname.toLowerCase().includes(query) ||
        user.lastname.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.officeName.toLowerCase().includes(query)
      );
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  });

  return (
    <div className="space-y-4">
      <Input
        placeholder="Filter users…"
        value={filter}
        onChange={(event) => {
          setFilter(event.target.value);
          setPagination((current) => ({ ...current, pageIndex: 0 }));
        }}
        className="max-w-sm"
        aria-label="Filter users"
      />
      <DataTable
        table={table}
        stickyHeader={false}
        emptyMessage="No users found"
        emptyDescription="Create a user to grant access to the application."
      />
      <DataTablePagination table={table} totalRecords={table.getFilteredRowModel().rows.length} />
    </div>
  );
}
