/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import {
  WORKING_WEEK_DAY_CODES,
  type WorkingWeekDayCode
} from '@mifos/validation';

export const WORKING_DAYS_RECURRENCE_PREFIX = 'FREQ=WEEKLY;INTERVAL=1;BYDAY=';

export const WORKING_WEEK_DAYS: ReadonlyArray<{ name: string; value: WorkingWeekDayCode }> = [
  { name: 'Monday', value: 'MO' },
  { name: 'Tuesday', value: 'TU' },
  { name: 'Wednesday', value: 'WE' },
  { name: 'Thursday', value: 'TH' },
  { name: 'Friday', value: 'FR' },
  { name: 'Saturday', value: 'SA' },
  { name: 'Sunday', value: 'SU' }
];

export function parseWorkingDaysRecurrence(recurrence: string): WorkingWeekDayCode[] {
  const daysPart = recurrence.replace(WORKING_DAYS_RECURRENCE_PREFIX, '');
  return WORKING_WEEK_DAY_CODES.filter((code) => daysPart.includes(code));
}

export function buildWorkingDaysRecurrence(weekDays: WorkingWeekDayCode[]): string {
  let recurrence = WORKING_DAYS_RECURRENCE_PREFIX;
  for (const day of WORKING_WEEK_DAYS) {
    if (weekDays.includes(day.value)) {
      recurrence += `${day.value},`;
    }
  }
  return recurrence;
}
