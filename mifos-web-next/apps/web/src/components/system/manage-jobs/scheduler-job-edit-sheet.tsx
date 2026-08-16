'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractSchedulerJob } from '@mifos/api-client';
import { validateUpdateSchedulerJob } from '@mifos/validation';
import { useRouter } from 'next/navigation';
import { useEffect, useId, useState, useTransition } from 'react';
import { updateSchedulerJobAction } from '@/actions/jobs';
import { FormSheet } from '@/components/composites/form-sheet';
import { TextField } from '@/components/composites/text-field';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toastCommandOutcome, toastFineractError } from '@/lib/command-outcome-toast';

export function SchedulerJobEditSheet({
  job,
  open,
  onOpenChange
}: {
  job: FineractSchedulerJob;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const formId = useId();
  const [displayName, setDisplayName] = useState(job.displayName);
  const [description, setDescription] = useState(job.description ?? '');
  const [cronExpression, setCronExpression] = useState(job.cronExpression);
  const [active, setActive] = useState(job.active);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) {
      return;
    }
    setDisplayName(job.displayName);
    setDescription(job.description ?? '');
    setCronExpression(job.cronExpression);
    setActive(job.active);
    setFieldErrors({});
  }, [open, job]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = validateUpdateSchedulerJob({ displayName, description, cronExpression, active });
    if (!parsed.success) {
      const flattened = parsed.error.flatten().fieldErrors;
      const nextErrors: Record<string, string> = {};
      for (const [key, messages] of Object.entries(flattened)) {
        if (messages?.[0]) {
          nextErrors[key] = messages[0];
        }
      }
      setFieldErrors(nextErrors);
      return;
    }
    setFieldErrors({});
    startTransition(async () => {
      const result = await updateSchedulerJobAction(job.jobId, parsed.data);
      if (!result.ok) {
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }
        toastFineractError(result.message);
        return;
      }
      toastCommandOutcome(result, {
        completed: 'Scheduler job updated.',
        pending: 'Scheduler job update sent for approval.'
      });
      onOpenChange(false);
      router.refresh();
    });
  }

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title={`Edit ${job.displayName}`}
      description="Update the description, schedule, and activation state for this job."
      formId={formId}
      submitLabel="Save changes"
      submitLoading={pending}
      submitDisabled={pending}
    >
      <form id={formId} onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor={`${formId}-displayName`}>Job name</Label>
          <Input
            id={`${formId}-displayName`}
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            aria-invalid={Boolean(fieldErrors.displayName)}
          />
          {fieldErrors.displayName ? (
            <p className="text-sm text-destructive">{fieldErrors.displayName}</p>
          ) : null}
        </div>
        <TextField
          id={`${formId}-description`}
          label="Description"
          value={description}
          onChange={setDescription}
          error={fieldErrors.description}
          optional
          multiline
          rows={3}
          hint="What this job does. Max 500 characters."
        />
        <div className="space-y-2">
          <Label htmlFor={`${formId}-cronExpression`}>Cron expression</Label>
          <Input
            id={`${formId}-cronExpression`}
            value={cronExpression}
            onChange={(event) => setCronExpression(event.target.value)}
            aria-invalid={Boolean(fieldErrors.cronExpression)}
          />
          {fieldErrors.cronExpression ? (
            <p className="text-sm text-destructive">{fieldErrors.cronExpression}</p>
          ) : null}
          <p className="text-sm text-muted-foreground">
            Use a cron expression builder to draft schedules, then paste the expression here.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id={`${formId}-active`}
            checked={active}
            onCheckedChange={(checked) => setActive(checked === true)}
          />
          <Label htmlFor={`${formId}-active`}>Active job</Label>
        </div>
      </form>
    </FormSheet>
  );
}
