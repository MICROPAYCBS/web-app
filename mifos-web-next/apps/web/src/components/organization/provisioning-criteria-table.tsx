'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { ProvisioningCriteriaListItem } from '@mifos/api-client';
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
import { provisioningCriteriaDetailPath } from '@/lib/fineract/provisioning-criteria-paths';

export function ProvisioningCriteriaTable({
  criteria
}: {
  criteria: ProvisioningCriteriaListItem[];
}) {
  const [filter, setFilter] = useState('');
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25
  });

  const filteredRows = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) {
      return criteria;
    }
    return criteria.filter((row) => {
      const haystack = [row.criteriaName, row.createdBy].filter(Boolean).join(' ').toLowerCase();
      return haystack.includes(q);
    });
  }, [criteria, filter]);

  const columns = useMemo<ColumnDef<ProvisioningCriteriaListItem>[]>(
    () => [
      {
        id: 'criteriaName',
        header: 'Name',
        cell: ({ row }) => (
          <Link
            href={provisioningCriteriaDetailPath(row.original.criteriaId)}
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            {row.original.criteriaName}
          </Link>
        )
      },
      {
        accessorKey: 'createdBy',
        header: 'Created by',
        cell: ({ row }) => row.original.createdBy ?? '—'
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
        placeholder="Filter provisioning criteria…"
        value={filter}
        onChange={(event) => {
          setFilter(event.target.value);
          setPagination((prev) => ({ ...prev, pageIndex: 0 }));
        }}
        className="max-w-sm"
        aria-label="Filter provisioning criteria"
      />
      <DataTable
        table={table}
        emptyMessage="No provisioning criteria found"
        emptyDescription="Create provisioning criteria to define loan loss reserve rules."
      />
      <DataTablePagination table={table} totalRecords={filteredRows.length} />
    </div>
  );
}
