'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractUserSession } from '@mifos/api-client';
import {
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type PaginationState
} from '@tanstack/react-table';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState, useTransition } from 'react';
import { toastCommandOutcome, toastFineractError } from '@/lib/command-outcome-toast';
import { revokeUserSessionAction } from '@/actions/user-sessions';
import { DataTable } from '@/components/composites/data-table/data-table';
import { DataTablePagination } from '@/components/composites/data-table/data-table-pagination';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { formatAuditTrailDateTime } from '@/lib/fineract/audit-trail-display';
import {
  truncateUserAgent,
  userSessionStatusLabel,
  userSessionStatusVariant
} from '@/lib/fineract/user-session-display';

function DeviceCell({ userAgent }: { userAgent: string | null }) {
  const label = truncateUserAgent(userAgent);
  if (!userAgent?.trim()) {
    return <span className="text-muted-foreground">{label}</span>;
  }
  return (
    <Tooltip>
      <TooltipTrigger render={<span className="max-w-56 truncate" />}>{label}</TooltipTrigger>
      <TooltipContent side="top" className="max-w-sm text-pretty break-all">
        {userAgent}
      </TooltipContent>
    </Tooltip>
  );
}

export function UserSessionsTable({
  sessions,
  showUsername = false,
  canRevoke = false,
  emptyMessage = 'No active sessions.',
  emptyDescription,
  stickyHeader = false,
  pending = false,
  pageIndex,
  pageSize,
  totalRecords,
  onPaginationChange
}: {
  sessions: FineractUserSession[];
  showUsername?: boolean;
  canRevoke?: boolean;
  emptyMessage?: string;
  emptyDescription?: string;
  stickyHeader?: boolean;
  pending?: boolean;
  pageIndex?: number;
  pageSize?: number;
  totalRecords?: number;
  onPaginationChange?: (pagination: PaginationState) => void;
}) {
  const router = useRouter();
  const [revokeTarget, setRevokeTarget] = useState<FineractUserSession | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionPending, startTransition] = useTransition();
  const paged = onPaginationChange != null && pageIndex != null && pageSize != null;
  const pagination: PaginationState | undefined = paged
    ? { pageIndex, pageSize }
    : undefined;

  const columns = useMemo<ColumnDef<FineractUserSession>[]>(() => {
    const cols: ColumnDef<FineractUserSession>[] = [];
    if (showUsername) {
      cols.push({
        accessorKey: 'username',
        header: 'Username',
        cell: ({ row }) => (
          <Link
            href={`/appusers/${row.original.userId}`}
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            {row.original.username || `User ${row.original.userId}`}
          </Link>
        )
      });
    }
    cols.push(
      {
        accessorKey: 'validFrom',
        header: 'Signed in',
        cell: ({ row }) => formatAuditTrailDateTime(row.original.validFrom)
      },
      {
        accessorKey: 'validTo',
        header: 'Expires',
        cell: ({ row }) => formatAuditTrailDateTime(row.original.validTo)
      },
      {
        accessorKey: 'ipAddress',
        header: 'IP',
        cell: ({ row }) => row.original.ipAddress || '—'
      },
      {
        accessorKey: 'userAgent',
        header: 'Device',
        cell: ({ row }) => <DeviceCell userAgent={row.original.userAgent} />
      },
      {
        id: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <Badge variant={userSessionStatusVariant(row.original)}>
            {userSessionStatusLabel(row.original)}
          </Badge>
        )
      }
    );
    if (canRevoke) {
      cols.push({
        id: 'revoke',
        header: '',
        cell: ({ row }) => (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending || actionPending}
            onClick={() => {
              setActionError(null);
              setRevokeTarget(row.original);
            }}
          >
            Revoke
          </Button>
        )
      });
    }
    return cols;
  }, [actionPending, canRevoke, pending, showUsername]);

  const table = useReactTable({
    data: sessions,
    columns,
    state: pagination ? { pagination } : undefined,
    manualPagination: paged,
    pageCount: paged
      ? Math.max(1, Math.ceil((totalRecords ?? sessions.length) / pageSize))
      : undefined,
    onPaginationChange: paged
      ? (updater) => {
          const current = pagination!;
          const next = typeof updater === 'function' ? updater(current) : updater;
          onPaginationChange(next);
        }
      : undefined,
    getCoreRowModel: getCoreRowModel()
  });

  function handleRevoke() {
    if (!revokeTarget) {
      return;
    }
    const target = revokeTarget;
    setActionError(null);
    startTransition(async () => {
      const result = await revokeUserSessionAction(target.userId, target.id);
      if (!result.ok) {
        setActionError(result.message);
        toastFineractError(result.message);
        return;
      }
      toastCommandOutcome(result, {
        completed: 'Session revoked.',
        pending: 'Session revocation sent for approval.'
      });
      setRevokeTarget(null);
      router.refresh();
    });
  }

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <DataTable
          table={table}
          stickyHeader={stickyHeader}
          isLoading={pending}
          emptyMessage={emptyMessage}
          emptyDescription={emptyDescription}
        />
        {paged ? (
          <DataTablePagination table={table} totalRecords={totalRecords ?? sessions.length} />
        ) : null}
      </div>

      <Dialog
        open={revokeTarget != null}
        onOpenChange={(next) => {
          if (!actionPending && !next) {
            setRevokeTarget(null);
            setActionError(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revoke session</DialogTitle>
            <DialogDescription>
              Revoke this session? The device will be signed out on its next action.
            </DialogDescription>
          </DialogHeader>
          {actionError ? <p className="text-sm text-destructive">{actionError}</p> : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setRevokeTarget(null)}
              disabled={actionPending}
            >
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={handleRevoke} disabled={actionPending}>
              Revoke session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
