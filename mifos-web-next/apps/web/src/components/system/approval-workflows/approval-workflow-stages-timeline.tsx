'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { WorkflowDefinition, WorkflowStage } from '@mifos/api-client';
import { Badge } from '@/components/ui/badge';
import {
  WorkflowChainBookend,
  WorkflowChainConnector
} from '@/components/system/approval-workflows/workflow-chain-bookend';
import {
  buildWorkflowChain,
  formatWorkflowExpiry,
  workflowStageCheckerPermissionCode
} from '@/lib/fineract/approval-workflow-display';

function StageCard({
  stage,
  definition,
  stepNumber
}: {
  stage: WorkflowStage;
  definition: WorkflowDefinition;
  stepNumber: number;
}) {
  const checkerPermission = workflowStageCheckerPermissionCode(definition.taskPermissionCode);

  return (
    <div className="relative border-l-2 border-primary/30 pl-6 pb-8 last:pb-0">
      <div className="absolute -left-[9px] top-0 flex size-4 items-center justify-center rounded-full border-2 border-primary bg-background text-[10px] font-semibold text-primary">
        {stepNumber}
      </div>
      <div className="space-y-3 rounded-lg border border-border bg-card p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="font-medium">{stage.name || stage.stageCode}</p>
            <p className="text-sm text-muted-foreground">{stage.stageCode}</p>
          </div>
          <Badge variant="outline">{stage.stageType}</Badge>
        </div>

        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Required approvals</dt>
            <dd>{stage.requiredApprovals}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Rejection policy</dt>
            <dd>{stage.rejectionPolicy ?? '—'}</dd>
          </div>
          {stage.rejectionThreshold != null ? (
            <div>
              <dt className="text-muted-foreground">Rejection threshold</dt>
              <dd>{stage.rejectionThreshold}</dd>
            </div>
          ) : null}
          {formatWorkflowExpiry(stage) ? (
            <div>
              <dt className="text-muted-foreground">Expiry</dt>
              <dd>{formatWorkflowExpiry(stage)}</dd>
            </div>
          ) : null}
          {stage.escalationEnabled && stage.escalationTargetStageCode ? (
            <div className="sm:col-span-2">
              <dt className="text-muted-foreground">Escalation target</dt>
              <dd>{stage.escalationTargetStageCode}</dd>
            </div>
          ) : null}
          <div className="sm:col-span-2">
            <dt className="text-muted-foreground">Restricting role</dt>
            <dd>{stage.roleName?.trim() || (stage.roleId != null ? `Role #${stage.roleId}` : 'Any checker')}</dd>
          </div>
        </dl>

        <p className="text-sm text-muted-foreground">
          Actors need <span className="font-medium text-foreground">{checkerPermission}</span>
          {stage.roleName?.trim() || stage.roleId != null
            ? <> and the stage role{stage.roleName?.trim() ? <> (<span className="font-medium text-foreground">{stage.roleName}</span>)</> : null}</>
            : null}
          .
        </p>

        <div className="flex flex-wrap gap-2">
          {stage.actions.map((action) => (
            <Badge key={action} variant="secondary">
              {action}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ApprovalWorkflowStagesTimeline({
  definition,
  showIntro = true
}: {
  definition: WorkflowDefinition;
  /** When false, omit the section heading (parent DetailSection already provides it). */
  showIntro?: boolean;
}) {
  const chain = buildWorkflowChain(definition.stages, definition.transitions);
  const transitionsByFrom = new Map(
    definition.transitions.map((transition) => [transition.fromStageCode, transition])
  );

  return (
    <div className="space-y-6">
      {showIntro ? (
        <div>
          <h3 className="text-base font-semibold">Approval chain</h3>
          <p className="text-sm text-muted-foreground">
            The full path from maker creation through each configured workflow stage to the
            system checker step that completes the task.
          </p>
        </div>
      ) : null}

      <div>
        {chain.map((segment, chainIndex) => {
          const stepNumber = chainIndex + 1;
          const hasNext = chainIndex < chain.length - 1;
          const nextSegment = hasNext ? chain[chainIndex + 1] : null;

          if (segment.kind === 'bookend') {
            return (
              <div key={`bookend-${segment.position}`}>
                <WorkflowChainBookend position={segment.position} stepNumber={stepNumber} />
                {segment.position === 'start' && hasNext ? (
                  <div className="pb-2">
                    <WorkflowChainConnector />
                  </div>
                ) : null}
              </div>
            );
          }

          const transition = transitionsByFrom.get(segment.stage.stageCode);
          const showAutomaticConnector =
            hasNext && nextSegment?.kind === 'bookend' && nextSegment.position === 'end';

          return (
            <div key={segment.stage.stageCode}>
              <StageCard
                stage={segment.stage}
                definition={definition}
                stepNumber={stepNumber}
              />
              {transition ? (
                <div className="my-2 ml-6 text-xs text-muted-foreground">
                  Transition to {transition.toStageCode}
                </div>
              ) : showAutomaticConnector ? (
                <div className="pb-2">
                  <WorkflowChainConnector />
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      {definition.transitions.length > 0 ? (
        <div className="rounded-lg border border-border bg-muted/20 p-4">
          <h4 className="mb-3 text-sm font-medium">All transitions</h4>
          <ul className="space-y-2 text-sm">
            {definition.transitions.map((transition) => (
              <li key={`${transition.fromStageCode}-${transition.toStageCode}-${transition.sequenceNo}`}>
                {transition.fromStageCode} → {transition.toStageCode} (sequence {transition.sequenceNo})
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
