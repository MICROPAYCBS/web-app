/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { describe, expect, it } from 'vitest';
import { describeJobCronExpression, sortJobRunHistoryNewestFirst } from '@/lib/fineract/jobs-display';

describe('describeJobCronExpression', () => {
  it('returns null for blank expressions', () => {
    expect(describeJobCronExpression(undefined)).toBeNull();
    expect(describeJobCronExpression('   ')).toBeNull();
  });

  it('describes common Fineract Quartz schedules', () => {
    expect(describeJobCronExpression('0 0 12 * * ?')).toMatch(/12:00/i);
    expect(describeJobCronExpression('0 0 22 1/1 * ? *')).toMatch(/10:00/i);
    expect(describeJobCronExpression('0 5 0 1/1 * ? *')).toMatch(/12:05/i);
  });

  it('returns null for invalid cron expressions', () => {
    expect(describeJobCronExpression('not-a-cron')).toBeNull();
  });
});

describe('sortJobRunHistoryNewestFirst', () => {
  it('orders runs by start time descending', () => {
    const sorted = sortJobRunHistoryNewestFirst([
      { version: 1, jobRunStartTime: '2024-01-01T08:00:00Z', status: 'success' },
      { version: 3, jobRunStartTime: '2024-01-03T08:00:00Z', status: 'success' },
      { version: 2, jobRunStartTime: '2024-01-02T08:00:00Z', status: 'success' }
    ]);
    expect(sorted.map((row) => row.version)).toEqual([3, 2, 1]);
  });
});
