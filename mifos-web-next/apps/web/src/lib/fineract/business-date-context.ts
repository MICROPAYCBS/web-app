/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { parseFineractDateString, toLocalCalendarDate } from '@/lib/fineract/dates';
import { fineractDateToDate, startOfDay } from '@/lib/fineract/date-input';

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

/** True when the organisation business date feature is enabled and a date is set. */
export function hasConfiguredBusinessDate(ctx: BusinessDateContextValue): boolean {
  return ctx.enabled && Boolean(ctx.date?.trim());
}

/** Helper copy for transaction date fields when capped at the organisation business date. */
export function businessDateTransactionHint(isNotToday: boolean): string {
  return isNotToday
    ? 'Defaults to the organisation business date, which differs from today. You can choose an earlier date for backdated entries.'
    : 'Defaults to the organisation business date. You can choose an earlier date for backdated entries.';
}

/** Shown when the selected transaction date is before the organisation business date. */
export function businessDateBackdatedEntryHint(): string {
  return 'Backdated — this date is before the organisation business date.';
}

/** @deprecated Use {@link businessDateTransactionHint}. */
export function businessDateLockedHint(isNotToday: boolean): string {
  return businessDateTransactionHint(isNotToday);
}

/** Short label for badges and compact UI. */
export function businessDateNotTodayBadgeLabel(): string {
  return 'Not today';
}

/** Longer explanation for admin surfaces and banners. */
export function businessDateNotTodayDescription(): string {
  return 'The organisation business date is not the current calendar day. New transaction dates default to this day; earlier dates are allowed for backdated entries.';
}

/**
 * @deprecated Transaction dates are editable for backdating. Use
 * {@link hasConfiguredBusinessDate} to detect business-date defaults and caps.
 */
export function isTransactionDateLocked(_ctx: BusinessDateContextValue): boolean {
  return false;
}

/** True when the selected date is strictly before the organisation business date. */
export function isTransactionDateBackdated(
  transactionDate: string | undefined,
  businessDate: string | undefined,
  dateFormat?: string
): boolean {
  if (!transactionDate?.trim() || !businessDate?.trim()) {
    return false;
  }

  const selected = fineractDateToDate(transactionDate, dateFormat);
  const cap = fineractDateToDate(businessDate, dateFormat);
  if (!selected || !cap) {
    return false;
  }

  return startOfDay(selected).getTime() < startOfDay(cap).getTime();
}

/** Default posting date: business date when configured, otherwise caller fallback (usually today). */
export function resolveTransactionDate(
  ctx: BusinessDateContextValue,
  fallback: string
): string {
  if (ctx.date?.trim()) {
    return ctx.date;
  }
  return fallback;
}

/** Loan approval default: organisation business date when configured, otherwise submitted date. */
export function resolveLoanApprovalDefaultDate(
  ctx: BusinessDateContextValue,
  submittedOnDate: string
): string {
  return resolveTransactionDate(ctx, submittedOnDate);
}

/** Loan disbursement default: organisation business date when configured, otherwise approval date. */
export function resolveLoanDisbursementDefaultDate(
  ctx: BusinessDateContextValue,
  approvedOnDate: string
): string {
  return resolveTransactionDate(ctx, approvedOnDate);
}
