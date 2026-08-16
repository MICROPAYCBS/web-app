'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractSchedulerJob } from '@mifos/api-client';
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type RowSelectionState
} from '@tanstack/react-table';
import { AlertCircle, CheckCircle2, FileText } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { DataTable } from '@/components/composites/data-table/data-table';
import { DataTablePagination } from '@/components/composites/data-table/data-table-pagination';
import { JobErrorLogDialog } from '@/components/system/manage-jobs/job-error-log-dialog';
import { JobRunningStatus } from '@/components/system/manage-jobs/job-running-status';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { formatJobDateTime, jobRunSucceeded, yesNoLabel } from '@/lib/fineract/jobs-display';

export function SchedulerJobsTable({
  jobs,
  canExecute,
  onSelectedJobsChange
}: {
  jobs: FineractSchedulerJob[];
  canExecute: boolean;
  onSelectedJobsChange?: (jobs: FineractSchedulerJob[]) => void;
}) {
  const [filter, setFilter] = useState('');
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [errorJob, setErrorJob] = useState<FineractSchedulerJob | null>(null);
  const skipInitialSelectionSync = useRef(true);

  const selectedJobs = useMemo(
    () =>
      Object.entries(rowSelection)
        .filter(([, selected]) => selected)
        .map(([jobId]) => jobs.find((job) => String(job.jobId) === jobId))
        .filter((job): job is FineractSchedulerJob => job != null),
    [jobs, rowSelection]
  );

  useEffect(() => {
    if (skipInitialSelectionSync.current) {
      skipInitialSelectionSync.current = false;
      return;
    }
    onSelectedJobsChange?.(selectedJobs);
  }, [onSelectedJobsChange, selectedJobs]);

  useEffect(() => {
    return () => {
      skipInitialSelectionSync.current = true;
    };
  }, []);

  const columns = useMemo<ColumnDef<FineractSchedulerJob>[]>(
    () => [
      ...(canExecute
        ? [
            {
              id: 'select',
              header: ({ table }) => (
                <Checkbox
                  checked={table.getIsAllPageRowsSelected()}
                  onCheckedChange={(value) => table.toggleAllPageRowsSelected(value === true)}
                  aria-label="Select all jobs on this page"
                />
              ),
              cell: ({ row }) => (
                <Checkbox
                  checked={row.getIsSelected()}
                  disabled={row.original.currentlyRunning}
                  onCheckedChange={(value) => row.toggleSelected(value === true)}
                  aria-label={`Select ${row.original.displayName}`}
                />
              ),
              enableSorting: false
            } satisfies ColumnDef<FineractSchedulerJob>
          ]
        : []),
      {
        accessorKey: 'displayName',
        header: 'Job name',
        cell: ({ row }) => {
          const description = row.original.description?.trim();
          return (
            <div className="max-w-md space-y-1">
              <Link
                href={`/system/manage-jobs/${row.original.jobId}`}
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                {row.original.displayName}
              </Link>
              {description ? (
                <p className="line-clamp-2 text-sm text-muted-foreground">{description}</p>
              ) : null}
            </div>
          );
        }
      },
      {
        accessorKey: 'shortName',
        header: 'Short name',
        cell: ({ row }) =>
          row.original.shortName?.trim() ? (
            <span className="font-mono text-sm tabular-nums">{row.original.shortName}</span>
          ) : (
            '—'
          )
      },
      {
        accessorKey: 'active',
        header: 'Active',
        cell: ({ row }) => yesNoLabel(row.original.active)
      },
      {
        id: 'previousRun',
        header: 'Previous run',
        cell: ({ row }) => {
          const history = row.original.lastRunHistory;
          if (!history?.jobRunStartTime) {
            return '—';
          }
          const running = row.original.currentlyRunning;
          const succeeded = jobRunSucceeded(history);
          return (
            <div className="flex items-center gap-2">
              {running ? null : succeeded ? (
                <CheckCircle2 className="size-4 text-primary" aria-hidden />
              ) : (
                <AlertCircle className="size-4 text-destructive" aria-hidden />
              )}
              <span className={running ? 'text-muted-foreground' : undefined}>
                {formatJobDateTime(history.jobRunStartTime)}
              </span>
            </div>
          );
        }
      },
      {
        accessorKey: 'currentlyRunning',
        header: 'Running',
        cell: ({ row }) => <JobRunningStatus running={row.original.currentlyRunning} />
      },
      {
        id: 'nextRunTime',
        header: 'Next run',
        cell: ({ row }) => formatJobDateTime(row.original.nextRunTime)
      },
      {
        id: 'errorLog',
        header: 'Error log',
        meta: { sticky: 'right' },
        cell: ({ row }) =>
          row.original.lastRunHistory?.jobRunErrorLog ||
          row.original.lastRunHistory?.jobRunErrorMessage ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setErrorJob(row.original)}
            >
              <FileText className="mr-2 size-4" />
              View
            </Button>
          ) : (
            '—'
          )
      }
    ],
    [canExecute]
  );

  const table = useReactTable({
    data: jobs,
    columns,
    getRowId: (row) => String(row.jobId),
    state: {
      globalFilter: filter,
      rowSelection
    },
    enableRowSelection: (row) => canExecute && !row.original.currentlyRunning,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setFilter,
    globalFilterFn: (row, _columnId, value) => {
      const needle = String(value).toLowerCase();
      const displayName = row.original.displayName.toLowerCase();
      const shortName = row.original.shortName?.toLowerCase() ?? '';
      const description = row.original.description?.toLowerCase() ?? '';
      return (
        displayName.includes(needle) || shortName.includes(needle) || description.includes(needle)
      );
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize: 50 }
    }
  });

  return (
    <div className="space-y-4">
      <Input
        value={filter}
        onChange={(event) => setFilter(event.target.value)}
        placeholder="Filter by job name, short name, or description..."
        className="max-w-sm"
      />
      <DataTable<FineractSchedulerJob>
        table={table}
        stickyHeader={false}
        emptyMessage="No scheduler jobs found"
        emptyDescription="Jobs appear when the scheduler is configured on this server."
      />
      <DataTablePagination<FineractSchedulerJob>
        table={table}
        totalRecords={table.getFilteredRowModel().rows.length}
      />
      <JobErrorLogDialog
        open={errorJob != null}
        onOpenChange={(open) => !open && setErrorJob(null)}
        jobName={errorJob?.displayName}
        history={errorJob?.lastRunHistory}
      />
    </div>
  );
}
