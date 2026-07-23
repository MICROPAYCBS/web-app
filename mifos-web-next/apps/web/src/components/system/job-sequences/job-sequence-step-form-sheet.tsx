'use client';

/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractSchedulerJob } from '@mifos/api-client';
import { JOB_SEQUENCE_OPERATION_CODES } from '@mifos/validation';
import { useEffect, useMemo, useState } from 'react';
import { FormSheet } from '@/components/composites/form-sheet';
import { SelectField } from '@/components/composites/select-field';
import { SwitchField } from '@/components/composites/switch-field';
import { Badge } from '@/components/ui/badge';
import {
  isSchedulerJobInactive,
  jobSequenceStepTargetLabel,
  jobSequenceStepTypeLabel,
  schedulerJobSelectOptions
} from '@/lib/fineract/job-sequence-display';

export type JobSequenceStepDraft = {
  stepType: 'SCHEDULER_JOB' | 'OPERATION';
  jobShortName: string;
  operationCode: (typeof JOB_SEQUENCE_OPERATION_CODES)[number] | '';
  enabled: boolean;
  stopOnFailure: boolean;
};

export function emptyJobSequenceStep(): JobSequenceStepDraft {
  return {
    stepType: 'SCHEDULER_JOB',
    jobShortName: '',
    operationCode: '',
    enabled: true,
    stopOnFailure: true
  };
}

const STEP_FORM_ID = 'job-sequence-step-form';

export function JobSequenceStepFormSheet({
  open,
  onOpenChange,
  step,
  stepIndex,
  jobs,
  onSave
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Existing step when editing; undefined when adding. */
  step?: JobSequenceStepDraft;
  stepIndex: number;
  jobs: FineractSchedulerJob[];
  onSave: (step: JobSequenceStepDraft) => void;
}) {
  const isEdit = step != null;
  const [draft, setDraft] = useState<JobSequenceStepDraft>(() => step ?? emptyJobSequenceStep());
  const [error, setError] = useState<string | null>(null);

  const jobOptions = useMemo(() => schedulerJobSelectOptions(jobs), [jobs]);
  const operationOptions = JOB_SEQUENCE_OPERATION_CODES.map((code) => ({
    value: code,
    label: code
  }));

  useEffect(() => {
    if (!open) {
      return;
    }
    setDraft(step ?? emptyJobSequenceStep());
    setError(null);
  }, [open, step]);

  function patchDraft(patch: Partial<JobSequenceStepDraft>) {
    setDraft((current) => ({ ...current, ...patch }));
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (draft.stepType === 'SCHEDULER_JOB' && !draft.jobShortName.trim()) {
      setError('Select a scheduler job.');
      return;
    }
    if (draft.stepType === 'OPERATION' && !draft.operationCode) {
      setError('Select a platform operation.');
      return;
    }
    onSave(draft);
    onOpenChange(false);
  }

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? `Edit step ${stepIndex + 1}` : 'Add step'}
      description="Choose a scheduler job or platform operation for this sequence step."
      formId={STEP_FORM_ID}
      submitLabel={isEdit ? 'Save step' : 'Add step'}
      error={error}
      className="data-[side=right]:sm:max-w-lg"
    >
      <form id={STEP_FORM_ID} className="space-y-4" onSubmit={handleSubmit}>
        <SelectField
          label="Step type"
          value={draft.stepType}
          onValueChange={(value) =>
            patchDraft({
              stepType: (value as JobSequenceStepDraft['stepType']) ?? 'SCHEDULER_JOB',
              jobShortName: '',
              operationCode: value === 'OPERATION' ? 'ADVANCE_BUSINESS_DATE' : ''
            })
          }
          options={[
            { value: 'SCHEDULER_JOB', label: 'Scheduler job' },
            { value: 'OPERATION', label: 'Platform operation' }
          ]}
          required
        />
        {draft.stepType === 'SCHEDULER_JOB' ? (
          <>
            <SelectField
              label="Scheduler job"
              value={draft.jobShortName}
              onValueChange={(value) => patchDraft({ jobShortName: value ?? '' })}
              options={jobOptions}
              placeholder={
                jobOptions.length ? 'Select a job' : 'No jobs with short names available'
              }
              required
              emptyMessage="No scheduler jobs with a short name were returned. Check Manage jobs."
            />
            {isSchedulerJobInactive(draft.jobShortName, jobs) ? (
              <p className="text-sm text-muted-foreground" role="status">
                This job is inactive (or missing). At run time it will be skipped until you activate
                it under Manage jobs.
              </p>
            ) : null}
          </>
        ) : (
          <SelectField
            label="Operation"
            value={draft.operationCode}
            onValueChange={(value) =>
              patchDraft({
                operationCode: (value as JobSequenceStepDraft['operationCode']) ?? ''
              })
            }
            options={operationOptions}
            required
          />
        )}
        <SwitchField
          label="Enabled"
          checked={draft.enabled}
          onCheckedChange={(checked) => patchDraft({ enabled: checked })}
        />
        <SwitchField
          label="Stop on failure"
          description="When on, the sequence stops if this step fails."
          checked={draft.stopOnFailure}
          onCheckedChange={(checked) => patchDraft({ stopOnFailure: checked })}
        />
      </form>
    </FormSheet>
  );
}

export function JobSequenceStepSummaryCard({
  step,
  stepIndex,
  jobs,
  hasErrors,
  canRemove,
  onEdit,
  onRemove,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown
}: {
  step: JobSequenceStepDraft;
  stepIndex: number;
  jobs: FineractSchedulerJob[];
  hasErrors?: boolean;
  canRemove: boolean;
  onEdit: () => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}) {
  const jobsByShortName = useMemo(() => {
    const map = new Map<string, FineractSchedulerJob>();
    for (const job of jobs) {
      if (job.shortName?.trim()) {
        map.set(job.shortName.trim(), job);
      }
    }
    return map;
  }, [jobs]);

  const target = jobSequenceStepTargetLabel(step, jobsByShortName);

  return (
    <div
      className={`flex items-start gap-3 rounded-lg border bg-card px-4 py-3 ${
        hasErrors ? 'border-destructive/50' : 'border-border'
      }`}
    >
      <button
        type="button"
        onClick={onEdit}
        className="-m-1 flex min-w-0 flex-1 items-start gap-3 rounded-md p-1 text-left hover:bg-muted/40"
      >
        <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border border-primary/40 bg-background text-xs font-semibold text-primary">
          {stepIndex + 1}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{jobSequenceStepTypeLabel(step.stepType)}</Badge>
            <span className="truncate font-medium">{target}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            {step.enabled ? 'Enabled' : 'Disabled'}
            {' · '}
            {step.stopOnFailure ? 'Stop on failure' : 'Continue on failure'}
          </p>
          {step.stepType === 'SCHEDULER_JOB' &&
          isSchedulerJobInactive(step.jobShortName, jobs) ? (
            <p className="text-xs text-warning-foreground">
              Skipped at run time until activated in Manage jobs.
            </p>
          ) : null}
        </div>
      </button>
      <div className="flex shrink-0 flex-col gap-1">
        <button
          type="button"
          className="rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40"
          disabled={!canMoveUp}
          onClick={onMoveUp}
        >
          Up
        </button>
        <button
          type="button"
          className="rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40"
          disabled={!canMoveDown}
          onClick={onMoveDown}
        >
          Down
        </button>
        <button
          type="button"
          className="rounded-md px-2 py-1 text-xs text-primary hover:bg-muted"
          onClick={onEdit}
        >
          Edit
        </button>
        <button
          type="button"
          className="rounded-md px-2 py-1 text-xs text-destructive hover:bg-muted disabled:opacity-40"
          disabled={!canRemove}
          onClick={onRemove}
        >
          Remove
        </button>
      </div>
    </div>
  );
}
