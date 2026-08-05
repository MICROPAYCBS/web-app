/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { dateToFineract, fineractDateToDate } from '@/lib/fineract/date-input';

/** Clamp a form date into an optional product availability window. */
export function clampDateToProductWindow(
  value: string,
  startDate: string | undefined,
  closeDate: string | undefined,
  dateFormat?: string
): string {
  const current = fineractDateToDate(value, dateFormat);
  if (!current) {
    return value;
  }
  const start = fineractDateToDate(startDate, dateFormat);
  const close = fineractDateToDate(closeDate, dateFormat);
  let next = current;
  if (start && next.getTime() < start.getTime()) {
    next = start;
  }
  if (close && next.getTime() > close.getTime()) {
    next = close;
  }
  return dateToFineract(next, dateFormat) ?? value;
}
