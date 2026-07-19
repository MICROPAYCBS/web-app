/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  CreateHolidayPayload,
  UpdateActiveHolidayPayload,
  UpdatePendingHolidayPayload
} from '@mifos/validation';
import { HOLIDAY_RESCHEDULE_SPECIFIC_DATE } from '@mifos/validation';
import {
  FINERACT_DATE_FORMAT,
  FINERACT_LOCALE,
  normalizeFineractDateField
} from '@/lib/fineract/dates';

function stripEmpty<T extends Record<string, unknown>>(obj: T): T {
  const next = { ...obj };
  for (const key of Object.keys(next)) {
    const value = next[key];
    if (value === '' || value === undefined) {
      delete next[key];
    }
  }
  return next;
}

export function buildCreateHolidayPayload(input: CreateHolidayPayload): Record<string, unknown> {
  const dateFormat = input.dateFormat ?? FINERACT_DATE_FORMAT;
  const locale = input.locale ?? FINERACT_LOCALE;

  const body: Record<string, unknown> = {
    name: input.name,
    fromDate: normalizeFineractDateField(input.fromDate),
    toDate: normalizeFineractDateField(input.toDate),
    reschedulingType: input.reschedulingType,
    offices: input.offices.map((officeId) => ({ officeId })),
    dateFormat,
    locale
  };

  if (input.description?.trim()) {
    body.description = input.description.trim();
  }

  if (
    input.reschedulingType === HOLIDAY_RESCHEDULE_SPECIFIC_DATE &&
    input.repaymentsRescheduledTo?.trim()
  ) {
    body.repaymentsRescheduledTo = normalizeFineractDateField(input.repaymentsRescheduledTo);
  }

  return body;
}

export function buildUpdateActiveHolidayPayload(
  input: UpdateActiveHolidayPayload
): Record<string, unknown> {
  return stripEmpty({
    name: input.name,
    description: input.description?.trim(),
    dateFormat: input.dateFormat ?? FINERACT_DATE_FORMAT,
    locale: input.locale ?? FINERACT_LOCALE
  });
}

export function buildUpdatePendingHolidayPayload(
  input: UpdatePendingHolidayPayload
): Record<string, unknown> {
  const body: Record<string, unknown> = {
    name: input.name,
    fromDate: normalizeFineractDateField(input.fromDate),
    toDate: normalizeFineractDateField(input.toDate),
    reschedulingType: input.reschedulingType,
    dateFormat: input.dateFormat ?? FINERACT_DATE_FORMAT,
    locale: input.locale ?? FINERACT_LOCALE
  };

  if (input.description?.trim()) {
    body.description = input.description.trim();
  }

  if (
    input.reschedulingType === HOLIDAY_RESCHEDULE_SPECIFIC_DATE &&
    input.repaymentsRescheduledTo?.trim()
  ) {
    body.repaymentsRescheduledTo = normalizeFineractDateField(input.repaymentsRescheduledTo);
  }

  return body;
}
