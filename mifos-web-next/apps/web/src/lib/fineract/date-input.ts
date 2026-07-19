/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { parseFineractDateString, toFineractDate } from '@/lib/fineract/dates';
import {
  formatFineractDateWithContext,
  parseFineractDateWithContext,
  resolveFineractDateContext
} from '@/lib/fineract/fineract-date-context';

/** `yyyy-MM-dd` from `<input type="date">` → Fineract date string. */
export function isoDateToFineract(iso: string): string {
  const [year, month, day] = iso.split('-').map(Number);
  if (!year || !month || !day) {
    return iso;
  }
  return toFineractDate(new Date(year, month - 1, day));
}

/** Fineract date string or ISO → `yyyy-MM-dd` for date inputs. */
export function fineractDateToIso(value: string | undefined): string {
  if (!value) {
    return '';
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }
  const parsed = parseFineractDateString(value);
  if (!parsed) {
    return '';
  }
  const y = parsed.getFullYear();
  const m = String(parsed.getMonth() + 1).padStart(2, '0');
  const d = String(parsed.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Parse Fineract or ISO date string to local calendar `Date`. */
export function fineractDateToDate(
  value: string | undefined,
  dateFormat?: string
): Date | undefined {
  if (!value) {
    return undefined;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
  }
  const ctx = resolveFineractDateContext({ dateFormat });
  return parseFineractDateWithContext(value, ctx) ?? parseFineractDateString(value) ?? undefined;
}

export function dateToFineract(
  date: Date | undefined,
  dateFormat?: string
): string | undefined {
  if (!date) {
    return undefined;
  }
  if (dateFormat) {
    return formatFineractDateWithContext(date, resolveFineractDateContext({ dateFormat }));
  }
  return toFineractDate(date);
}

/** Local calendar day at 00:00:00.000. */
export function startOfDay(date: Date): Date {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
}

/** Start of today in local time. */
export function todayStart(): Date {
  return startOfDay(new Date());
}

/** True when `date` is after today (local calendar day). */
export function isAfterToday(date: Date): boolean {
  return startOfDay(date).getTime() > todayStart().getTime();
}
