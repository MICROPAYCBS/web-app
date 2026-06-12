/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { HolidayListItem } from '@mifos/api-client';
import { HOLIDAY_RESCHEDULE_NEXT_REPAYMENT } from '@mifos/validation';
import { formatFineractDateArray } from '@/lib/fineract/dates';
import { fineractApiDateToFormString } from '@/lib/fineract/dates';

export function formatHolidayDate(value?: string | number[] | null): string {
  if (value == null) {
    return '—';
  }
  if (typeof value === 'string') {
    return formatFineractDateArray(value) ?? value;
  }
  return formatFineractDateArray(value) ?? '—';
}

export function holidayDateToFormString(value?: string | number[] | null): string {
  if (value == null) {
    return '';
  }
  return fineractApiDateToFormString(value) ?? '';
}

export function holidayStatusLabel(status?: HolidayListItem['status']): string {
  return status?.value?.trim() || '—';
}

export function isHolidayActive(status?: HolidayListItem['status']): boolean {
  return status?.value === 'Active';
}

export function isHolidayDeleted(status?: HolidayListItem['status']): boolean {
  return status?.value === 'Deleted';
}

export function formatHolidayRepaymentsScheduled(item: HolidayListItem): string {
  if (item.reschedulingType === HOLIDAY_RESCHEDULE_NEXT_REPAYMENT) {
    return 'Next repayment date';
  }
  return formatHolidayDate(item.repaymentsRescheduledTo);
}
