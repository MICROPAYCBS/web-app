'use client';

/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Plus, Trash2 } from 'lucide-react';
import { useMemo } from 'react';
import { SelectField } from '@/components/composites/select-field';
import { TextField } from '@/components/composites/text-field';
import { Button } from '@/components/ui/button';
import {
  buildLinearWorkflowTransitions,
  workflowStageCodeSelectOptions
} from '@/lib/fineract/approval-workflow-display';
import type { WorkflowStepProps } from '../types';

export function TransitionsStep({ draft, errors, disabled, onChange }: WorkflowStepProps) {
  const stageSelectOptions = useMemo(
    () => workflowStageCodeSelectOptions(draft.stages),
    [draft.stages]
  );
  const stageCodes = draft.stages.map((stage) => stage.stageCode.trim()).filter(Boolean);
  const stageCount = stageCodes.length;
  const needsTransitions = stageCount >= 2;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>
            Transitions connect the intermediate stages you defined earlier. Creation (maker) and
            final approval (checker) are runtime bookends — they are not stored here.
          </p>
          {needsTransitions ? (
            <p>
              With {stageCount} stages, the backend requires transitions so exactly one stage is
              the entry point and every stage is reachable.
            </p>
          ) : (
            <p>
              With a single stage, no transitions are required — the flow is maker → stage →
              checker.
            </p>
          )}
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          {needsTransitions ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={disabled}
              onClick={() =>
                onChange({
                  transitions: buildLinearWorkflowTransitions(draft.stages)
                })
              }
            >
              Connect in order
            </Button>
          ) : null}
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled || stageCount < 2}
            onClick={() =>
              onChange({
                transitions: [
                  ...draft.transitions,
                  {
                    fromStageCode: stageCodes[0] ?? '',
                    toStageCode: stageCodes[1] ?? '',
                    sequenceNo: draft.transitions.length + 1
                  }
                ]
              })
            }
          >
            <Plus className="mr-1 size-4" />
            Add transition
          </Button>
        </div>
      </div>

      {errors.transitions ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {errors.transitions}
        </p>
      ) : null}

      {draft.transitions.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
          {needsTransitions
            ? 'No transitions yet. Use “Connect in order” for a simple chain, or add transitions manually.'
            : 'No transitions needed for a single-stage workflow.'}
        </p>
      ) : (
        <div className="space-y-3">
          {draft.transitions.map((transition, transitionIndex) => (
            <div
              key={transitionIndex}
              className="grid gap-3 rounded-lg border border-border p-4 md:grid-cols-4"
            >
              <SelectField
                id={`transition-${transitionIndex}-from`}
                label="From"
                value={transition.fromStageCode}
                onValueChange={(value) => {
                  if (!value) {
                    return;
                  }
                  onChange({
                    transitions: draft.transitions.map((item, index) =>
                      index === transitionIndex ? { ...item, fromStageCode: value } : item
                    )
                  });
                }}
                options={stageSelectOptions}
                disabled={disabled}
                error={errors[`transitions.${transitionIndex}.fromStageCode`]}
              />
              <SelectField
                id={`transition-${transitionIndex}-to`}
                label="To"
                value={transition.toStageCode}
                onValueChange={(value) => {
                  if (!value) {
                    return;
                  }
                  onChange({
                    transitions: draft.transitions.map((item, index) =>
                      index === transitionIndex ? { ...item, toStageCode: value } : item
                    )
                  });
                }}
                options={stageSelectOptions}
                disabled={disabled}
                error={errors[`transitions.${transitionIndex}.toStageCode`]}
              />
              <TextField
                label="Sequence"
                type="number"
                value={String(transition.sequenceNo)}
                onChange={(value) =>
                  onChange({
                    transitions: draft.transitions.map((item, index) =>
                      index === transitionIndex
                        ? { ...item, sequenceNo: Number(value) || 1 }
                        : item
                    )
                  })
                }
                disabled={disabled}
                error={errors[`transitions.${transitionIndex}.sequenceNo`]}
              />
              <div className="flex items-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={disabled}
                  onClick={() =>
                    onChange({
                      transitions: draft.transitions.filter((_, index) => index !== transitionIndex)
                    })
                  }
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
