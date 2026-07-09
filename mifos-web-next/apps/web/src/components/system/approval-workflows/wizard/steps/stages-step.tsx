'use client';

/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { emptyStage, StageEditor } from '@/components/system/approval-workflows/approval-workflow-stage-editor';
import {
  WorkflowChainBookend,
  WorkflowChainConnector
} from '@/components/system/approval-workflows/workflow-chain-bookend';
import { workflowStageCheckerPermissionCode } from '@/lib/fineract/approval-workflow-display';
import type { WorkflowStageInput } from '@mifos/validation';
import type { WorkflowStepProps } from '../types';

export function StagesStep({
  draft,
  currencies,
  errors,
  disabled,
  onChange
}: WorkflowStepProps) {
  const checkerPermission = workflowStageCheckerPermissionCode(draft.taskPermissionCode);

  function patchStage(stageIndex: number, stage: WorkflowStageInput) {
    onChange({
      stages: draft.stages.map((item, index) => (index === stageIndex ? stage : item))
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Configure intermediate approval stages between creation (maker) and final approval
            (checker).
          </p>
          <p className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
            Actors at every stage need{' '}
            <span className="font-medium text-foreground">
              {checkerPermission || '{task}_CHECKER'}
            </span>
            . Grant that permission through roles in user administration — do not configure
            stage participants here.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={() => onChange({ stages: [...draft.stages, emptyStage(draft.stages.length)] })}
        >
          <Plus className="mr-1 size-4" />
          Add stage
        </Button>
      </div>
      {errors.stages ? <p className="text-sm text-destructive">{errors.stages}</p> : null}
      <div className="space-y-4">
        <WorkflowChainBookend position="start" connectorBelow />
        {draft.stages.map((stage, stageIndex) => (
          <div key={stageIndex} className="space-y-4">
            <StageEditor
              stage={stage}
              stageIndex={stageIndex}
              allStages={draft.stages}
              currencies={currencies}
              taskPermissionCode={draft.taskPermissionCode}
              disabled={disabled ?? false}
              fieldErrors={errors}
              onChange={(nextStage) => patchStage(stageIndex, nextStage)}
              onRemove={() =>
                onChange({ stages: draft.stages.filter((_, index) => index !== stageIndex) })
              }
              canRemove={draft.stages.length > 1}
            />
            {stageIndex < draft.stages.length - 1 ? null : <WorkflowChainConnector />}
          </div>
        ))}
        <WorkflowChainBookend position="end" />
      </div>
    </div>
  );
}
