'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractRolePermissionUsage, WorkflowDefinition } from '@mifos/api-client';
import {
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
  type PaginationState
} from '@tanstack/react-table';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { DataTable } from '@/components/composites/data-table/data-table';
import { DataTablePagination } from '@/components/composites/data-table/data-table-pagination';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  formatWorkflowTaskDisplay,
  workflowDefinitionStatusLabel,
  workflowDefinitionStatusVariant,
  workflowSelectionCriteriaSummary
} from '@/lib/fineract/approval-workflow-display';
import { approvalWorkflowDetailPath } from '@/lib/fineract/approval-workflow-paths';
import {
  filterApprovalWorkflowDefinitions,
  type ApprovalWorkflowListFilters
} from '@/lib/fineract/approval-workflow-list-query';

export function ApprovalWorkflowsTable({
  definitions,
  appliedFilters,
  taskPermissions,
  filterTrigger
}: {
  definitions: WorkflowDefinition[];
  appliedFilters: ApprovalWorkflowListFilters;
  taskPermissions: FineractRolePermissionUsage[];
  filterTrigger?: ReactNode;
}) {
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25
  });

  const filteredRows = useMemo(
    () => filterApprovalWorkflowDefinitions(definitions, search, appliedFilters),
    [appliedFilters, definitions, search]
  );

  useEffect(() => {
    setPagination((current) => ({ ...current, pageIndex: 0 }));
  }, [appliedFilters, search]);

  const columns = useMemo<ColumnDef<WorkflowDefinition>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => (
          <Link
            href={approvalWorkflowDetailPath(row.original.id)}
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            {row.original.name}
          </Link>
        )
      },
      {
        id: 'task',
        header: 'Task',
        cell: ({ row }) => {
          const task = formatWorkflowTaskDisplay(
            row.original.taskPermissionCode,
            taskPermissions
          );
          return (
            <div className="min-w-0">
              <p className="font-medium">{task.code}</p>
              {task.subtitle ? (
                <p className="text-xs text-muted-foreground">{task.subtitle}</p>
              ) : null}
            </div>
          );
        }
      },
      {
        id: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <Badge variant={workflowDefinitionStatusVariant(row.original.status)}>
            {workflowDefinitionStatusLabel(row.original.status)}
          </Badge>
        )
      },
      {
        id: 'priority',
        header: 'Priority',
        cell: ({ row }) => row.original.priority ?? '—'
      },
      {
        id: 'criteria',
        header: 'Selection criteria',
        cell: ({ row }) => workflowSelectionCriteriaSummary(row.original)
      },
      {
        id: 'stages',
        header: 'Stages',
        cell: ({ row }) => row.original.stages.length
      }
    ],
    [taskPermissions]
  );

  const table = useReactTable({
    data: filteredRows,
    columns,
    state: { pagination },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <Input
          id="workflow-search"
          placeholder="Search by name or task"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="max-w-sm"
        />
        {filterTrigger ? (
          <div className="flex flex-wrap items-center justify-end gap-2">{filterTrigger}</div>
        ) : null}
      </div>

      <DataTable
        table={table}
        emptyMessage="No approval workflows found"
        emptyDescription="Create a workflow definition to configure multi-stage approval chains."
      />
      <DataTablePagination table={table} totalRecords={filteredRows.length} />
    </div>
  );
}
