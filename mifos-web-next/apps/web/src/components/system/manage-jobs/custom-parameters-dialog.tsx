'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractSchedulerJob } from '@mifos/api-client';
import type { JobParameterInput } from '@mifos/validation';
import { Plus, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { toastCommandOutcome, toastFineractError } from '@/lib/command-outcome-toast';
import { toast } from 'sonner';
import { executeSchedulerJobsAction } from '@/actions/jobs';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type JobParametersState = Record<number, JobParameterInput[]>;

function emptyParameter(): JobParameterInput {
  return { parameterName: '', parameterValue: '' };
}

export function CustomParametersDialog({
  open,
  onOpenChange,
  jobs,
  onJobsStarted
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobs: FineractSchedulerJob[];
  onJobsStarted?: () => void;
}) {
  const router = useRouter();
  const [parameters, setParameters] = useState<JobParametersState>(() =>
    Object.fromEntries(jobs.map((job) => [job.jobId, [emptyParameter()]]))
  );
  const [pending, startTransition] = useTransition();

  function updateParameter(
    jobId: number,
    index: number,
    field: keyof JobParameterInput,
    value: string
  ) {
    setParameters((current) => {
      const rows = [...(current[jobId] ?? [emptyParameter()])];
      rows[index] = { ...rows[index], [field]: value };
      return { ...current, [jobId]: rows };
    });
  }

  function addParameter(jobId: number) {
    setParameters((current) => ({
      ...current,
      [jobId]: [...(current[jobId] ?? []), emptyParameter()]
    }));
  }

  function removeParameter(jobId: number, index: number) {
    setParameters((current) => {
      const rows = [...(current[jobId] ?? [])];
      rows.splice(index, 1);
      return { ...current, [jobId]: rows.length ? rows : [emptyParameter()] };
    });
  }

  function handleRun() {
    startTransition(async () => {
      const result = await executeSchedulerJobsAction(
        jobs.map((job) => ({
          jobId: job.jobId,
          jobParameters: (parameters[job.jobId] ?? []).filter(
            (row) => row.parameterName.trim() && row.parameterValue.trim()
          )
        }))
      );
      if (!result.ok) {

        toastFineractError(result.message);
        return;
      }
      toastCommandOutcome(result, { completed: 'Jobs started with custom parameters.', pending: 'Jobs started with custom parameters sent for approval.' });
      onOpenChange(false);
      onJobsStarted?.();
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Run with custom parameters</DialogTitle>
          <DialogDescription>Add parameter name/value pairs for each selected job.</DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          {jobs.map((job) => (
            <div key={job.jobId} className="space-y-3 rounded-lg border border-border p-4">
              <p className="text-sm font-medium">{job.displayName}</p>
              {(parameters[job.jobId] ?? [emptyParameter()]).map((row, index) => (
                <div key={`${job.jobId}-${index}`} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
                  <div className="space-y-1">
                    <Label htmlFor={`param-name-${job.jobId}-${index}`}>Parameter name</Label>
                    <Input
                      id={`param-name-${job.jobId}-${index}`}
                      value={row.parameterName}
                      onChange={(event) =>
                        updateParameter(job.jobId, index, 'parameterName', event.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={`param-value-${job.jobId}-${index}`}>Parameter value</Label>
                    <Input
                      id={`param-value-${job.jobId}-${index}`}
                      value={row.parameterValue}
                      onChange={(event) =>
                        updateParameter(job.jobId, index, 'parameterValue', event.target.value)
                      }
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeParameter(job.jobId, index)}
                      aria-label="Remove parameter"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={() => addParameter(job.jobId)}>
                <Plus className="mr-2 size-4" />
                Add parameter
              </Button>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancel
          </Button>
          <Button type="button" onClick={handleRun} disabled={pending}>
            Run jobs
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
