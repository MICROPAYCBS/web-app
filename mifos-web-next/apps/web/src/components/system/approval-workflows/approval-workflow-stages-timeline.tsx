'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { WorkflowDefinition, WorkflowStage } from '@mifos/api-client';
import { formatMoney } from '@mifos/domain';
import { Badge } from '@/components/ui/badge';
import {
  formatWorkflowExpiry,
  orderedWorkflowStages,
  transitionAmountBandSummary
} from '@/lib/fineract/approval-workflow-display';
import { FINERACT_LOCALE } from '@/lib/fineract/dates';

function StageCard({
  stage,
  definition,
  stepNumber
}: {
  stage: WorkflowStage;
  definition: WorkflowDefinition;
  stepNumber: number;
}) {
  const currency = definition.currencyCode ?? 'USD';

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
        </dl>

        <div>
          <p className="mb-2 text-sm font-medium">Participants</p>
          {stage.participants.length ? (
            <ul className="space-y-1 text-sm">
              {stage.participants.map((participant) => (
                <li key={`${stage.stageCode}-${participant.roleId}-${participant.id ?? ''}`}>
                  {participant.roleName ?? `Role #${participant.roleId}`}
                  {participant.approvalLimitAmount != null ? (
                    <span className="text-muted-foreground">
                      {' '}
                      · limit{' '}
                      {formatMoney(
                        participant.approvalLimitAmount,
                        participant.approvalLimitCurrency ?? currency,
                        FINERACT_LOCALE
                      )}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No participants configured.</p>
          )}
        </div>

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
  definition
}: {
  definition: WorkflowDefinition;
}) {
  const orderedStages = orderedWorkflowStages(definition.stages, definition.transitions);
  const transitionsByFrom = new Map(
    definition.transitions.map((transition) => [transition.fromStageCode, transition])
  );

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold">Approval chain</h3>
        <p className="text-sm text-muted-foreground">
          Stages are shown in transition order from entry to completion.
        </p>
      </div>

      <div>
        {orderedStages.map((stage, index) => {
          const transition = transitionsByFrom.get(stage.stageCode);
          const band = transition ? transitionAmountBandSummary(transition, definition.currencyCode) : null;
          return (
            <div key={stage.stageCode}>
              <StageCard stage={stage} definition={definition} stepNumber={index + 1} />
              {transition ? (
                <div className="my-2 ml-6 text-xs text-muted-foreground">
                  Transition to {transition.toStageCode}
                  {band ? ` · ${band}` : null}
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
                {transitionAmountBandSummary(transition, definition.currencyCode)
                  ? ` · ${transitionAmountBandSummary(transition, definition.currencyCode)}`
                  : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
