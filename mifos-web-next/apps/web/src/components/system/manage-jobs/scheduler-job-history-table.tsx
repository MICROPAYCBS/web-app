'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractSchedulerJob, FineractSchedulerJobRunHistory } from '@mifos/api-client';
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef
} from '@tanstack/react-table';
import { AlertCircle, CheckCircle2, FileText } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  DetailBackLink,
  DetailHeader,
  DetailPage
} from '@/components/composites';
import { DataTable } from '@/components/composites/data-table/data-table';
import { DataTablePagination } from '@/components/composites/data-table/data-table-pagination';
import { JobErrorLogDialog } from '@/components/system/manage-jobs/job-error-log-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatJobDateTime, jobRunSucceeded } from '@/lib/fineract/jobs-display';

export function SchedulerJobHistoryTable({
  job,
  history
}: {
  job: FineractSchedulerJob;
  history: FineractSchedulerJobRunHistory[];
}) {
  const [versionFilter, setVersionFilter] = useState('');
  const [errorHistory, setErrorHistory] = useState<FineractSchedulerJobRunHistory | null>(null);

  const columns = useMemo<ColumnDef<FineractSchedulerJobRunHistory>[]>(
    () => [
      {
        accessorKey: 'version',
        header: 'Version',
        cell: ({ row }) => row.original.version ?? '—'
      },
      {
        id: 'jobRunStartTime',
        header: 'Start time',
        cell: ({ row }) => formatJobDateTime(row.original.jobRunStartTime)
      },
      {
        id: 'jobRunEndTime',
        header: 'End time',
        cell: ({ row }) => formatJobDateTime(row.original.jobRunEndTime)
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const succeeded = jobRunSucceeded(row.original);
          return (
            <div className="flex items-center gap-2">
              {succeeded ? (
                <CheckCircle2 className="size-4 text-primary" aria-hidden />
              ) : (
                <AlertCircle className="size-4 text-destructive" aria-hidden />
              )}
              <span>{row.original.status ?? '—'}</span>
            </div>
          );
        }
      },
      {
        accessorKey: 'triggerType',
        header: 'Trigger',
        cell: ({ row }) => row.original.triggerType ?? '—'
      },
      {
        id: 'errorLog',
        header: 'Error log',
        cell: ({ row }) =>
          row.original.jobRunErrorLog || row.original.jobRunErrorMessage ? (
            <Button type="button" variant="ghost" size="sm" onClick={() => setErrorHistory(row.original)}>
              <FileText className="mr-2 size-4" />
              View
            </Button>
          ) : (
            '—'
          )
      }
    ],
    []
  );

  const table = useReactTable({
    data: history,
    columns,
    state: {
      globalFilter: versionFilter
    },
    onGlobalFilterChange: setVersionFilter,
    globalFilterFn: (row, _columnId, value) => {
      const needle = String(value).trim();
      if (!needle) {
        return true;
      }
      return String(row.original.version ?? '') === needle;
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize: 25 }
    }
  });

  return (
    <DetailPage
      header={
        <DetailHeader
          backLink={
            <DetailBackLink href={`/system/manage-jobs/${job.jobId}`} label="Back to job details" />
          }
          title={`History — ${job.displayName}`}
        />
      }
    >
      <div className="space-y-4">
        <Input
          value={versionFilter}
          onChange={(event) => setVersionFilter(event.target.value)}
          placeholder="Filter by version…"
          className="max-w-xs"
        />
        <DataTable<FineractSchedulerJobRunHistory>
          table={table}
          stickyHeader={false}
          emptyMessage="No run history found"
          emptyDescription="This job has not recorded any runs yet."
        />
        <DataTablePagination<FineractSchedulerJobRunHistory>
          table={table}
          totalRecords={table.getFilteredRowModel().rows.length}
        />
      </div>
      <JobErrorLogDialog
        open={errorHistory != null}
        onOpenChange={(open) => !open && setErrorHistory(null)}
        history={errorHistory ?? undefined}
      />
    </DetailPage>
  );
}
