'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractExternalEventConfigurationItem } from '@mifos/api-client';
import { Can } from '@mifos/auth';
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
  type PaginationState
} from '@tanstack/react-table';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { updateExternalEventConfigurationAction } from '@/actions/external-events';
import { DataTable } from '@/components/composites/data-table/data-table';
import { DataTablePagination } from '@/components/composites/data-table/data-table-pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';

export function ExternalEventsTable({
  events: initialEvents,
  canUpdate
}: {
  events: FineractExternalEventConfigurationItem[];
  canUpdate: boolean;
}) {
  const router = useRouter();
  const [events, setEvents] = useState(initialEvents);
  const [filter, setFilter] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25
  });

  useEffect(() => {
    setEvents(initialEvents);
  }, [initialEvents]);

  const pendingChanges = useMemo(() => {
    const changes: Record<string, boolean> = {};
    for (const event of events) {
      const initial = initialEvents.find((row) => row.type === event.type);
      if (initial && initial.enabled !== event.enabled) {
        changes[event.type] = event.enabled;
      }
    }
    return changes;
  }, [events, initialEvents]);

  const hasChanges = Object.keys(pendingChanges).length > 0;

  const toggleEvent = useCallback(
    (type: string, enabled: boolean) => {
      if (!canUpdate) {
        return;
      }
      setEvents((current) =>
        current.map((event) => (event.type === type ? { ...event, enabled } : event))
      );
      setActionError(null);
    },
    [canUpdate]
  );

  function applyChanges() {
    if (!hasChanges) {
      return;
    }
    setActionError(null);
    startTransition(async () => {
      const result = await updateExternalEventConfigurationAction(pendingChanges);
      if (!result.ok) {
        setActionError(result.message);
        return;
      }
      toast.success('External event settings updated.');
      router.refresh();
    });
  }

  const columns = useMemo<ColumnDef<FineractExternalEventConfigurationItem>[]>(
    () => [
      {
        accessorKey: 'type',
        header: 'Event type',
        cell: ({ row }) => (
          <span className="font-medium break-all">{row.original.type}</span>
        )
      },
      {
        id: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const event = row.original;
          return (
            <div className="flex items-center gap-3">
              <Switch
                id={`external-event-${event.type}`}
                checked={event.enabled}
                onCheckedChange={(checked) => toggleEvent(event.type, checked)}
                disabled={pending || !canUpdate}
                aria-label={`Toggle ${event.type}`}
              />
              <span className="text-sm text-muted-foreground">
                {event.enabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          );
        }
      }
    ],
    [canUpdate, pending, toggleEvent]
  );

  const table = useReactTable({
    data: events,
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
      return row.original.type.toLowerCase().includes(query);
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Input
          placeholder="Filter event types…"
          value={filter}
          onChange={(event) => {
            setFilter(event.target.value);
            setPagination((current) => ({ ...current, pageIndex: 0 }));
          }}
          className="max-w-sm"
          aria-label="Filter external events"
        />
        <Can permission="UPDATE_EXTERNAL_EVENT_CONFIGURATION">
          <Button type="button" onClick={applyChanges} disabled={pending || !hasChanges}>
            {pending ? 'Applying…' : 'Apply changes'}
          </Button>
        </Can>
      </div>

      {actionError ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {actionError}
        </p>
      ) : null}

      <DataTable
        table={table}
        stickyHeader={false}
        emptyMessage="No external events configured"
        emptyDescription="Event types will appear here when the server publishes configuration."
      />
      <DataTablePagination table={table} totalRecords={table.getFilteredRowModel().rows.length} />
    </div>
  );
}
