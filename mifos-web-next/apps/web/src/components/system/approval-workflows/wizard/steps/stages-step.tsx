'use client';

/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Plus } from 'lucide-react';
import { useState } from 'react';
import {
  StageFormSheet,
  StageSummaryCard,
  stageHasFieldErrors
} from '@/components/system/approval-workflows/approval-workflow-stage-editor';
import {
  WorkflowChainBookend,
  WorkflowChainConnector
} from '@/components/system/approval-workflows/workflow-chain-bookend';
import { Button } from '@/components/ui/button';
import { workflowStageCheckerPermissionCode } from '@/lib/fineract/approval-workflow-display';
import type { WorkflowStageInput } from '@mifos/validation';
import type { WorkflowStepProps } from '../types';

type SheetState = { mode: 'add' } | { mode: 'edit'; index: number } | null;

export function StagesStep({
  draft,
  roles,
  errors,
  disabled,
  onChange
}: WorkflowStepProps) {
  const checkerPermission = workflowStageCheckerPermissionCode(draft.taskPermissionCode);
  const [sheet, setSheet] = useState<SheetState>(null);

  function handleSaveStage(stage: WorkflowStageInput) {
    if (sheet?.mode === 'edit') {
      const index = sheet.index;
      onChange({
        stages: draft.stages.map((item, itemIndex) => (itemIndex === index ? stage : item))
      });
      return;
    }
    onChange({ stages: [...draft.stages, stage] });
  }

  function handleRemoveStage(stageIndex: number) {
    onChange({ stages: draft.stages.filter((_, index) => index !== stageIndex) });
  }

  const editingStage =
    sheet?.mode === 'edit' ? draft.stages[sheet.index] : undefined;
  const editingIndex = sheet?.mode === 'edit' ? sheet.index : draft.stages.length;
  const otherStages =
    sheet?.mode === 'edit'
      ? draft.stages.filter((_, index) => index !== sheet.index)
      : draft.stages;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Configure intermediate approval stages between creation (maker) and final approval
            (checker). Optionally assign a role on each stage to narrow who may act there.
          </p>
          <p className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
            Actors at every stage need{' '}
            <span className="font-medium text-foreground">
              {checkerPermission || '{task}_CHECKER'}
            </span>
            . When a stage has a restricting role, they must hold that role as well.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={() => setSheet({ mode: 'add' })}
        >
          <Plus className="mr-1 size-4" />
          Add stage
        </Button>
      </div>
      {errors.stages ? <p className="text-sm text-destructive">{errors.stages}</p> : null}
      <div className="space-y-3">
        <WorkflowChainBookend position="start" connectorBelow />
        {draft.stages.map((stage, stageIndex) => (
          <div key={stageIndex} className="space-y-3">
            <StageSummaryCard
              stage={stage}
              stageIndex={stageIndex}
              roles={roles}
              hasErrors={stageHasFieldErrors(stageIndex, errors)}
              disabled={disabled ?? false}
              onEdit={() => setSheet({ mode: 'edit', index: stageIndex })}
              onRemove={() => handleRemoveStage(stageIndex)}
              canRemove={draft.stages.length > 1}
            />
            {stageIndex < draft.stages.length - 1 ? null : <WorkflowChainConnector />}
          </div>
        ))}
        <WorkflowChainBookend position="end" />
      </div>

      <StageFormSheet
        open={sheet != null}
        onOpenChange={(open) => {
          if (!open) {
            setSheet(null);
          }
        }}
        stage={editingStage}
        stageIndex={editingIndex}
        otherStages={otherStages}
        roles={roles}
        taskPermissionCode={draft.taskPermissionCode}
        submitLoading={disabled}
        onSave={handleSaveStage}
      />
    </div>
  );
}
