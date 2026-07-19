'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractProvisioningEntryListItem } from '@mifos/api-client';
import { Can } from '@mifos/auth';
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
  type PaginationState
} from '@tanstack/react-table';
import { Eye, Pencil } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useState, useTransition } from 'react';
import { toastCommandOutcome, toastFineractError } from '@/lib/command-outcome-toast';
import { toast } from 'sonner';
import { recreateProvisioningEntryAction } from '@/actions/provisioning-entries';
import { DataTable } from '@/components/composites/data-table/data-table';
import { DataTablePagination } from '@/components/composites/data-table/data-table-pagination';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';

export function ProvisioningEntriesTable({
  entries
}: {
  entries: FineractProvisioningEntryListItem[];
}) {
  const router = useRouter();
  const [filter, setFilter] = useState('');
  const [pending, startTransition] = useTransition();
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25
  });

  const handleRecreate = useCallback(
    (entryId: number) => {
      startTransition(async () => {
        const result = await recreateProvisioningEntryAction(entryId);
        if (!result.ok) {

          toastFineractError(result.message);
          return;
      }
      toastCommandOutcome(result, { completed: 'Provisioning entry recreated.', pending: 'Provisioning entry recreated sent for approval.' });
        if (result.resourceId != null) {
          router.push(`/accounting/provisioning-entries/${result.resourceId}`);
        } else {
          router.refresh();
        }
      });
    },
    [router]
  );

  const columns = useMemo<ColumnDef<FineractProvisioningEntryListItem>[]>(
    () => [
      {
        id: 'createdUser',
        accessorKey: 'createdUser',
        header: 'Created by',
        cell: ({ row }) => row.original.createdUser || '—'
      },
      {
        id: 'createdDate',
        accessorKey: 'createdDate',
        header: 'Created on',
        cell: ({ row }) => row.original.createdDate || '—'
      },
      {
        id: 'journalEntry',
        accessorKey: 'journalEntry',
        header: 'Journal entry created',
        cell: ({ row }) => (
          <Checkbox checked={row.original.journalEntry} disabled aria-label="Journal entry created" />
        )
      },
      {
        id: 'viewReport',
        header: 'View report',
        cell: ({ row }) => (
          <Link
            href={`/accounting/provisioning-entries/${row.original.id}`}
            className="inline-flex items-center text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            <Eye className="mr-2 size-4" />
            View
          </Link>
        )
      },
      {
        id: 'recreate',
        header: 'Recreate',
        cell: ({ row }) => (
          <Can permission="CREATE_PROVISIONING_ENTRIES">
            <Button
              type="button"
              variant="link"
              size="sm"
              className="h-auto px-0"
              disabled={row.original.journalEntry || pending}
              onClick={() => handleRecreate(row.original.id)}
            >
              <Pencil className="mr-2 size-4" />
              Recreate
            </Button>
          </Can>
        )
      },
      {
        id: 'viewJournal',
        header: 'View journal entry',
        cell: ({ row }) =>
          row.original.journalEntry ? (
            <Link
              href={`/accounting/provisioning-entries/${row.original.id}/journal-entries`}
              className="inline-flex items-center text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              <Eye className="mr-2 size-4" />
              View
            </Link>
          ) : (
            <span className="inline-flex items-center text-sm text-muted-foreground">
              <Eye className="mr-2 size-4" />
              View
            </span>
          )
      }
    ],
    [handleRecreate, pending]
  );

  const table = useReactTable({
    data: entries,
    columns,
    state: {
      globalFilter: filter,
      pagination
    },
    onPaginationChange: setPagination,
    onGlobalFilterChange: setFilter,
    globalFilterFn: (row, _columnId, filterValue) => {
      const query = String(filterValue).trim().toLowerCase();
      if (!query) {
        return true;
      }
      const entry = row.original;
      return (
        entry.createdUser.toLowerCase().includes(query) ||
        entry.createdDate.toLowerCase().includes(query)
      );
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  });

  return (
    <div className="space-y-4">
      <Input
        placeholder="Filter entries…"
        value={filter}
        onChange={(event) => {
          setFilter(event.target.value);
          setPagination((current) => ({ ...current, pageIndex: 0 }));
        }}
        className="max-w-sm"
        aria-label="Filter provisioning entries"
      />
      <DataTable
        table={table}
        stickyHeader={false}
        emptyMessage="No provisioning entries found"
        emptyDescription="Create a provisioning entry to calculate loan loss reserves."
      />
      <DataTablePagination table={table} totalRecords={table.getFilteredRowModel().rows.length} />
    </div>
  );
}
