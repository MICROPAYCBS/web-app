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
import { useId, useState, useTransition } from 'react';
import { toastCommandOutcome, toastFineractError } from '@/lib/command-outcome-toast';
import { toast } from 'sonner';
import { updateSchedulerJobAction } from '@/actions/jobs';
import {
  DetailBackLink,
  DetailField,
  DetailFieldGrid,
  DetailHeader,
  DetailPage
} from '@/components/composites';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function SchedulerJobEditForm({ job }: { job: FineractSchedulerJob }) {
  const router = useRouter();
  const formId = useId();
  const [displayName, setDisplayName] = useState(job.displayName);
  const [cronExpression, setCronExpression] = useState(job.cronExpression);
  const [active, setActive] = useState(job.active);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = validateUpdateSchedulerJob({ displayName, cronExpression, active });
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
      toastCommandOutcome(result, { completed: 'Scheduler job updated.', pending: 'Scheduler job updated sent for approval.' });
      router.push(`/system/manage-jobs/${job.jobId}`);
      router.refresh();
    });
  }

  return (
    <DetailPage
      header={
        <DetailHeader
          backLink={
            <DetailBackLink
              href={`/system/manage-jobs/${job.jobId}`}
              label="Back to job details"
            />
          }
          title={`Edit ${job.displayName}`}
        />
      }
      summary={
        <DetailFieldGrid columns={2}>
          <DetailField label="Job ID">{job.jobId}</DetailField>
        </DetailFieldGrid>
      }
    >
      <form id={formId} onSubmit={handleSubmit} className="max-w-xl space-y-6">
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
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id={`${formId}-active`}
            checked={active}
            onCheckedChange={(checked) => setActive(checked === true)}
          />
          <Label htmlFor={`${formId}-active`}>Active job</Label>
        </div>
        <div className="flex gap-2">
          <Button type="submit" disabled={pending}>
            Save changes
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() => router.push(`/system/manage-jobs/${job.jobId}`)}
          >
            Cancel
          </Button>
        </div>
      </form>
    </DetailPage>
  );
}
