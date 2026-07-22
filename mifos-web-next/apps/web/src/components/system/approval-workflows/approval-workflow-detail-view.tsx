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
import { Pencil, Power, PowerOff, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import {
  activateApprovalWorkflowAction,
  deactivateApprovalWorkflowAction,
  deleteApprovalWorkflowAction
} from '@/actions/approval-workflows';
import { ApprovalWorkflowStagesTimeline } from '@/components/system/approval-workflows/approval-workflow-stages-timeline';
import {
  DetailBackLink,
  DetailField,
  DetailFieldGrid,
  DetailHeader,
  DetailPage,
  DetailSection
} from '@/components/composites';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  CONFIGURE_MC_TASKS_PATH,
  formatWorkflowTaskDisplay,
  isWorkflowActivationMcDisabledError,
  workflowDefinitionStatusLabel,
  workflowDefinitionStatusVariant
} from '@/lib/fineract/approval-workflow-display';
import {
  APPROVAL_WORKFLOWS_LIST_PATH,
  approvalWorkflowEditPath
} from '@/lib/fineract/approval-workflow-paths';
import { cn } from '@/lib/utils';

export function ApprovalWorkflowDetailView({
  definition,
  taskPermissions
}: {
  definition: WorkflowDefinition;
  taskPermissions: FineractRolePermissionUsage[];
}) {
  const router = useRouter();
  const canUpdate = useCan('UPDATE_WORKFLOW_DEFINITION');
  const canActivate = useCan('ACTIVATE_WORKFLOW_DEFINITION');
  const canDeactivate = useCan('DEACTIVATE_WORKFLOW_DEFINITION');
  const canDelete = useCan('DELETE_WORKFLOW_DEFINITION');
  const [pending, startTransition] = useTransition();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [activateErrorOpen, setActivateErrorOpen] = useState(false);
  const [activationError, setActivationError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const isDraft = definition.status === 'DRAFT';
  const isActive = definition.status === 'ACTIVE';
  const isInactive = definition.status === 'INACTIVE';
  const taskDisplay = formatWorkflowTaskDisplay(definition.taskPermissionCode, taskPermissions);

  function handleActivate() {
    setActionError(null);
    startTransition(() => {
      void activateApprovalWorkflowAction(definition.id).then((result) => {
        if (!result.ok) {
          if (result.activationError) {
            setActivationError(result.activationError);
            setActivateErrorOpen(true);
          } else {
            setActionError(result.message);
            toast.error(result.message);
          }
          return;
        }
        toast.success('Workflow activated.');
        router.refresh();
      });
    });
  }

  function handleDeactivate() {
    setActionError(null);
    startTransition(() => {
      void deactivateApprovalWorkflowAction(definition.id).then((result) => {
        if (!result.ok) {
          setActionError(result.message);
          toast.error(result.message);
          return;
        }
        toast.success('Workflow deactivated.');
        router.refresh();
      });
    });
  }

  function handleDelete() {
    setActionError(null);
    startTransition(() => {
      void deleteApprovalWorkflowAction(definition.id).then((result) => {
        if (!result.ok) {
          setActionError(result.message);
          toast.error(result.message);
          return;
        }
        setDeleteOpen(false);
        toast.success('Workflow deleted.');
        router.push(APPROVAL_WORKFLOWS_LIST_PATH);
        router.refresh();
      });
    });
  }

  return (
    <>
      <DetailPage
        header={
          <DetailHeader
            backLink={
              <DetailBackLink href={APPROVAL_WORKFLOWS_LIST_PATH} label="Back to approval workflows" />
            }
            title={definition.name}
            status={{
              label: workflowDefinitionStatusLabel(definition.status),
              variant: workflowDefinitionStatusVariant(definition.status)
            }}
            meta={
              <p>
                {taskDisplay.code}
                {taskDisplay.subtitle ? ` · ${taskDisplay.subtitle}` : ''} · priority{' '}
                {definition.priority ?? '—'}
              </p>
            }
            actions={
              <div className="flex flex-wrap gap-2">
                {canUpdate ? (
                  <Link
                    href={approvalWorkflowEditPath(definition.id)}
                    className={cn(buttonVariants({ size: 'sm' }))}
                  >
                    <Pencil className="mr-2 size-4" />
                    Edit
                  </Link>
                ) : null}
                {(isDraft || isInactive) && canActivate ? (
                  <Button type="button" size="sm" disabled={pending} onClick={handleActivate}>
                    <Power className="mr-2 size-4" />
                    Activate
                  </Button>
                ) : null}
                {isActive && canDeactivate ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={pending}
                    onClick={handleDeactivate}
                  >
                    <PowerOff className="mr-2 size-4" />
                    Deactivate
                  </Button>
                ) : null}
                {isDraft && canDelete ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    disabled={pending}
                    onClick={() => setDeleteOpen(true)}
                  >
                    <Trash2 className="mr-2 size-4" />
                    Delete
                  </Button>
                ) : null}
              </div>
            }
          />
        }
      >
        {actionError ? (
          <p className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {actionError}
          </p>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
          <DetailSection title="Overview">
            <DetailFieldGrid columns={1}>
              <DetailField label="Task">
                <div>
                  <p>{taskDisplay.code}</p>
                  {taskDisplay.subtitle ? (
                    <p className="text-sm text-muted-foreground">{taskDisplay.subtitle}</p>
                  ) : null}
                  <p className="mt-1 text-sm text-muted-foreground">
                    Actors need{' '}
                    <span className="font-medium text-foreground">
                      {taskDisplay.code.endsWith('_CHECKER')
                        ? taskDisplay.code
                        : `${taskDisplay.code}_CHECKER`}
                    </span>
                    .
                  </p>
                </div>
              </DetailField>
              <DetailField label="Priority">{definition.priority ?? '—'}</DetailField>
              <DetailField label="Description">{definition.description || '—'}</DetailField>
            </DetailFieldGrid>
          </DetailSection>

          <DetailSection
            title="Approval chain"
            description="The full path from maker creation through intermediate approvals to checker approval. Actors need the task checker permission; a stage role further narrows who may act."
          >
            <ApprovalWorkflowStagesTimeline definition={definition} showIntro={false} />
          </DetailSection>
        </div>
      </DetailPage>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete workflow?</DialogTitle>
            <DialogDescription>
              This permanently removes the draft workflow &quot;{definition.name}&quot;. This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" disabled={pending} onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={activateErrorOpen} onOpenChange={setActivateErrorOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Activation failed</DialogTitle>
            <DialogDescription className="space-y-3 whitespace-pre-wrap text-foreground">
              <span>{activationError}</span>
              {activationError && isWorkflowActivationMcDisabledError(activationError) ? (
                <span className="block text-sm text-muted-foreground">
                  Enable maker-checker for this task on{' '}
                  <Link
                    href={CONFIGURE_MC_TASKS_PATH}
                    className="font-medium text-primary underline-offset-4 hover:underline"
                  >
                    Configure maker-checker tasks
                  </Link>{' '}
                  before activating.
                </span>
              ) : null}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" onClick={() => setActivateErrorOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
