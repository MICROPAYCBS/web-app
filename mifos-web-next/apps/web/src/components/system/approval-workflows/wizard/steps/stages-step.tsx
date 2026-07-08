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
import type { WorkflowStageInput } from '@mifos/validation';
import type { WorkflowStepProps } from '../types';

export function StagesStep({
  draft,
  roles,
  currencies,
  errors,
  disabled,
  onChange
}: WorkflowStepProps) {
  function patchStage(stageIndex: number, stage: WorkflowStageInput) {
    onChange({
      stages: draft.stages.map((item, index) => (index === stageIndex ? stage : item))
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Configure intermediate approval stages between creation (maker) and final approval
          (checker).
        </p>
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
              roles={roles}
              currencies={currencies}
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
