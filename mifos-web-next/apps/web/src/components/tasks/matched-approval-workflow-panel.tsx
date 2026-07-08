'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractRolePermissionUsage, WorkflowInstance } from '@mifos/api-client';
import { GitBranch } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import type { CheckerInboxMatchedWorkflow } from '@/lib/checker-inbox/checker-inbox-item-types';
import {
  buildWorkflowStageProgress,
  resolveWorkflowStageLabel,
  workflowStagePositionLabel
} from '@/lib/checker-inbox/workflow-stage-progress';
import {
  findWorkflowTaskPermission,
  formatWorkflowTaskPrimaryLabel
} from '@/lib/fineract/approval-workflow-display';
import { approvalWorkflowDetailPath } from '@/lib/fineract/approval-workflow-paths';
import { cn } from '@/lib/utils';

function formatTaskLabel(
  taskPermissionCode: string,
  permissions: FineractRolePermissionUsage[]
): string {
  const permission = findWorkflowTaskPermission(permissions, taskPermissionCode);
  return permission ? formatWorkflowTaskPrimaryLabel(permission) : taskPermissionCode;
}

function stageItemClassName(state: 'completed' | 'current' | 'upcoming'): string {
  switch (state) {
    case 'completed':
      return 'border-border bg-muted/40 text-muted-foreground';
    case 'current':
      return 'border-primary bg-primary/10 text-foreground ring-1 ring-primary/30';
    default:
      return 'border-border/60 bg-background text-muted-foreground';
  }
}

export function MatchedApprovalWorkflowPanel({
  matchedWorkflow,
  workflowInstance,
  taskPermissions = [],
  compact = false,
  showHeading = true,
  className
}: {
  matchedWorkflow: CheckerInboxMatchedWorkflow;
  workflowInstance?: WorkflowInstance | null;
  taskPermissions?: FineractRolePermissionUsage[];
  compact?: boolean;
  showHeading?: boolean;
  className?: string;
}) {
  const { definition, taskPermissionCode } = matchedWorkflow;
  const currentStageCode =
    workflowInstance?.status === 'IN_PROGRESS' ? workflowInstance.currentStageCode : undefined;
  const progress = buildWorkflowStageProgress(definition, currentStageCode);
  const currentStageLabel = currentStageCode
    ? resolveWorkflowStageLabel(definition, currentStageCode)
    : undefined;
  const positionLabel = currentStageCode
    ? workflowStagePositionLabel(definition, currentStageCode)
    : undefined;

  return (
    <section className={className}>
      <div className="flex items-start gap-2">
        <GitBranch className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
        <div className="min-w-0 flex-1 space-y-3">
          {currentStageLabel ? (
            <div className="rounded-md border border-primary/30 bg-primary/10 px-3 py-2.5">
              <p className="text-sm font-medium">You are acting at: {currentStageLabel}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {positionLabel ? `${positionLabel}. ` : ''}
                Use <span className="font-medium text-foreground">Approve</span> or{' '}
                <span className="font-medium text-foreground">Reject</span> above to record your
                decision for this stage.
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {showHeading ? <p className="text-sm font-medium">Approval workflow</p> : null}
              <p className="text-sm text-muted-foreground">
                {compact
                  ? 'In approval workflow — configured chain for this review.'
                  : 'In approval workflow. The configured chain below applies to this held command.'}
              </p>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={approvalWorkflowDetailPath(definition.id)}
              className="text-sm font-medium text-primary hover:underline"
            >
              {definition.name}
            </Link>
            <Badge variant="outline">{formatTaskLabel(taskPermissionCode, taskPermissions)}</Badge>
            <Badge variant="secondary">{definition.status}</Badge>
          </div>

          {progress.length > 0 ? (
            <ol className="flex flex-wrap items-center gap-2">
              {progress.map((segment) => (
                <li
                  key={segment.key}
                  className={cn(
                    'rounded-full border px-2.5 py-1 text-xs font-medium',
                    stageItemClassName(segment.state)
                  )}
                >
                  {segment.label}
                  {segment.state === 'current' ? (
                    <span className="sr-only"> (current stage)</span>
                  ) : null}
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-muted-foreground">No stages configured.</p>
          )}
        </div>
      </div>
    </section>
  );
}

export function ApprovalWorkflowNoMatchHint({
  taskPermissionCode,
  taskPermissions = [],
  className
}: {
  taskPermissionCode?: string;
  taskPermissions?: FineractRolePermissionUsage[];
  className?: string;
}) {
  if (!taskPermissionCode) {
    return null;
  }

  const taskLabel = formatTaskLabel(taskPermissionCode, taskPermissions);

  return (
    <p className={`text-sm text-muted-foreground ${className ?? ''}`.trim()}>
      Approval workflows are enabled, but no active workflow matches{' '}
      <span className="font-medium text-foreground">{taskLabel}</span>.
    </p>
  );
}
