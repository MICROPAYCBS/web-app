'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractOfficeListItem } from '@mifos/api-client';
import {
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
  type PaginationState
} from '@tanstack/react-table';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { DataTable } from '@/components/composites/data-table/data-table';
import { DataTablePagination } from '@/components/composites/data-table/data-table-pagination';
import { Input } from '@/components/ui/input';
import { branchCodeLabel } from '@/lib/fineract/branch-profile-form';
import { branchDisplayName } from '@/lib/fineract/office-display';
import { formatFineractDateArray } from '@/lib/fineract/dates';

export function BranchesTable({ offices }: { offices: FineractOfficeListItem[] }) {
  const [filter, setFilter] = useState('');
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25
  });

  const filteredRows = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) {
      return offices;
    }
    return offices.filter((row) => {
      const profile = row.branchProfile;
      const haystack = [
        row.name,
        row.nameDecorated,
        profile?.officeCode,
        profile?.branchType,
        profile?.city,
        profile?.status,
        row.parentName,
        row.externalId
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [offices, filter]);

  const columns = useMemo<ColumnDef<FineractOfficeListItem>[]>(
    () => [
      {
        id: 'name',
        header: 'Branch name',
        cell: ({ row }) => (
          <Link
            href={`/organization/offices/${row.original.id}`}
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            {branchDisplayName(row.original)}
          </Link>
        )
      },
      {
        id: 'officeCode',
        header: 'Code',
        cell: ({ row }) => (
          <span className="font-mono text-sm">{branchCodeLabel(row.original) ?? '—'}</span>
        )
      },
      {
        id: 'branchType',
        header: 'Type',
        cell: ({ row }) => row.original.branchProfile?.branchType ?? '—'
      },
      {
        id: 'city',
        header: 'City',
        cell: ({ row }) => row.original.branchProfile?.city ?? '—'
      },
      {
        accessorKey: 'parentName',
        header: 'Parent branch',
        cell: ({ row }) => row.original.parentName ?? '—'
      },
      {
        id: 'openingDate',
        header: 'Opening date',
        cell: ({ row }) => formatFineractDateArray(row.original.openingDate) ?? '—'
      },
      {
        id: 'status',
        header: 'Status',
        cell: ({ row }) => row.original.branchProfile?.status ?? '—'
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
        placeholder="Filter branches by name, code, city, type…"
        value={filter}
        onChange={(event) => {
          setFilter(event.target.value);
          setPagination((prev) => ({ ...prev, pageIndex: 0 }));
        }}
        className="max-w-sm"
        aria-label="Filter branches"
      />
      <DataTable
        table={table}
        emptyMessage="No branches found"
        emptyDescription="Create a branch to organize your institution hierarchy."
      />
      <DataTablePagination table={table} totalRecords={filteredRows.length} />
    </div>
  );
}
