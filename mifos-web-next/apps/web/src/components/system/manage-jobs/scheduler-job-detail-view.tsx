'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractSchedulerJob } from '@mifos/api-client';
import { History, Pencil } from 'lucide-react';
import Link from 'next/link';
import {
  DetailBackLink,
  DetailField,
  DetailFieldGrid,
  DetailHeader,
  DetailPage
} from '@/components/composites';
import { buttonVariants } from '@/components/ui/button';
import { formatJobDateTime, yesNoLabel } from '@/lib/fineract/jobs-display';
import { cn } from '@/lib/utils';

export function SchedulerJobDetailView({
  job,
  canUpdate
}: {
  job: FineractSchedulerJob;
  canUpdate: boolean;
}) {
  const basePath = `/system/manage-jobs/${job.jobId}`;

  return (
    <DetailPage
      header={
        <DetailHeader
          backLink={<DetailBackLink href="/system/manage-jobs" label="Back to manage jobs" />}
          title={job.displayName}
          meta={`Job ID ${job.jobId}`}
          actions={
            <div className="flex flex-wrap gap-2">
              {canUpdate ? (
                <Link href={`${basePath}/edit`} className={cn(buttonVariants())}>
                  <Pencil className="mr-2 size-4" />
                  Edit
                </Link>
              ) : null}
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
          <DetailField label="Cron expression">{job.cronExpression}</DetailField>
          <DetailField label="Active">{yesNoLabel(job.active)}</DetailField>
          <DetailField label="Currently running">{yesNoLabel(job.currentlyRunning)}</DetailField>
          <DetailField label="Next run">{formatJobDateTime(job.nextRunTime)}</DetailField>
          <DetailField label="Previous run">
            {formatJobDateTime(job.lastRunHistory?.jobRunStartTime)}
          </DetailField>
          <DetailField label="Previous status">{job.lastRunHistory?.status ?? '—'}</DetailField>
        </DetailFieldGrid>
      }
    >
      <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
        Use a cron expression builder to draft schedules, then paste the expression here when editing
        this job.
      </div>
    </DetailPage>
  );
}
