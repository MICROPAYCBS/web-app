/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { format, isValid, parse } from 'date-fns';

export const FINERACT_DATE_FORMAT = 'dd MMMM yyyy';
export const FINERACT_LOCALE = 'en';

const FINERACT_PARSE_FORMATS = ['dd MMMM yyyy', 'd MMMM yyyy'] as const;

/** Calendar day in local time (strips time-of-day). */
export function toLocalCalendarDate(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Parse Fineract date strings without `Date(string)` timezone drift. */
export function parseFineractDateString(value: string): Date | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [year, month, day] = trimmed.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  for (const pattern of FINERACT_PARSE_FORMATS) {
    const parsed = parse(trimmed, pattern, new Date());
    if (isValid(parsed)) {
      return toLocalCalendarDate(parsed);
    }
  }

  return null;
}

/** Format a Date for Fineract command bodies (e.g. `01 March 2026`). */
export function toFineractDate(date: Date = new Date()): string {
  return format(toLocalCalendarDate(date), FINERACT_DATE_FORMAT);
}

/** Fineract often returns dates as `[yyyy, mm, dd]` (month 1–12). */
export function fromFineractDateArray(value: number[] | undefined): Date | null {
  if (!value || value.length < 3) {
    return null;
  }
  const [year, month, day] = value;
  return new Date(year, month - 1, day);
}

/** Map API date (array or string) to canonical Fineract form string. */
export function fineractApiDateToFormString(
  value: number[] | string | undefined
): string | undefined {
  if (value == null) {
    return undefined;
  }
  if (typeof value === 'string') {
    const parsed = parseFineractDateString(value);
    return parsed ? toFineractDate(parsed) : undefined;
  }
  const fromArray = fromFineractDateArray(value);
  return fromArray ? toFineractDate(fromArray) : undefined;
}

/** Re-canonicalize a form date before PUT/POST (fixes `d` vs `dd` and parse drift). */
export function normalizeFineractDateField(value: string | undefined): string | undefined {
  if (!value?.trim()) {
    return undefined;
  }
  const parsed = parseFineractDateString(value);
  return parsed ? toFineractDate(parsed) : value.trim();
}

export function formatFineractDateArray(
  value: number[] | string | undefined,
  locale = FINERACT_LOCALE
): string | null {
  if (typeof value === 'string') {
    const parsed = parseFineractDateString(value);
    if (!parsed) {
      return value;
    }
    return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(parsed);
  }
  const date = fromFineractDateArray(value);
  if (!date) {
    return null;
  }
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(date);
}
