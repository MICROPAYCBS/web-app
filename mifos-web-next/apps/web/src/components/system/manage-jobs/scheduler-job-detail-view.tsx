'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractSchedulerJob } from '@mifos/api-client';
import { History, Pencil, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  DetailBackLink,
  DetailField,
  DetailFieldGrid,
  DetailHeader,
  DetailPage
} from '@/components/composites';
import { JobRunningStatus } from '@/components/system/manage-jobs/job-running-status';
import { SchedulerJobEditSheet } from '@/components/system/manage-jobs/scheduler-job-edit-sheet';
import { useSchedulerJobPolling } from '@/components/system/manage-jobs/use-scheduler-job-polling';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  describeJobCronExpression,
  formatJobDateTime,
  formatJobRunDuration,
  yesNoLabel
} from '@/lib/fineract/jobs-display';
import { cn } from '@/lib/utils';

export function SchedulerJobDetailView({
  job: initialJob,
  canUpdate
}: {
  job: FineractSchedulerJob;
  canUpdate: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { job } = useSchedulerJobPolling(initialJob);
  const editOpen = canUpdate && searchParams.get('edit') === '1';
  const basePath = `/system/manage-jobs/${job.jobId}`;

  function setEditOpen(open: boolean) {
    const params = new URLSearchParams(searchParams.toString());
    if (open && canUpdate) {
      params.set('edit', '1');
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      return;
    }
    params.delete('edit');
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  const cronSchedule = describeJobCronExpression(job.cronExpression);

  return (
    <>
      <DetailPage
        header={
          <DetailHeader
            backLink={<DetailBackLink href="/system/manage-jobs" label="Back to manage jobs" />}
            title={job.displayName}
            meta={`Job ID ${job.jobId}`}
            actions={
              <div className="flex flex-wrap gap-2">
                {canUpdate ? (
                  <Button type="button" onClick={() => setEditOpen(true)}>
                    <Pencil className="mr-2 size-4" />
                    Edit
                  </Button>
                ) : null}
                <Button type="button" variant="outline" onClick={() => router.refresh()}>
                  <RefreshCw className="mr-2 size-4" />
                  Refresh
                </Button>
                <Link href={`${basePath}/history`} className={cn(buttonVariants({ variant: 'outline' }))}>
                  <History className="mr-2 size-4" />
                  View history
                </Link>
              </div>
            }
          />
        }
        summary={
          <DetailFieldGrid columns={2}>
            <DetailField label="Description">{job.description?.trim() || '—'}</DetailField>
            <DetailField label="Schedule">
              <div className="space-y-1">
                <p>{cronSchedule ?? 'Could not interpret this cron expression.'}</p>
                <p className="font-mono text-sm text-muted-foreground">{job.cronExpression}</p>
              </div>
            </DetailField>
            <DetailField label="Active">{yesNoLabel(job.active)}</DetailField>
            <DetailField label="Currently running">
              <JobRunningStatus running={job.currentlyRunning} />
            </DetailField>
            <DetailField label="Next run">{formatJobDateTime(job.nextRunTime)}</DetailField>
            <DetailField label="Last run started">
              {formatJobDateTime(job.lastRunHistory?.jobRunStartTime)}
            </DetailField>
            <DetailField label="Last run ended">
              {formatJobDateTime(job.lastRunHistory?.jobRunEndTime)}
            </DetailField>
            <DetailField label="Last run duration">
              {formatJobRunDuration(job.lastRunHistory)}
            </DetailField>
            <DetailField label="Last run status">{job.lastRunHistory?.status ?? '—'}</DetailField>
          </DetailFieldGrid>
        }
      >
        <p className="text-sm text-muted-foreground">
          Next run and last run times reflect the server scheduler. Duration is calculated from the
          last run start and end times when both are available. Status updates automatically while
          the job is running.
        </p>
      </DetailPage>

      {canUpdate ? (
        <SchedulerJobEditSheet job={job} open={editOpen} onOpenChange={setEditOpen} />
      ) : null}
    </>
  );
}
