'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { LoanOriginatorListItem } from '@mifos/api-client';
import { formatActionErrorMessage } from '@mifos/validation';
import {
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
  type PaginationState
} from '@tanstack/react-table';
import { Copy, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { deleteLoanOriginatorAction } from '@/actions/loan-originators';
import { DataTable } from '@/components/composites/data-table/data-table';
import { DataTablePagination } from '@/components/composites/data-table/data-table-pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { loanOriginatorDetailPath } from '@/lib/fineract/loan-originator-paths';
import {
  formatLoanOriginatorStatus,
  loanOriginatorStatusVariant
} from '@/lib/fineract/loan-originator-display';

async function copyText(value: string) {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
}

function ExternalIdValue({ value }: { value?: string }) {
  const [copied, setCopied] = useState(false);
  if (!value?.trim()) {
    return <span>—</span>;
  }

  return (
    <div className="flex items-center gap-2">
      <code className="text-xs">{value}</code>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={`Copy ${value}`}
        onClick={async (event) => {
          event.preventDefault();
          event.stopPropagation();
          const ok = await copyText(value);
          setCopied(ok);
          if (ok) {
            toast.success('Copied to clipboard.');
          } else {
            toast.error('Could not copy to clipboard.');
          }
        }}
      >
        <Copy className={copied ? 'size-4 text-primary' : 'size-4'} />
      </Button>
    </div>
  );
}

export function LoanOriginatorsTable({
  originators,
  canDelete
}: {
  originators: LoanOriginatorListItem[];
  canDelete: boolean;
}) {
  const router = useRouter();
  const [filter, setFilter] = useState('');
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25
  });
  const [deleteTarget, setDeleteTarget] = useState<LoanOriginatorListItem | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const filteredRows = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) {
      return originators;
    }
    return originators.filter((row) => {
      const haystack = [
        row.id,
        row.name,
        row.externalId,
        row.status,
        row.originatorType?.name,
        row.channelType?.name
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [originators, filter]);

  const columns = useMemo<ColumnDef<LoanOriginatorListItem>[]>(
    () => [
      {
        accessorKey: 'id',
        header: 'ID',
        cell: ({ row }) => row.original.id
      },
      {
        id: 'name',
        header: 'Name',
        cell: ({ row }) => (
          <Link
            href={loanOriginatorDetailPath(row.original.id)}
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            {row.original.name}
          </Link>
        )
      },
      {
        id: 'externalId',
        header: 'External ID',
        cell: ({ row }) => <ExternalIdValue value={row.original.externalId} />
      },
      {
        id: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <Badge variant={loanOriginatorStatusVariant(row.original.status)}>
            {formatLoanOriginatorStatus(row.original.status)}
          </Badge>
        )
      },
      {
        id: 'originatorType',
        header: 'Originator type',
        cell: ({ row }) => row.original.originatorType?.name ?? '—'
      },
      {
        id: 'channelType',
        header: 'Channel type',
        cell: ({ row }) => row.original.channelType?.name ?? '—'
      },
      ...(canDelete
        ? [
            {
              id: 'actions',
              header: 'Actions',
              cell: ({ row }) => (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Delete ${row.original.name}`}
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    setActionError(null);
                    setDeleteTarget(row.original);
                  }}
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              )
            } satisfies ColumnDef<LoanOriginatorListItem>
          ]
        : [])
    ],
    [canDelete]
  );

  const table = useReactTable({
    data: filteredRows,
    columns,
    state: { pagination },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  });

  function handleDelete() {
    if (!deleteTarget) {
      return;
    }
    setActionError(null);
    startTransition(async () => {
      const result = await deleteLoanOriginatorAction(deleteTarget.id);
      if (!result.ok) {
        setActionError(formatActionErrorMessage(result.message, result.fieldErrors));
        return;
      }
      setDeleteTarget(null);
      router.refresh();
    });
  }

  return (
    <>
      <div className="space-y-4">
        <Input
          placeholder="Filter loan originators…"
          value={filter}
          onChange={(event) => {
            setFilter(event.target.value);
            setPagination((prev) => ({ ...prev, pageIndex: 0 }));
          }}
          className="max-w-sm"
          aria-label="Filter loan originators"
        />
        <DataTable
          table={table}
          emptyMessage="No loan originators found"
          emptyDescription="Create a loan originator to attach it to loan accounts."
        />
        <DataTablePagination table={table} totalRecords={filteredRows.length} />
      </div>

      <Dialog open={deleteTarget != null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete loan originator</DialogTitle>
            <DialogDescription>
              Delete loan originator <strong>{deleteTarget?.name}</strong>? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          {actionError ? <p className="text-sm text-destructive">{actionError}</p> : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" disabled={pending} onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
