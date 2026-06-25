/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { parseFineractDateString, toLocalCalendarDate } from '@/lib/fineract/dates';

/** Serializable business date state for client providers and server pages. */
export type BusinessDateContextValue = {
  enabled: boolean;
  /** Fineract-formatted calendar day when enabled and configured. */
  date?: string;
  /** Long formatted label for read-only display. */
  displayLabel?: string;
  /** True when {@link date} is set and differs from the local calendar day. */
  isNotToday?: boolean;
};

export const EMPTY_BUSINESS_DATE_CONTEXT: BusinessDateContextValue = {
  enabled: false
};

/** True when a configured business date is not the local calendar day. */
export function isBusinessDateNotToday(
  businessDate: string | undefined,
  referenceDate: Date = new Date()
): boolean {
  if (!businessDate?.trim()) {
    return false;
  }

  const parsedBusinessDate = parseFineractDateString(businessDate);
  if (!parsedBusinessDate) {
    return false;
  }

  return parsedBusinessDate.getTime() !== toLocalCalendarDate(referenceDate).getTime();
}

/** Helper copy for locked transaction date fields. */
export function businessDateLockedHint(isNotToday: boolean): string {
  return isNotToday
    ? 'Uses the organisation business date, which differs from today.'
    : 'Uses the organisation business date.';
}

/** True when transaction dates must match the configured organisation business date. */
export function isTransactionDateLocked(ctx: BusinessDateContextValue): boolean {
  return ctx.enabled && Boolean(ctx.date?.trim());
}

/** Default posting date: business date when locked, otherwise caller fallback (usually today). */
export function resolveTransactionDate(
  ctx: BusinessDateContextValue,
  fallback: string
): string {
  if (ctx.date?.trim()) {
    return ctx.date;
  }
  return fallback;
}
