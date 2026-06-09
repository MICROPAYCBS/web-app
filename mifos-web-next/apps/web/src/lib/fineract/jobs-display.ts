/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractSchedulerJob, FineractSchedulerJobRunHistory } from '@mifos/api-client';
import { formatFineractDateArray } from '@/lib/fineract/dates';

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
