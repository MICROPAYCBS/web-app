'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractSurveyListItem } from '@mifos/api-client';
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
  type PaginationState
} from '@tanstack/react-table';
import { Circle, Lock, LockOpen } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { activateSurveyAction, deactivateSurveyAction } from '@/actions/surveys';
import { DataTable } from '@/components/composites/data-table/data-table';
import { DataTablePagination } from '@/components/composites/data-table/data-table-pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { isSurveyActive } from '@/lib/fineract/survey-display';
import { cn } from '@/lib/utils';

export function SurveysTable({
  surveys,
  canUpdate
}: {
  surveys: FineractSurveyListItem[];
  canUpdate: boolean;
}) {
  const router = useRouter();
  const [rows, setRows] = useState(surveys);
  const [filter, setFilter] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25
  });

  useEffect(() => {
    setRows(surveys);
  }, [surveys]);

  function applyLocalActivationState(surveyId: number, active: boolean) {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayIso = yesterday.toISOString().split('T')[0];

    setRows((current) =>
      current.map((survey) => {
        if (survey.id !== surveyId) {
          return survey;
        }
        return active
          ? { ...survey, validFrom: today, validTo: today }
          : { ...survey, validTo: yesterdayIso };
      })
    );
  }

  function handleActivate(surveyId: number) {
    setActionError(null);
    startTransition(async () => {
      const result = await activateSurveyAction(surveyId);
      if (!result.ok) {
        setActionError(result.message);
        toast.error(result.message);
        return;
      }
      applyLocalActivationState(surveyId, true);
      toast.success('Survey activated.');
      router.refresh();
    });
  }

  function handleDeactivate(surveyId: number) {
    setActionError(null);
    startTransition(async () => {
      const result = await deactivateSurveyAction(surveyId);
      if (!result.ok) {
        setActionError(result.message);
        toast.error(result.message);
        return;
      }
      applyLocalActivationState(surveyId, false);
      toast.success('Survey deactivated.');
      router.refresh();
    });
  }

  const columns = useMemo<ColumnDef<FineractSurveyListItem>[]>(
    () => [
      {
        accessorKey: 'key',
        header: 'Key',
        cell: ({ row }) => (
          <Link
            href={`/system/surveys/${row.original.id}`}
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            {row.original.key}
          </Link>
        )
      },
      { accessorKey: 'name', header: 'Name' },
      {
        accessorKey: 'description',
        header: 'Description',
        cell: ({ row }) => row.original.description ?? '—'
      },
      { accessorKey: 'countryCode', header: 'Country code' },
      {
        id: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const active = isSurveyActive(row.original.validFrom, row.original.validTo);
          return (
            <div className="flex items-center gap-2">
              <Circle
                className={cn(
                  'size-3 fill-current',
                  active ? 'text-primary' : 'text-muted-foreground'
                )}
                aria-hidden
              />
              <span className="text-sm text-muted-foreground">
                {active ? 'Active' : 'Inactive'}
              </span>
            </div>
          );
        }
      },
      ...(canUpdate
        ? [
            {
              id: 'actions',
              header: 'Actions',
              meta: { sticky: 'right' as const },
              cell: ({ row }: { row: { original: FineractSurveyListItem } }) => {
                const active = isSurveyActive(row.original.validFrom, row.original.validTo);
                return active ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={pending}
                    onClick={(event) => {
                      event.stopPropagation();
                      handleDeactivate(row.original.id);
                    }}
                  >
                    <Lock className="mr-2 size-4" />
                    Deactivate
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={pending}
                    onClick={(event) => {
                      event.stopPropagation();
                      handleActivate(row.original.id);
                    }}
                  >
                    <LockOpen className="mr-2 size-4" />
                    Activate
                  </Button>
                );
              }
            } satisfies ColumnDef<FineractSurveyListItem>
          ]
        : [])
    ],
    [canUpdate, pending]
  );

  const table = useReactTable({
    data: rows,
    columns,
    state: {
      globalFilter: filter,
      pagination
    },
    onPaginationChange: setPagination,
    onGlobalFilterChange: setFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  });

  return (
    <div className="space-y-4">
      <Input
        placeholder="Filter surveys…"
        value={filter}
        onChange={(event) => setFilter(event.target.value)}
        className="max-w-sm"
      />
      <DataTable
        table={table}
        stickyHeader={false}
        emptyMessage="No surveys found"
        emptyDescription="Surveys you create will appear here."
      />
      <DataTablePagination table={table} totalRecords={table.getFilteredRowModel().rows.length} />
      {actionError ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {actionError}
        </p>
      ) : null}
    </div>
  );
}
