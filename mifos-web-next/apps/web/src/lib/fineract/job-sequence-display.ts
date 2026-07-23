/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  FineractJobSequenceStep,
  FineractSchedulerJob,
  JobSequenceRunStatus
} from '@mifos/api-client';

export function jobSequenceStepTargetLabel(
  step: Pick<FineractJobSequenceStep, 'stepType' | 'jobShortName' | 'operationCode'>,
  jobsByShortName?: Map<string, FineractSchedulerJob>
): string {
  if (step.stepType === 'OPERATION') {
    return step.operationCode ?? '—';
  }
  const shortName = step.jobShortName?.trim();
  if (!shortName) {
    return '—';
  }
  const job = jobsByShortName?.get(shortName);
  if (job?.displayName) {
    return `${job.displayName} (${shortName})`;
  }
  return shortName;
}

export function jobSequenceStepTypeLabel(stepType: FineractJobSequenceStep['stepType']): string {
  return stepType === 'OPERATION' ? 'Operation' : 'Scheduler job';
}

export function jobSequenceRunStatusVariant(
  status: JobSequenceRunStatus
): 'default' | 'secondary' | 'outline' | 'destructive' {
  switch (status) {
    case 'COMPLETED':
      return 'default';
    case 'RUNNING':
      return 'secondary';
    case 'SKIPPED':
      return 'outline';
    case 'FAILED':
    case 'CANCELLED':
      return 'destructive';
    default:
      return 'outline';
  }
}

/** User-facing label for run / step status badges. */
export function jobSequenceRunStatusLabel(status: JobSequenceRunStatus): string {
  switch (status) {
    case 'SKIPPED':
      return 'Skipped, inactive';
    default:
      return status;
  }
}

export function isSchedulerJobInactive(
  shortName: string | null | undefined,
  jobs: FineractSchedulerJob[]
): boolean {
  const key = shortName?.trim();
  if (!key) {
    return false;
  }
  const job = jobs.find((item) => item.shortName?.trim() === key);
  if (!job) {
    return true;
  }
  return job.active !== true;
}

export function formatJobSequenceTimestamp(value: string | null | undefined): string {
  if (!value?.trim()) {
    return '—';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date);
}

export function schedulerJobSelectOptions(jobs: FineractSchedulerJob[]) {
  return jobs
    .filter((job) => Boolean(job.shortName?.trim()))
    .map((job) => {
      const shortName = job.shortName!.trim();
      const base = `${job.displayName} (${shortName})`;
      return {
        value: shortName,
        label: job.active ? base : `${base} - inactive`,
        keywords: [job.displayName, shortName, String(job.jobId), job.active ? 'active' : 'inactive']
      };
    })
    .sort((a, b) => a.label.localeCompare(b.label));
}

export function buildJobsByShortName(
  jobs: FineractSchedulerJob[]
): Map<string, FineractSchedulerJob> {
  const map = new Map<string, FineractSchedulerJob>();
  for (const job of jobs) {
    if (job.shortName?.trim()) {
      map.set(job.shortName.trim(), job);
    }
  }
  return map;
}
