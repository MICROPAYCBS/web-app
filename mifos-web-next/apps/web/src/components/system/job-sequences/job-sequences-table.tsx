'use client';

/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractJobSequence } from '@mifos/api-client';
import {
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
  type PaginationState
} from '@tanstack/react-table';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { DataTable } from '@/components/composites/data-table/data-table';
import { DataTablePagination } from '@/components/composites/data-table/data-table-pagination';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { jobSequenceDetailPath } from '@/lib/fineract/job-sequence-paths';

type ActiveFilter = 'all' | 'active' | 'inactive';

export function JobSequencesTable({ sequences }: { sequences: FineractJobSequence[] }) {
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('all');
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25
  });

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return sequences.filter((sequence) => {
      if (activeFilter === 'active' && !sequence.active) {
        return false;
      }
      if (activeFilter === 'inactive' && sequence.active) {
        return false;
      }
      if (!query) {
        return true;
      }
      return (
        sequence.name.toLowerCase().includes(query) ||
        (sequence.description ?? '').toLowerCase().includes(query)
      );
    });
  }, [activeFilter, search, sequences]);

  useEffect(() => {
    setPagination((current) => ({ ...current, pageIndex: 0 }));
  }, [activeFilter, search]);

  const columns = useMemo<ColumnDef<FineractJobSequence>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => (
          <Link
            href={jobSequenceDetailPath(row.original.id)}
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            {row.original.name}
          </Link>
        )
      },
      {
        accessorKey: 'description',
        header: 'Description',
        cell: ({ row }) => {
          const description = row.original.description?.trim();
          if (!description) {
            return <span className="text-muted-foreground">—</span>;
          }
          return (
            <span className="line-clamp-2 max-w-md text-sm text-muted-foreground">
              {description}
            </span>
          );
        }
      },
      {
        id: 'active',
        header: 'Status',
        cell: ({ row }) => (
          <Badge variant={row.original.active ? 'default' : 'outline'}>
            {row.original.active ? 'Active' : 'Inactive'}
          </Badge>
        )
      },
      {
        id: 'steps',
        header: 'Steps',
        cell: ({ row }) => (
          <span className="tabular-nums">{row.original.steps.length}</span>
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
      <div className="flex flex-wrap items-center gap-3">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search sequences…"
          className="max-w-sm"
        />
        <Select
          value={activeFilter}
          onValueChange={(value) => value && setActiveFilter(value as ActiveFilter)}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <DataTable table={table} emptyMessage="No job sequences match your filters." />
      <DataTablePagination table={table} totalRecords={filteredRows.length} />
    </div>
  );
}
