/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractSchedulerJob, FineractSchedulerJobRunHistory } from '@mifos/api-client';
import cronstrue from 'cronstrue';
import { formatFineractDateArray } from '@/lib/fineract/dates';

/** Human-readable summary of a Fineract / Quartz scheduler cron expression. */
export function describeJobCronExpression(cronExpression: string | undefined): string | null {
  const trimmed = cronExpression?.trim();
  if (!trimmed) {
    return null;
  }
  try {
    return cronstrue.toString(trimmed, { verbose: true });
  } catch {
    return null;
  }
}

export function formatJobDateTime(value: string | number[] | undefined): string {
  if (value == null || value === '') {
    return '—';
  }
  if (Array.isArray(value)) {
    const date = formatFineractDateArray(value);
    return date ?? '—';
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(parsed);
}

export function jobRunSucceeded(history: FineractSchedulerJobRunHistory | undefined): boolean {
  return history?.status === 'success';
}

export function jobHasError(job: FineractSchedulerJob): boolean {
  return !jobRunSucceeded(job.lastRunHistory);
}

export function yesNoLabel(value: boolean | undefined): string {
  return value ? 'Yes' : 'No';
}

function parseJobDateTime(value: string | number[] | undefined): Date | null {
  if (value == null || value === '') {
    return null;
  }
  if (Array.isArray(value)) {
    if (value.length >= 6) {
      const [year, month, day, hour, minute, second] = value;
      return new Date(year, month - 1, day, hour, minute, second);
    }
    if (value.length >= 3) {
      const [year, month, day] = value;
      return new Date(year, month - 1, day);
    }
    return null;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function jobRunStartTimestamp(history: FineractSchedulerJobRunHistory): number {
  return parseJobDateTime(history.jobRunStartTime)?.getTime() ?? 0;
}

/** Latest runs first; falls back to version when start times tie or are missing. */
export function sortJobRunHistoryNewestFirst(
  history: FineractSchedulerJobRunHistory[]
): FineractSchedulerJobRunHistory[] {
  return [...history].sort((left, right) => {
    const startDiff = jobRunStartTimestamp(right) - jobRunStartTimestamp(left);
    if (startDiff !== 0) {
      return startDiff;
    }
    return (right.version ?? 0) - (left.version ?? 0);
  });
}

export function formatJobRunDuration(history: FineractSchedulerJobRunHistory | undefined): string {
  const start = parseJobDateTime(history?.jobRunStartTime);
  const end = parseJobDateTime(history?.jobRunEndTime);
  if (!start || !end) {
    return '—';
  }
  const milliseconds = end.getTime() - start.getTime();
  if (milliseconds < 0) {
    return '—';
  }
  if (milliseconds < 1000) {
    return `${milliseconds} ms`;
  }
  const seconds = Math.round(milliseconds / 1000);
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return remainder > 0 ? `${minutes}m ${remainder}s` : `${minutes}m`;
}

export function formatJobRunLogContent(history: FineractSchedulerJobRunHistory | undefined): string {
  if (!history) {
    return 'No log available for this run.';
  }

  const message = history.jobRunErrorMessage?.trim();
  const log = history.jobRunErrorLog?.trim();

  if (message && log) {
    if (message === log || log.includes(message) || message.includes(log)) {
      return log;
    }
    return `${message}\n\n${log}`;
  }

  return message || log || 'No log available for this run.';
}

export function formatJobRunStatusLabel(status: string | undefined): string {
  if (!status) {
    return '—';
  }
  return status.charAt(0).toUpperCase() + status.slice(1);
}
