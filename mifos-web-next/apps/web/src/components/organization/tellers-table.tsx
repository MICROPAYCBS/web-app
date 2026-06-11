'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { OrganizationTellerListItem } from '@mifos/api-client';
import {
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
  type PaginationState
} from '@tanstack/react-table';
import { Circle, Users } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { DataTable } from '@/components/composites/data-table/data-table';
import { DataTablePagination } from '@/components/composites/data-table/data-table-pagination';
import { buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatFineractDateArray } from '@/lib/fineract/dates';
import { formatTellerStatus, isTellerActive } from '@/lib/fineract/teller-display';
import { tellerCashiersPath, tellerDetailPath } from '@/lib/fineract/teller-paths';
import { cn } from '@/lib/utils';

export function TellersTable({ tellers }: { tellers: OrganizationTellerListItem[] }) {
  const [filter, setFilter] = useState('');
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25
  });

  const filteredRows = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) {
      return tellers;
    }
    return tellers.filter((row) => {
      const haystack = [row.name, row.officeName, row.status, formatTellerStatus(row.status)]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [tellers, filter]);

  const columns = useMemo<ColumnDef<OrganizationTellerListItem>[]>(
    () => [
      {
        accessorKey: 'officeName',
        header: 'Branch',
        cell: ({ row }) => row.original.officeName ?? '—'
      },
      {
        accessorKey: 'name',
        header: 'Teller name',
        cell: ({ row }) => (
          <Link
            href={tellerDetailPath(row.original.id)}
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            {row.original.name}
          </Link>
        )
      },
      {
        id: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const active = isTellerActive(row.original.status);
          return (
            <span className="inline-flex items-center gap-2">
              <Circle
                className={cn('size-3 fill-current', active ? 'text-primary' : 'text-muted-foreground')}
                aria-hidden
              />
              <span className="sr-only">{formatTellerStatus(row.original.status)}</span>
            </span>
          );
        }
      },
      {
        id: 'startDate',
        header: 'Started on',
        cell: ({ row }) => formatFineractDateArray(row.original.startDate) ?? '—'
      },
      {
        id: 'actions',
        header: 'Actions',
        meta: { sticky: 'right' },
        cell: ({ row }) => (
          <Link
            href={tellerCashiersPath(row.original.id)}
            className={cn(buttonVariants({ variant: 'ghost', size: 'icon-sm' }))}
            aria-label={`View cashiers for ${row.original.name}`}
          >
            <Users className="size-4" />
          </Link>
        )
      }
    ],
    []
  );

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
      <Input
        placeholder="Filter tellers…"
        value={filter}
        onChange={(event) => {
          setFilter(event.target.value);
          setPagination((prev) => ({ ...prev, pageIndex: 0 }));
        }}
        className="max-w-sm"
        aria-label="Filter tellers"
      />
      <DataTable
        table={table}
        stickyHeader={false}
        emptyMessage="No tellers found"
        emptyDescription="Create a teller to manage branch cashier windows."
      />
      <DataTablePagination table={table} totalRecords={filteredRows.length} />
    </div>
  );
}
