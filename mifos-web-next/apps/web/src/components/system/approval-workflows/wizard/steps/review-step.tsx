'use client';

/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import {
  DetailField,
  DetailFieldGrid,
  DetailSection
} from '@/components/composites';
import { Badge } from '@/components/ui/badge';
import {
  buildWorkflowChain,
  findWorkflowTaskPermission,
  formatWorkflowTaskPrimaryLabel,
  formatWorkflowTaskOptionDescription,
  resolveWorkflowStageRoleName,
  workflowChainBookend
} from '@/lib/fineract/approval-workflow-display';
import type { WorkflowStepProps } from '../types';

export function ReviewStep({
  draft,
  taskPermissions,
  roles,
  mode = 'create',
  submitError
}: WorkflowStepProps & { mode?: 'create' | 'edit'; submitError: string | null }) {
  const task = findWorkflowTaskPermission(taskPermissions, draft.taskPermissionCode);
  const taskLabel = task
    ? formatWorkflowTaskPrimaryLabel(task)
    : draft.taskPermissionCode || '—';
  const taskDescription = task ? formatWorkflowTaskOptionDescription(task) : undefined;
  const chain = buildWorkflowChain(draft.stages, draft.transitions);

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        {mode === 'edit'
          ? 'Review your changes before saving. The workflow remains in draft status.'
          : 'Review the workflow before creating it. The definition will be saved in draft status.'}
      </p>

      {submitError ? (
        <p className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive whitespace-pre-wrap">
          {submitError}
        </p>
      ) : null}

      <DetailSection title="Task & basics">
        <DetailFieldGrid columns={2}>
          <DetailField label="Task">
            <span className="flex flex-wrap items-center gap-2">
              {taskLabel}
              {task?.actionName ? (
                <Badge variant="outline">{task.actionName}</Badge>
              ) : null}
            </span>
            {taskDescription ? (
              <span className="mt-1 block text-xs text-muted-foreground">{taskDescription}</span>
            ) : null}
          </DetailField>
          <DetailField label="Name">{draft.name || '—'}</DetailField>
          <DetailField label="Priority">{draft.priority ?? '—'}</DetailField>
          <DetailField label="Description">{draft.description?.trim() || '—'}</DetailField>
        </DetailFieldGrid>
      </DetailSection>

      <DetailSection title="Approval chain">
        <DetailFieldGrid columns={1}>
          <DetailField label="Intermediate stages">{draft.stages.length}</DetailField>
        </DetailFieldGrid>
        <ul className="mt-3 space-y-2 text-sm">
          {chain.map((segment, chainIndex) => {
            if (segment.kind === 'bookend') {
              const bookend = workflowChainBookend(segment.position);
              const previousSegment = chainIndex > 0 ? chain[chainIndex - 1] : null;
              const showAutomaticAbove =
                segment.position === 'end' && previousSegment?.kind === 'stage';

              return (
                <li key={`bookend-${segment.position}`}>
                  {showAutomaticAbove ? (
                    <p className="mb-2 text-xs text-muted-foreground">Automatic</p>
                  ) : null}
                  <div className="rounded-md border border-dashed border-border bg-muted/20 px-3 py-2">
                    <span className="font-medium">{bookend.title}</span>
                    <span className="text-muted-foreground"> · {bookend.subtitle}</span>
                    <Badge variant="secondary" className="ml-2">
                      System
                    </Badge>
                  </div>
                  {segment.position === 'start' && chainIndex < chain.length - 1 ? (
                    <p className="mt-2 text-xs text-muted-foreground">Automatic</p>
                  ) : null}
                </li>
              );
            }

            const stage = segment.stage;
            const roleName = resolveWorkflowStageRoleName(stage.roleId, roles);
            return (
              <li
                key={stage.stageCode}
                className="rounded-md border border-border px-3 py-2"
              >
                <span className="font-medium">{stage.name?.trim() || stage.stageCode}</span>
                <span className="text-muted-foreground">
                  {' '}
                  · Intermediate stage {segment.index + 1} · {stage.stageType}
                  {roleName ? ` · ${roleName}` : ' · Any checker'}
                </span>
              </li>
            );
          })}
        </ul>
      </DetailSection>

      <DetailSection title="Transitions">
        <DetailFieldGrid columns={1}>
          <DetailField label="Configured transitions">{draft.transitions.length}</DetailField>
        </DetailFieldGrid>
        {draft.transitions.length > 0 ? (
          <ul className="mt-3 space-y-2 text-sm">
            {draft.transitions.map((transition, index) => (
              <li
                key={`${transition.fromStageCode}-${transition.toStageCode}-${index}`}
                className="rounded-md border border-border px-3 py-2 text-muted-foreground"
              >
                {transition.fromStageCode} → {transition.toStageCode} (sequence{' '}
                {transition.sequenceNo})
              </li>
            ))}
          </ul>
        ) : null}
      </DetailSection>
    </div>
  );
}
