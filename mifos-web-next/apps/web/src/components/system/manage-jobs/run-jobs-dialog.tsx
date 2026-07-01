'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractSchedulerJob } from '@mifos/api-client';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { toastCommandOutcome } from '@/lib/command-outcome-toast';
import { toast } from 'sonner';
import { executeSchedulerJobsAction } from '@/actions/jobs';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';

export function RunJobsDialog({
  open,
  onOpenChange,
  jobs
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobs: FineractSchedulerJob[];
}) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<number[]>(jobs.map((job) => job.jobId));
  const [pending, startTransition] = useTransition();

  function toggleJob(jobId: number, checked: boolean) {
    setSelectedIds((current) =>
      checked ? [...current, jobId] : current.filter((id) => id !== jobId)
    );
  }

  function handleRun() {
    const selectedJobs = jobs.filter((job) => selectedIds.includes(job.jobId));
    if (!selectedJobs.length) {
      toast.error('Select at least one job to run.');
      return;
    }
    startTransition(async () => {
      const result = await executeSchedulerJobsAction(
        selectedJobs.map((job) => ({ jobId: job.jobId }))
      );
      if (!result.ok) {

        toast.error(result.message);
        return;
      }
      toastCommandOutcome(result, { completed: 'Selected jobs started.', pending: 'Selected jobs started sent for approval.' });
      onOpenChange(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Run selected jobs</DialogTitle>
          <DialogDescription>Confirm which jobs to execute now.</DialogDescription>
        </DialogHeader>
        <ul className="space-y-3">
          {jobs.map((job) => (
            <li key={job.jobId} className="flex items-center gap-3">
              <Checkbox
                checked={selectedIds.includes(job.jobId)}
                onCheckedChange={(checked) => toggleJob(job.jobId, checked === true)}
              />
              <span className="text-sm">{job.displayName}</span>
            </li>
          ))}
        </ul>
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
