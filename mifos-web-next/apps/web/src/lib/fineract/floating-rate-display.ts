/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FloatingRatePeriod } from '@mifos/api-client';
import type { FloatingRatePeriodInput } from '@mifos/validation';
import { addDays } from 'date-fns';
import {
  fineractApiDateToFormString,
  formatFineractDateArray,
  parseFineractDateString,
  toFineractDate,
  toLocalCalendarDate
} from '@/lib/fineract/dates';
import { yesNoLabel } from '@/lib/fineract/user-display';

export { yesNoLabel as formatFloatingRateYesNo };

export function formatFloatingRateDate(value: number[] | string | undefined): string {
  return formatFineractDateArray(value) ?? '—';
}

export function floatingRatePeriodToFormInput(period: FloatingRatePeriod): FloatingRatePeriodInput {
  return {
    fromDate: fineractApiDateToFormString(period.fromDate) ?? '',
    interestRate: period.interestRate ?? 0,
    isDifferentialToBaseLendingRate: period.isDifferentialToBaseLendingRate ?? false
  };
}

export function floatingRatePeriodsFromDetail(
  periods: FloatingRatePeriod[] | undefined
): FloatingRatePeriodInput[] {
  return (periods ?? []).map((period) => floatingRatePeriodToFormInput(period));
}

/** Earliest allowed from-date for new floating rate periods (tomorrow). */
export function floatingRatePeriodMinDate(): Date {
  return toLocalCalendarDate(addDays(new Date(), 1));
}

export function isFloatingRatePeriodLocked(fromDate: string | undefined): boolean {
  if (!fromDate?.trim()) {
    return false;
  }
  const parsed = parseFineractDateString(fromDate);
  if (!parsed) {
    return false;
  }
  return toLocalCalendarDate(parsed) < floatingRatePeriodMinDate();
}

export function formatFloatingRateInterestRate(value: number | undefined): string {
  return value !== undefined && value !== null ? String(value) : '—';
}

function periodSortKey(fromDate: number[] | string | undefined): Date | null {
  if (fromDate == null) {
    return null;
  }
  if (typeof fromDate === 'string') {
    return parseFineractDateString(fromDate);
  }
  const asString = fineractApiDateToFormString(fromDate);
  return asString ? parseFineractDateString(asString) : null;
}

export function sortFloatingRatePeriods<T extends { fromDate?: number[] | string }>(
  periods: T[]
): T[] {
  return [...periods].sort((left, right) => {
    const leftDate = periodSortKey(left.fromDate);
    const rightDate = periodSortKey(right.fromDate);
    if (!leftDate && !rightDate) {
      return 0;
    }
    if (!leftDate) {
      return 1;
    }
    if (!rightDate) {
      return -1;
    }
    return leftDate.getTime() - rightDate.getTime();
  });
}

export function floatingRatePeriodMinDateLabel(): string {
  return toFineractDate(floatingRatePeriodMinDate());
}
