'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractRolePermissionUsage, WorkflowDefinition } from '@mifos/api-client';
import { useCan } from '@mifos/auth';
import { formatActionErrorMessage } from '@mifos/validation';
import {
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
  type PaginationState
} from '@tanstack/react-table';
import { Pencil, Power, PowerOff, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { useEffect, useMemo, useState, useTransition } from 'react';
import { toast } from 'sonner';
import {
  activateApprovalWorkflowAction,
  deactivateApprovalWorkflowAction,
  deleteApprovalWorkflowAction
} from '@/actions/approval-workflows';
import { DataTable } from '@/components/composites/data-table/data-table';
import { DataTablePagination } from '@/components/composites/data-table/data-table-pagination';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  findActiveWorkflowPeer,
  formatWorkflowTaskDisplay,
  getWorkflowActivateBlockReason,
  workflowActivateBlockHint,
  workflowDefinitionStatusLabel,
  workflowDefinitionStatusVariant
} from '@/lib/fineract/approval-workflow-display';
import {
  approvalWorkflowDetailPath,
  approvalWorkflowEditPath
} from '@/lib/fineract/approval-workflow-paths';
import {
  filterApprovalWorkflowDefinitions,
  type ApprovalWorkflowListFilters
} from '@/lib/fineract/approval-workflow-list-query';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function ApprovalWorkflowsTable({
  definitions,
  appliedFilters,
  taskPermissions,
  makerCheckerGloballyEnabled = null,
  filterTrigger
}: {
  definitions: WorkflowDefinition[];
  appliedFilters: ApprovalWorkflowListFilters;
  taskPermissions: FineractRolePermissionUsage[];
  makerCheckerGloballyEnabled?: boolean | null;
  filterTrigger?: ReactNode;
}) {
  const router = useRouter();
  const canUpdate = useCan('UPDATE_WORKFLOW_DEFINITION');
  const canDelete = useCan('DELETE_WORKFLOW_DEFINITION');
  const canActivate = useCan('ACTIVATE_WORKFLOW_DEFINITION');
  const canDeactivate = useCan('DEACTIVATE_WORKFLOW_DEFINITION');
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25
  });
  const [deleteTarget, setDeleteTarget] = useState<WorkflowDefinition | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const showActions = canUpdate || canDelete || canActivate || canDeactivate;

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
        id: 'stages',
        header: 'Stages',
        cell: ({ row }) => row.original.stages.length
      },
      ...(showActions
        ? [
            {
              id: 'actions',
              header: 'Actions',
              meta: { sticky: 'right' },
              cell: ({ row }) => {
                const status = row.original.status;
                const isDraft = status === 'DRAFT';
                const isActive = status === 'ACTIVE';
                const isInactive = status === 'INACTIVE';
                const canShowActivate = (isDraft || isInactive) && canActivate;
                const activePeer = findActiveWorkflowPeer(
                  definitions,
                  row.original.taskPermissionCode,
                  row.original.id
                );
                const activateBlockReason = getWorkflowActivateBlockReason({
                  makerCheckerGloballyEnabled,
                  taskPermissionCode: row.original.taskPermissionCode,
                  taskPermissions,
                  definitions,
                  definitionId: row.original.id
                });
                const activateBlocked = activateBlockReason != null;
                const activateHint = workflowActivateBlockHint(
                  activateBlockReason,
                  activePeer?.name
                );
                const hasRowActions =
                  canUpdate ||
                  (isDraft && canDelete) ||
                  (isActive && canDeactivate) ||
                  canShowActivate;
                if (!hasRowActions) {
                  return null;
                }
                return (
                  <div className="flex items-center gap-1">
                    {canUpdate ? (
                      <Link
                        href={approvalWorkflowEditPath(row.original.id)}
                        className={cn(buttonVariants({ variant: 'ghost', size: 'icon-sm' }))}
                        aria-label={`Edit ${row.original.name}`}
                      >
                        <Pencil className="size-4" />
                      </Link>
                    ) : null}
                    {canShowActivate ? (
                      activateBlocked ? (
                        <Tooltip>
                          <TooltipTrigger
                            render={
                              <span className="inline-flex cursor-not-allowed" />
                            }
                          >
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              aria-label={`Activate ${row.original.name} (blocked)`}
                              disabled
                            >
                              <Power className="size-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="left" className="max-w-xs text-pretty">
                            {activateHint}
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Activate ${row.original.name}`}
                          disabled={pending}
                          onClick={() => {
                            startTransition(async () => {
                              const result = await activateApprovalWorkflowAction(row.original.id);
                              if (!result.ok) {
                                toast.error(result.message);
                                return;
                              }
                              toast.success('Workflow activated.');
                              router.refresh();
                            });
                          }}
                        >
                          <Power className="size-4" />
                        </Button>
                      )
                    ) : null}
                    {isActive && canDeactivate ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Deactivate ${row.original.name}`}
                        disabled={pending}
                        onClick={() => {
                          startTransition(async () => {
                            const result = await deactivateApprovalWorkflowAction(row.original.id);
                            if (!result.ok) {
                              toast.error(result.message);
                              return;
                            }
                            toast.success('Workflow deactivated.');
                            router.refresh();
                          });
                        }}
                      >
                        <PowerOff className="size-4" />
                      </Button>
                    ) : null}
                    {isDraft && canDelete ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="text-destructive hover:text-destructive"
                        aria-label={`Delete ${row.original.name}`}
                        onClick={() => {
                          setActionError(null);
                          setDeleteTarget(row.original);
                        }}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    ) : null}
                  </div>
                );
              }
            } satisfies ColumnDef<WorkflowDefinition>
          ]
        : [])
    ],
    [
      canActivate,
      canDeactivate,
      canDelete,
      canUpdate,
      makerCheckerGloballyEnabled,
      pending,
      router,
      showActions,
      taskPermissions
    ]
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
      const result = await deleteApprovalWorkflowAction(deleteTarget.id);
      if (!result.ok) {
        setActionError(formatActionErrorMessage(result.message, result.fieldErrors));
        toast.error(result.message);
        return;
      }
      setDeleteTarget(null);
      toast.success('Workflow deleted.');
      router.refresh();
    });
  }

  return (
    <TooltipProvider>
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

      <Dialog
        open={deleteTarget != null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
            setActionError(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete workflow?</DialogTitle>
            <DialogDescription>
              This permanently removes the draft workflow &quot;{deleteTarget?.name}&quot;. This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {actionError ? (
            <p className="text-sm text-destructive whitespace-pre-wrap">{actionError}</p>
          ) : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => setDeleteTarget(null)}
            >
              Cancel
            </Button>
            <Button type="button" variant="destructive" disabled={pending} onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
