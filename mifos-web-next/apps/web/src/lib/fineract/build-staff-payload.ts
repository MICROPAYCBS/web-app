/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { CreateStaffPayload, UpdateStaffPayload } from '@mifos/validation';
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

export function buildStaffPayload(
  input: CreateStaffPayload | UpdateStaffPayload
): Record<string, unknown> {
  const dateFormat = input.dateFormat ?? FINERACT_DATE_FORMAT;
  const locale = input.locale ?? FINERACT_LOCALE;

  return stripEmpty({
    ...input,
    dateFormat,
    locale,
    joiningDate: normalizeFineractDateField(input.joiningDate),
    mobileNo: input.mobileNo === '' ? undefined : input.mobileNo
  });
}
