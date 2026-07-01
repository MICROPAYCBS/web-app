'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractLockedLoan } from '@mifos/api-client';
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
  type RowSelectionState
} from '@tanstack/react-table';
import { ExternalLink, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { toastFineractError } from '@/lib/toast-fineract-error';
import { resolveLoanClientPathAction } from '@/actions/jobs';
import { DataTable } from '@/components/composites/data-table/data-table';
import { DataTablePagination } from '@/components/composites/data-table/data-table-pagination';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { formatJobDateTime } from '@/lib/fineract/jobs-display';

export function LockedLoansTable({
  loans,
  canExecuteInline,
  onSelectedLoansChange
}: {
  loans: FineractLockedLoan[];
  canExecuteInline: boolean;
  onSelectedLoansChange?: (loans: FineractLockedLoan[]) => void;
}) {
  const router = useRouter();
  const [filter, setFilter] = useState('');
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [stacktraceLoan, setStacktraceLoan] = useState<FineractLockedLoan | null>(null);
  const [pending, startTransition] = useTransition();

  const selectedLoans = useMemo(
    () =>
      Object.entries(rowSelection)
        .filter(([, selected]) => selected)
        .map(([loanId]) => loans.find((loan) => String(loan.loanId) === loanId))
        .filter((loan): loan is FineractLockedLoan => loan != null),
    [loans, rowSelection]
  );

  useEffect(() => {
    onSelectedLoansChange?.(selectedLoans);
  }, [onSelectedLoansChange, selectedLoans]);

  const columns = useMemo<ColumnDef<FineractLockedLoan>[]>(
    () => [
      ...(canExecuteInline
        ? [
            {
              id: 'select',
              header: ({ table }) => (
                <Checkbox
                  checked={table.getIsAllPageRowsSelected()}
                  onCheckedChange={(value) => table.toggleAllPageRowsSelected(value === true)}
                  aria-label="Select all loans on this page"
                />
              ),
              cell: ({ row }) => (
                <Checkbox
                  checked={row.getIsSelected()}
                  onCheckedChange={(value) => row.toggleSelected(value === true)}
                  aria-label={`Select loan ${row.original.loanId}`}
                />
              ),
              enableSorting: false
            } satisfies ColumnDef<FineractLockedLoan>
          ]
        : []),
      {
        accessorKey: 'loanId',
        header: 'Loan ID'
      },
      {
        id: 'lockPlacedOn',
        header: 'Lock placed on',
        cell: ({ row }) => formatJobDateTime(row.original.lockPlacedOn)
      },
      {
        accessorKey: 'lockOwner',
        header: 'Lock owner',
        cell: ({ row }) => row.original.lockOwner ?? '—'
      },
      {
        accessorKey: 'error',
        header: 'Error',
        cell: ({ row }) => row.original.error ?? '—'
      },
      {
        id: 'details',
        header: 'Details',
        cell: ({ row }) => (
          <div className="flex gap-1">
            {row.original.stacktrace ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setStacktraceLoan(row.original)}
              >
                <FileText className="mr-2 size-4" />
                Error
              </Button>
            ) : null}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={pending}
              onClick={() => {
                startTransition(async () => {
                  const result = await resolveLoanClientPathAction(row.original.loanId);
                  if (!result.ok) {
                    toastFineractError(result.message);
                    return;
                  }
                  router.push(result.path);
                });
              }}
            >
              <ExternalLink className="mr-2 size-4" />
              View loan
            </Button>
          </div>
        )
      }
    ],
    [canExecuteInline, pending, router]
  );

  const table = useReactTable({
    data: loans,
    columns,
    getRowId: (row) => String(row.loanId),
    state: {
      globalFilter: filter,
      rowSelection
    },
    enableRowSelection: canExecuteInline,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setFilter,
    globalFilterFn: (row, _columnId, value) => {
      const needle = String(value).toLowerCase();
      return (
        String(row.original.loanId).includes(needle) ||
        (row.original.error ?? '').toLowerCase().includes(needle)
      );
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize: 100 }
    }
  });

  if (!loans.length) {
    return (
      <p className="rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
        No locked loans are available right now.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <Input
        value={filter}
        onChange={(event) => setFilter(event.target.value)}
        placeholder="Filter by loan ID or error…"
        className="max-w-sm"
      />
      <DataTable<FineractLockedLoan>
        table={table}
        stickyHeader={false}
        emptyMessage="No locked loans match your filter"
        emptyDescription="Try a different loan ID or error text."
      />
      <DataTablePagination<FineractLockedLoan>
        table={table}
        totalRecords={table.getFilteredRowModel().rows.length}
      />
      <Dialog open={stacktraceLoan != null} onOpenChange={(open) => !open && setStacktraceLoan(null)}>
        <DialogContent className="max-h-[80vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Loan {stacktraceLoan?.loanId} error details</DialogTitle>
          </DialogHeader>
          <pre className="max-h-96 overflow-auto rounded-md border border-border bg-muted/40 p-3 text-xs whitespace-pre-wrap">
            {stacktraceLoan?.stacktrace ?? stacktraceLoan?.error ?? 'No details available.'}
          </pre>
        </DialogContent>
      </Dialog>
    </div>
  );
}
