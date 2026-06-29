/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { format, isValid, parse } from 'date-fns';
import {
  FINERACT_DATE_FORMAT,
  FINERACT_LOCALE,
  coerceFineractDateTime,
  fineractApiDateToFormString as fineractApiDateToFormStringCanonical,
  fromFineractDateArray,
  toLocalCalendarDate
} from '@/lib/fineract/dates';

export type FineractDateContext = {
  dateFormat: string;
  locale: string;
};

export function resolveFineractDateContext(source?: {
  dateFormat?: string;
  locale?: string;
}): FineractDateContext {
  return {
    dateFormat: source?.dateFormat?.trim() || FINERACT_DATE_FORMAT,
    locale: source?.locale?.trim() || FINERACT_LOCALE
  };
}

function parsePatterns(dateFormat: string): string[] {
  const trimmed = dateFormat.trim();
  if (!trimmed) {
    return [FINERACT_DATE_FORMAT];
  }
  return [trimmed, FINERACT_DATE_FORMAT, 'd MMMM yyyy', 'dd MMMM yyyy'];
}

export function parseFineractDateWithContext(
  value: string,
  ctx: FineractDateContext
): Date | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [year, month, day] = trimmed.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  for (const pattern of parsePatterns(ctx.dateFormat)) {
    const parsed = parse(trimmed, pattern, new Date());
    if (isValid(parsed)) {
      return toLocalCalendarDate(parsed);
    }
  }

  return null;
}

export function formatFineractDateWithContext(date: Date, ctx: FineractDateContext): string {
  return format(toLocalCalendarDate(date), ctx.dateFormat);
}

export function fineractApiDateToFormString(
  value: unknown,
  ctx: FineractDateContext
): string | undefined {
  const coerced = coerceFineractDateTime(value);
  if (coerced == null) {
    return undefined;
  }
  if (typeof coerced === 'number') {
    const parsed = new Date(coerced);
    return Number.isNaN(parsed.getTime())
      ? undefined
      : formatFineractDateWithContext(parsed, ctx);
  }
  if (typeof coerced === 'string') {
    const parsed = parseFineractDateWithContext(coerced, ctx);
    return parsed ? formatFineractDateWithContext(parsed, ctx) : undefined;
  }
  const fromArray = fromFineractDateArray(coerced);
  if (fromArray) {
    return formatFineractDateWithContext(fromArray, ctx);
  }
  return fineractApiDateToFormStringCanonical(coerced);
}

export function normalizeFineractDateField(
  value: string | undefined,
  ctx: FineractDateContext
): string | undefined {
  if (!value?.trim()) {
    return undefined;
  }
  const parsed = parseFineractDateWithContext(value, ctx);
  return parsed ? formatFineractDateWithContext(parsed, ctx) : value.trim();
}

export function fineractDateFieldsEqual(
  a: string | undefined,
  b: string | undefined,
  ctx: FineractDateContext
): boolean {
  const left = normalizeFineractDateField(a, ctx);
  const right = normalizeFineractDateField(b, ctx);
  if (!left && !right) {
    return true;
  }
  return left === right;
}
