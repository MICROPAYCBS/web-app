/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { FINERACT_DATE_FORMAT, FINERACT_LOCALE, toFineractDate } from '@/lib/fineract/dates';

export function buildFineractCommandBody(
  fields: Record<string, unknown>
): Record<string, unknown> {
  return {
    ...fields,
    dateFormat: FINERACT_DATE_FORMAT,
    locale: FINERACT_LOCALE
  };
}

/** @deprecated Prefer buildFineractCommandBody when dates are already Fineract strings. */
export function withFineractCommandDates(
  fields: Record<string, unknown>,
  dateFields: Record<string, Date>
): Record<string, unknown> {
  const body = buildFineractCommandBody(fields);
  for (const [key, date] of Object.entries(dateFields)) {
    body[key] = toFineractDate(date);
  }
  return body;
}
