'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractStaffListItem } from '@mifos/api-client';
import {
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
  type PaginationState
} from '@tanstack/react-table';
import { CircleCheck, CircleX } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { DataTable } from '@/components/composites/data-table/data-table';
import { DataTablePagination } from '@/components/composites/data-table/data-table-pagination';
import { Input } from '@/components/ui/input';

function staffDisplayName(staff: FineractStaffListItem): string {
  return [staff.firstname, staff.lastname].filter(Boolean).join(' ').trim() || `#${staff.id}`;
}

export function EmployeesTable({ staff }: { staff: FineractStaffListItem[] }) {
  const [filter, setFilter] = useState('');
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25
  });

  const filteredRows = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) {
      return staff;
    }
    return staff.filter((row) => {
      const haystack = [
        row.firstname,
        row.lastname,
        staffDisplayName(row),
        row.officeName
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [staff, filter]);

  const columns = useMemo<ColumnDef<FineractStaffListItem>[]>(
    () => [
      {
        id: 'firstname',
        header: 'First name',
        cell: ({ row }) => (
          <Link
            href={`/organization/employees/${row.original.id}`}
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            {row.original.firstname ?? '—'}
          </Link>
        )
      },
      {
        accessorKey: 'lastname',
        header: 'Last name',
        cell: ({ row }) => row.original.lastname ?? '—'
      },
      {
        id: 'isLoanOfficer',
        header: 'Loan officer',
        cell: ({ row }) =>
          row.original.isLoanOfficer ? (
            <CircleCheck className="size-5 text-primary" aria-label="Yes" />
          ) : (
            <CircleX className="size-5 text-muted-foreground" aria-label="No" />
          )
      },
      {
        accessorKey: 'officeName',
        header: 'Branch',
        cell: ({ row }) => row.original.officeName ?? '—'
      },
      {
        id: 'isActive',
        header: 'Status',
        cell: ({ row }) => (
          <span className={row.original.isActive ? 'text-primary' : 'text-muted-foreground'}>
            {row.original.isActive ? 'Active' : 'Inactive'}
          </span>
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
        placeholder="Filter employees…"
        value={filter}
        onChange={(event) => {
          setFilter(event.target.value);
          setPagination((prev) => ({ ...prev, pageIndex: 0 }));
        }}
        className="max-w-sm"
        aria-label="Filter employees"
      />
      <DataTable
        table={table}
        emptyMessage="No employees found"
        emptyDescription="Create an employee to assign as a relationship officer on clients."
      />
      <DataTablePagination table={table} totalRecords={filteredRows.length} />
    </div>
  );
}
