'use client';

/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractJobSequence, FineractSchedulerJob } from '@mifos/api-client';
import { formatActionErrorMessage, type UpsertJobSequenceInput } from '@mifos/validation';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import {
  createJobSequenceAction,
  updateJobSequenceAction
} from '@/actions/job-sequences';
import { DetailBackLink } from '@/components/composites';
import { ListPage } from '@/components/composites/list-page';
import { SwitchField } from '@/components/composites/switch-field';
import { TextField } from '@/components/composites/text-field';
import {
  JobSequenceStepFormSheet,
  JobSequenceStepSummaryCard,
  emptyJobSequenceStep,
  type JobSequenceStepDraft
} from '@/components/system/job-sequences/job-sequence-step-form-sheet';
import { Button } from '@/components/ui/button';
import {
  JOB_SEQUENCES_LIST_PATH,
  jobSequenceDetailPath
} from '@/lib/fineract/job-sequence-paths';

type FormState = {
  name: string;
  description: string;
  active: boolean;
  steps: JobSequenceStepDraft[];
};

const FORM_ID = 'job-sequence-form';

function formFromSequence(sequence?: FineractJobSequence | null): FormState {
  if (!sequence) {
    return {
      name: '',
      description: '',
      active: true,
      steps: []
    };
  }
  return {
    name: sequence.name,
    description: sequence.description ?? '',
    active: sequence.active,
    steps: sequence.steps.map((step) => ({
      stepType: step.stepType,
      jobShortName: step.jobShortName ?? '',
      operationCode:
        step.operationCode === 'ADVANCE_BUSINESS_DATE' ? 'ADVANCE_BUSINESS_DATE' : '',
      enabled: step.enabled,
      stopOnFailure: step.stopOnFailure
    }))
  };
}

function toUpsertInput(form: FormState): UpsertJobSequenceInput {
  return {
    name: form.name,
    description: form.description,
    active: form.active,
    steps: form.steps.map((step, index) => {
      if (step.stepType === 'OPERATION') {
        return {
          stepOrder: index + 1,
          stepType: 'OPERATION' as const,
          operationCode: (step.operationCode || 'ADVANCE_BUSINESS_DATE') as
            | 'ADVANCE_BUSINESS_DATE',
          enabled: step.enabled,
          stopOnFailure: step.stopOnFailure
        };
      }
      return {
        stepOrder: index + 1,
        stepType: 'SCHEDULER_JOB' as const,
        jobShortName: step.jobShortName,
        enabled: step.enabled,
        stopOnFailure: step.stopOnFailure
      };
    })
  };
}

export function JobSequenceFormPageContent({
  mode,
  sequence,
  jobs
}: {
  mode: 'create' | 'edit';
  sequence?: FineractJobSequence | null;
  jobs: FineractSchedulerJob[];
}) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() => formFromSequence(sequence));
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  function patchForm(patch: Partial<FormState>) {
    setForm((current) => ({ ...current, ...patch }));
  }

  function moveStep(index: number, direction: -1 | 1) {
    setForm((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.steps.length) {
        return current;
      }
      const steps = [...current.steps];
      const [removed] = steps.splice(index, 1);
      steps.splice(target, 0, removed);
      return { ...current, steps };
    });
  }

  function openAddStep() {
    setEditingIndex(null);
    setSheetOpen(true);
  }

  function openEditStep(index: number) {
    setEditingIndex(index);
    setSheetOpen(true);
  }

  function handleSaveStep(step: JobSequenceStepDraft) {
    setForm((current) => {
      if (editingIndex == null) {
        return { ...current, steps: [...current.steps, step] };
      }
      const steps = [...current.steps];
      steps[editingIndex] = step;
      return { ...current, steps };
    });
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitError(null);
    setFieldErrors({});
    const payload = toUpsertInput(form);
    startTransition(async () => {
      const result =
        mode === 'create'
          ? await createJobSequenceAction(payload)
          : await updateJobSequenceAction(sequence!.id, payload);
      if (!result.ok) {
        setSubmitError(formatActionErrorMessage(result.message, result.fieldErrors));
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }
        toast.error(result.message);
        return;
      }
      toast.success(mode === 'create' ? 'Job sequence created.' : 'Job sequence updated.');
      const id = result.resourceId ?? sequence?.id;
      if (id != null) {
        router.push(jobSequenceDetailPath(id));
      } else {
        router.push(JOB_SEQUENCES_LIST_PATH);
      }
      router.refresh();
    });
  }

  const editingStep =
    editingIndex != null ? (form.steps[editingIndex] ?? emptyJobSequenceStep()) : undefined;

  return (
    <>
      <ListPage
        backLink={
          <DetailBackLink
            href={
              mode === 'edit' && sequence
                ? jobSequenceDetailPath(sequence.id)
                : JOB_SEQUENCES_LIST_PATH
            }
            label={mode === 'edit' ? 'Back to sequence' : 'Back to job sequences'}
          />
        }
        title={mode === 'create' ? 'Create job sequence' : `Edit ${sequence?.name ?? 'sequence'}`}
        description="Define an ordered list of scheduler jobs and platform operations. Step order is saved as 1…n on submit."
        actions={
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                router.push(
                  mode === 'edit' && sequence
                    ? jobSequenceDetailPath(sequence.id)
                    : JOB_SEQUENCES_LIST_PATH
                )
              }
            >
              Cancel
            </Button>
            <Button type="submit" form={FORM_ID} disabled={pending}>
              {pending ? 'Saving…' : mode === 'create' ? 'Create' : 'Save changes'}
            </Button>
          </div>
        }
      >
        {submitError ? (
          <p
            className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            role="alert"
          >
            {submitError}
          </p>
        ) : null}

        <form id={FORM_ID} className="space-y-8" onSubmit={handleSubmit}>
          <section className="space-y-4 rounded-lg border border-border p-4">
            <h2 className="text-sm font-medium">Basics</h2>
            <TextField
              label="Name"
              value={form.name}
              onChange={(value) => patchForm({ name: value })}
              error={fieldErrors.name}
              required
              hint="Unique, max 100 characters (e.g. END_OF_DAY)."
            />
            <TextField
              label="Description"
              value={form.description}
              onChange={(value) => patchForm({ description: value })}
              error={fieldErrors.description}
              optional
            />
            <SwitchField
              label="Active"
              description="Inactive sequences cannot be executed."
              checked={form.active}
              onCheckedChange={(checked) => patchForm({ active: checked })}
            />
          </section>

          <section className="space-y-4 rounded-lg border border-border p-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-medium">Steps</h2>
              <Button type="button" variant="outline" size="sm" onClick={openAddStep}>
                <Plus className="size-4" aria-hidden />
                Add step
              </Button>
            </div>
            {fieldErrors.steps ? (
              <p className="text-sm text-destructive">{fieldErrors.steps}</p>
            ) : null}

            {form.steps.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No steps yet. Use Add step to open the step editor.
              </p>
            ) : (
              <div className="space-y-3">
                {form.steps.map((step, index) => (
                  <JobSequenceStepSummaryCard
                    key={`step-${index}-${step.stepType}-${step.jobShortName || step.operationCode}`}
                    step={step}
                    stepIndex={index}
                    jobs={jobs}
                    hasErrors={Boolean(
                      fieldErrors[`steps.${index}.jobShortName`] ||
                        fieldErrors[`steps.${index}.operationCode`] ||
                        fieldErrors[`steps.${index}.stepOrder`]
                    )}
                    canRemove
                    canMoveUp={index > 0}
                    canMoveDown={index < form.steps.length - 1}
                    onEdit={() => openEditStep(index)}
                    onRemove={() =>
                      patchForm({
                        steps: form.steps.filter((_, i) => i !== index)
                      })
                    }
                    onMoveUp={() => moveStep(index, -1)}
                    onMoveDown={() => moveStep(index, 1)}
                  />
                ))}
              </div>
            )}
          </section>
        </form>
      </ListPage>

      <JobSequenceStepFormSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        step={editingStep}
        stepIndex={editingIndex ?? form.steps.length}
        jobs={jobs}
        onSave={handleSaveStep}
      />
    </>
  );
}
