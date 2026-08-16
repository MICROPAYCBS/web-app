/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { fromFineractDateArray, parseFineractDateString } from './dates';

export type FineractSortableDate = number[] | string | undefined;

/** Calendar-day timestamp for sorting Fineract date payloads. Missing dates sort first in ASC. */
export function fineractDateSortValue(value: FineractSortableDate): number {
  if (value == null || value === '') {
    return Number.NEGATIVE_INFINITY;
  }
  if (Array.isArray(value)) {
    return fromFineractDateArray(value)?.getTime() ?? Number.NEGATIVE_INFINITY;
  }
  return parseFineractDateString(value)?.getTime() ?? Number.NEGATIVE_INFINITY;
}

/** Compare date first, then id. Ascending: older dates and lower ids first. */
export function compareByDateThenId(
  leftDate: FineractSortableDate,
  leftId: number,
  rightDate: FineractSortableDate,
  rightId: number
): number {
  const dateCmp = fineractDateSortValue(leftDate) - fineractDateSortValue(rightDate);
  if (dateCmp !== 0) {
    return dateCmp;
  }
  return leftId - rightId;
}

/**
 * Order transactions by business date, then id.
 * Display lists use newest first (`desc`); ledgers/statements use `asc`.
 */
export function sortByDateThenId<T>(
  items: readonly T[],
  getDate: (item: T) => FineractSortableDate,
  getId: (item: T) => number,
  direction: 'asc' | 'desc' = 'desc'
): T[] {
  const sign = direction === 'desc' ? -1 : 1;
  return [...items].sort(
    (left, right) =>
      sign * compareByDateThenId(getDate(left), getId(left), getDate(right), getId(right))
  );
}
