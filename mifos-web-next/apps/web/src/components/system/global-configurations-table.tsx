'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractGlobalConfiguration } from '@mifos/api-client';
import { Can } from '@mifos/auth';
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
  type PaginationState
} from '@tanstack/react-table';
import { CircleHelp, Pencil } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { updateGlobalConfigurationEnabledAction } from '@/actions/global-configurations';
import { DataTable } from '@/components/composites/data-table/data-table';
import { DataTablePagination } from '@/components/composites/data-table/data-table-pagination';
import { GlobalConfigurationEditSheet } from '@/components/system/global-configuration-edit-sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  applyGlobalConfigurationChanges,
  formatGlobalConfigurationDateValue,
  formatGlobalConfigurationStringValue,
  formatGlobalConfigurationValue,
  globalConfigurationDisplayName
} from '@/lib/fineract/global-configuration-display';

export function GlobalConfigurationsTable({
  configurations: initialConfigurations,
  canUpdate
}: {
  configurations: FineractGlobalConfiguration[];
  canUpdate: boolean;
}) {
  const router = useRouter();
  const [configurations, setConfigurations] = useState(initialConfigurations);
  const [filter, setFilter] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [editConfiguration, setEditConfiguration] = useState<FineractGlobalConfiguration | null>(
    null
  );
  const [editOpen, setEditOpen] = useState(false);
  const [, startTransition] = useTransition();
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25
  });

  useEffect(() => {
    setConfigurations(initialConfigurations);
  }, [initialConfigurations]);

  const toggleConfiguration = useCallback(
    (configuration: FineractGlobalConfiguration, enabled: boolean) => {
      if (!canUpdate) {
        return;
      }

      const previousEnabled = configuration.enabled;
      setConfigurations((current) =>
        current.map((row) => (row.id === configuration.id ? { ...row, enabled } : row))
      );
      setActionError(null);
      setTogglingId(configuration.id);

      startTransition(async () => {
        const result = await updateGlobalConfigurationEnabledAction(configuration.id, enabled);
        setTogglingId(null);
        if (!result.ok) {
          setConfigurations((current) =>
            current.map((row) =>
              row.id === configuration.id ? { ...row, enabled: previousEnabled } : row
            )
          );
          setActionError(result.message);
          return;
        }

        if (result.data?.changes) {
          setConfigurations((current) =>
            current.map((row) =>
              row.id === configuration.id
                ? applyGlobalConfigurationChanges(row, result.data?.changes ?? {})
                : row
            )
          );
        }

        toast.success(`${configuration.name} ${enabled ? 'enabled' : 'disabled'}.`);
      });
    },
    [canUpdate]
  );

  const columns = useMemo<ColumnDef<FineractGlobalConfiguration>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => {
          const configuration = row.original;
          const description = configuration.description?.trim();
          const displayName = globalConfigurationDisplayName(configuration.name);
          return (
            <div className="flex items-start gap-2">
              <span className="font-medium break-all">{displayName}</span>
              {description ? (
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="mt-0.5 shrink-0 text-muted-foreground"
                        aria-label={`About ${displayName}`}
                      />
                    }
                  >
                    <CircleHelp className="size-4" />
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-xs text-pretty">
                    {description}
                  </TooltipContent>
                </Tooltip>
              ) : null}
            </div>
          );
        }
      },
      {
        id: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const configuration = row.original;
          const pending = togglingId === configuration.id;
          return (
            <div className="flex items-center gap-3">
              <Switch
                id={`global-configuration-${configuration.id}`}
                checked={configuration.enabled}
                onCheckedChange={(checked) => toggleConfiguration(configuration, checked)}
                disabled={pending || !canUpdate}
                aria-label={`Toggle ${configuration.name}`}
              />
              <span className="text-sm text-muted-foreground">
                {configuration.enabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          );
        }
      },
      {
        id: 'value',
        header: 'Value',
        cell: ({ row }) => formatGlobalConfigurationValue(row.original.value)
      },
      {
        id: 'stringValue',
        header: 'String value',
        cell: ({ row }) => formatGlobalConfigurationStringValue(row.original.stringValue)
      },
      {
        id: 'dateValue',
        header: 'Date value',
        cell: ({ row }) => formatGlobalConfigurationDateValue(row.original.dateValue)
      },
      {
        id: 'actions',
        header: 'Actions',
        meta: { sticky: 'right' },
        cell: ({ row }) =>
          canUpdate ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`Edit ${row.original.name}`}
              onClick={() => {
                setEditConfiguration(row.original);
                setEditOpen(true);
              }}
            >
              <Pencil className="size-4" />
            </Button>
          ) : null
      }
    ],
    [canUpdate, toggleConfiguration, togglingId]
  );

  const table = useReactTable({
    data: configurations,
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
      const configuration = row.original;
      return (
        configuration.name.toLowerCase().includes(query) ||
        (configuration.description?.toLowerCase().includes(query) ?? false)
      );
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  });

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <Input
          placeholder="Filter configurations…"
          value={filter}
          onChange={(event) => {
            setFilter(event.target.value);
            setPagination((current) => ({ ...current, pageIndex: 0 }));
          }}
          className="max-w-sm"
          aria-label="Filter global configurations"
        />

        {actionError ? (
          <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {actionError}
          </p>
        ) : null}

        <DataTable
          table={table}
          stickyHeader={false}
          emptyMessage="No configurations found"
          emptyDescription="Adjust the filter or check your access permissions."
        />
        <DataTablePagination table={table} totalRecords={table.getFilteredRowModel().rows.length} />

        <Can permission="UPDATE_CONFIGURATION">
          <GlobalConfigurationEditSheet
            open={editOpen}
            onOpenChange={setEditOpen}
            configuration={editConfiguration}
            onSaved={() => {
              setEditConfiguration(null);
              router.refresh();
            }}
          />
        </Can>
      </div>
    </TooltipProvider>
  );
}
