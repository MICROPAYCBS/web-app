'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import {
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
  type RowSelectionState
} from '@tanstack/react-table';
import Link from 'next/link';
import { PanelRightOpen } from 'lucide-react';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import type { FineractRolePermissionUsage } from '@mifos/api-client';
import { DataTable } from '@/components/composites/data-table/data-table';
import { DataTablePagination } from '@/components/composites/data-table/data-table-pagination';
import { CheckerInboxReviewSheet } from '@/components/tasks/checker-inbox-review-sheet';
import {
  checkerInboxHasReviewDetails,
  checkerInboxReviewDetailCount
} from '@/components/tasks/checker-inbox-review-summary';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import type { CheckerInboxEnrichedItem } from '@/lib/checker-inbox/checker-inbox-item-types';
import {
  applyCheckerInboxClientFilters,
  countActiveCheckerInboxClientFilters,
  type CheckerInboxClientFilters
} from '@/lib/checker-inbox/client-filters';
import {
  auditTrailResultVariant,
  formatAuditTrailDateTime,
  formatAuditTrailFilterLabel
} from '@/lib/fineract/audit-trail-display';
import { checkerInboxDetailPath } from '@/lib/fineract/checker-inbox-paths';
import {
  findWorkflowTaskPermission,
  formatWorkflowTaskPrimaryLabel
} from '@/lib/fineract/approval-workflow-display';
import { resolveWorkflowStageLabel } from '@/lib/checker-inbox/workflow-stage-progress';

export function CheckerInboxTable({
  items,
  filters,
  taskPermissions = [],
  approvalWorkflowsEnabled = false,
  onSelectedItemsChange,
  toolbar
}: {
  items: CheckerInboxEnrichedItem[];
  filters: CheckerInboxClientFilters;
  taskPermissions?: FineractRolePermissionUsage[];
  approvalWorkflowsEnabled?: boolean;
  onSelectedItemsChange?: (items: CheckerInboxEnrichedItem[]) => void;
  toolbar?: ReactNode;
}) {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 25 });
  const [reviewItem, setReviewItem] = useState<CheckerInboxEnrichedItem | null>(null);

  const filteredItems = useMemo(
    () => applyCheckerInboxClientFilters(items, filters),
    [items, filters]
  );
  const activeFilterCount = countActiveCheckerInboxClientFilters(filters);

  const selectedItems = useMemo(
    () =>
      Object.entries(rowSelection)
        .filter(([, selected]) => selected)
        .map(([id]) => filteredItems.find((item) => String(item.id) === id))
        .filter((item): item is CheckerInboxEnrichedItem => item != null),
    [filteredItems, rowSelection]
  );

  useEffect(() => {
    onSelectedItemsChange?.(selectedItems);
  }, [onSelectedItemsChange, selectedItems]);

  useEffect(() => {
    setRowSelection({});
    setPagination((current) => ({ ...current, pageIndex: 0 }));
  }, [filters, items]);

  const columns = useMemo<ColumnDef<CheckerInboxEnrichedItem>[]>(
    () => [
      {
        id: 'select',
        header: () => null,
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(value === true)}
            onClick={(event) => event.stopPropagation()}
            aria-label={`Select checker item ${row.original.id}`}
          />
        ),
        enableSorting: false
      },
      {
        accessorKey: 'id',
        header: 'ID',
        cell: ({ row }) => (
          <Link
            href={checkerInboxDetailPath(row.original.id)}
            className="font-medium tabular-nums text-primary hover:underline"
            onClick={(event) => event.stopPropagation()}
          >
            {row.original.id}
          </Link>
        )
      },
      {
        id: 'subject',
        header: 'Subject',
        cell: ({ row }) => {
          const { context } = row.original;
          const label = context.subjectLabel ?? row.original.entityName ?? '—';
          if (context.href) {
            return (
              <Link
                href={context.href}
                className="font-medium text-primary hover:underline"
                onClick={(event) => event.stopPropagation()}
              >
                {label}
              </Link>
            );
          }
          return <span className="font-medium">{label}</span>;
        }
      },
      {
        id: 'customer',
        header: 'Customer',
        cell: ({ row }) => row.original.context.customerName ?? '—'
      },
      {
        id: 'task',
        header: 'Task',
        cell: ({ row }) => {
          const code = row.original.context.taskPermissionCode;
          if (!code) {
            return '—';
          }
          const permission = findWorkflowTaskPermission(taskPermissions, code);
          const label = permission ? formatWorkflowTaskPrimaryLabel(permission) : code;
          return <Badge variant="secondary">{label}</Badge>;
        }
      },
      {
        id: 'review',
        header: 'Review',
        cell: ({ row }) => {
          const { context } = row.original;
          if (!checkerInboxHasReviewDetails(context)) {
            return '—';
          }

          const detailCount = checkerInboxReviewDetailCount(context);

          return (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 gap-1.5"
              onClick={(event) => {
                event.stopPropagation();
                setReviewItem(row.original);
              }}
            >
              <PanelRightOpen className="size-3.5" />
              Details
              {detailCount > 0 ? (
                <Badge variant="secondary" className="h-5 min-w-5 px-1.5 tabular-nums">
                  {detailCount}
                </Badge>
              ) : null}
              {context.matchedWorkflow ? (
                <Badge variant="outline" className="h-5 px-1.5">
                  Workflow
                </Badge>
              ) : null}
            </Button>
          );
        }
      },
      {
        accessorKey: 'actionName',
        header: 'Action',
        cell: ({ row }) =>
          row.original.actionName ? (
            <Badge variant="outline">{formatAuditTrailFilterLabel(row.original.actionName)}</Badge>
          ) : (
            '—'
          )
      },
      {
        accessorKey: 'processingResult',
        header: 'Status',
        cell: ({ row }) => {
          const { context } = row.original;
          const showWorkflowSubtitle =
            approvalWorkflowsEnabled && Boolean(context.matchedWorkflow);

          return (
            <div className="space-y-1">
              {row.original.processingResult ? (
                <Badge variant={auditTrailResultVariant(row.original.processingResult)}>
                  {formatAuditTrailFilterLabel(row.original.processingResult)}
                </Badge>
              ) : (
                '—'
              )}
              {showWorkflowSubtitle ? (
                <p className="text-xs text-muted-foreground">
                  {context.workflowInstance?.status === 'IN_PROGRESS' &&
                  context.matchedWorkflow &&
                  context.workflowInstance.currentStageCode
                    ? `At stage: ${resolveWorkflowStageLabel(
                        context.matchedWorkflow.definition,
                        context.workflowInstance.currentStageCode
                      )}`
                    : 'Multi-stage workflow'}
                </p>
              ) : null}
            </div>
          );
        }
      },
      {
        accessorKey: 'maker',
        header: 'User',
        cell: ({ row }) => row.original.maker ?? '—'
      },
      {
        id: 'madeOnDate',
        header: 'Made on date',
        cell: ({ row }) => formatAuditTrailDateTime(row.original.madeOnDate)
      },
      {
        accessorKey: 'officeName',
        header: 'Branch',
        cell: ({ row }) => row.original.officeName ?? '—'
      }
    ],
    [approvalWorkflowsEnabled, taskPermissions]
  );

  const table = useReactTable({
    data: filteredItems,
    columns,
    state: {
      rowSelection,
      pagination
    },
    enableMultiRowSelection: false,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    getRowId: (row) => String(row.id),
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  });

  return (
    <div className="space-y-4">
      {toolbar ? (
        <div className="flex flex-wrap items-center justify-end gap-2">{toolbar}</div>
      ) : null}
      <DataTable
        table={table}
        emptyMessage={
          activeFilterCount > 0
            ? 'No items match the current filters'
            : 'No checker inbox data available'
        }
        emptyDescription={
          activeFilterCount > 0
            ? 'Try clearing or adjusting the filters.'
            : 'There are no pending maker-checker items for this account.'
        }
      />
      <DataTablePagination table={table} totalRecords={filteredItems.length} />
      <CheckerInboxReviewSheet
        item={reviewItem}
        context={reviewItem?.context ?? null}
        taskPermissions={taskPermissions}
        open={reviewItem != null}
        onOpenChange={(open) => {
          if (!open) {
            setReviewItem(null);
          }
        }}
      />
    </div>
  );
}
