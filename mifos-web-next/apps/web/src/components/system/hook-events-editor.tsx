'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractHookTemplate } from '@mifos/api-client';
import type { HookEventInput } from '@mifos/validation';
import {
  getCoreRowModel,
  useReactTable,
  type ColumnDef
} from '@tanstack/react-table';
import { Plus, Trash2 } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { DataTable } from '@/components/composites/data-table/data-table';
import { HookAddEventSheet } from '@/components/system/hook-add-event-sheet';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { formatHookEventLabel } from '@/lib/fineract/hook-display';

export function HookEventsEditor({
  events,
  onChange,
  template,
  error,
  minEvents = 1
}: {
  events: HookEventInput[];
  onChange: (events: HookEventInput[]) => void;
  template: FineractHookTemplate;
  error?: string;
  minEvents?: number;
}) {
  const [addOpen, setAddOpen] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const eventsRef = useRef(events);
  eventsRef.current = events;

  const columns = useMemo<ColumnDef<HookEventInput>[]>(
    () => [
      {
        accessorKey: 'entityName',
        header: 'Entity'
      },
      {
        accessorKey: 'actionName',
        header: 'Action'
      },
      {
        id: 'actions',
        header: 'Actions',
        meta: { sticky: 'right' },
        cell: ({ row }) => (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="text-destructive hover:text-destructive"
            aria-label={`Remove ${formatHookEventLabel(row.original)}`}
            onClick={() => {
              setDeleteError(null);
              setDeleteIndex(row.index);
            }}
          >
            <Trash2 className="size-4" />
          </Button>
        )
      }
    ],
    []
  );

  const table = useReactTable({
    data: events,
    columns,
    getCoreRowModel: getCoreRowModel()
  });

  function confirmDelete() {
    if (deleteIndex == null) {
      return;
    }
    if (events.length <= minEvents) {
      setDeleteError('At least one event is required.');
      return;
    }
    onChange(eventsRef.current.filter((_, index) => index !== deleteIndex));
    setDeleteIndex(null);
    setDeleteError(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-medium">Events</h3>
          <p className="text-sm text-muted-foreground">
            Choose when this hook should run.
          </p>
        </div>
        <Button type="button" variant="outline" onClick={() => setAddOpen(true)}>
          <Plus className="mr-2 size-4" />
          Add event
        </Button>
      </div>

      {error ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <DataTable
        table={table}
        stickyHeader={false}
        emptyMessage="No events added"
        emptyDescription="Add at least one entity action to trigger this hook."
      />

      <HookAddEventSheet
        open={addOpen}
        onOpenChange={setAddOpen}
        template={template}
        onAdd={(event) => onChange([...eventsRef.current, event])}
      />

      <Dialog open={deleteIndex != null} onOpenChange={(open) => !open && setDeleteIndex(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove event</DialogTitle>
            <DialogDescription>
              {deleteIndex != null && events[deleteIndex]
                ? `Remove ${formatHookEventLabel(events[deleteIndex])}?`
                : 'Remove this event?'}
            </DialogDescription>
          </DialogHeader>
          {deleteError ? (
            <p className="text-sm text-destructive">{deleteError}</p>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteIndex(null)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={confirmDelete}>
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
