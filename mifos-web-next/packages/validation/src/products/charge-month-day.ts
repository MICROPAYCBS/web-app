/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/**
 * Leap year used only so February 29 is a real calendar day.
 * Charge due dates are month + day; the year is never submitted.
 */
export const CHARGE_MONTH_DAY_ANCHOR_YEAR = 2024;

const MONTH_LABELS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec'
] as const;

const MONTH_INDEX: Record<string, number> = {
  jan: 1,
  january: 1,
  feb: 2,
  february: 2,
  mar: 3,
  march: 3,
  apr: 4,
  april: 4,
  may: 5,
  jun: 6,
  june: 6,
  jul: 7,
  july: 7,
  aug: 8,
  august: 8,
  sep: 9,
  sept: 9,
  september: 9,
  oct: 10,
  october: 10,
  nov: 11,
  november: 11,
  dec: 12,
  december: 12
};

export interface ChargeMonthDay {
  month: number;
  day: number;
}

/** Last valid day of `month` (1–12), including 29 February. */
export function daysInChargeMonth(month: number): number {
  return new Date(CHARGE_MONTH_DAY_ANCHOR_YEAR, month, 0).getDate();
}

export function isAcceptedChargeMonthDay(month: number, day: number): boolean {
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    return false;
  }
  if (!Number.isInteger(day) || day < 1) {
    return false;
  }
  return day <= daysInChargeMonth(month);
}

/** `dd MMM` for `monthDayFormat`, for example `04 Mar`. */
export function formatChargeMonthDay(month: number, day: number): string | undefined {
  if (!isAcceptedChargeMonthDay(month, day)) {
    return undefined;
  }
  return `${String(day).padStart(2, '0')} ${MONTH_LABELS[month - 1]}`;
}

/** Accepts `04 Mar`, `4 March`, and the same with extra space. */
export function parseChargeMonthDay(value: string | undefined | null): ChargeMonthDay | undefined {
  if (!value?.trim()) {
    return undefined;
  }
  const match = /^(\d{1,2})\s+([A-Za-z]+)$/.exec(value.trim());
  if (!match) {
    return undefined;
  }
  const day = Number(match[1]);
  const month = MONTH_INDEX[match[2].toLowerCase()];
  if (month == null || !isAcceptedChargeMonthDay(month, day)) {
    return undefined;
  }
  return { month, day };
}

export function chargeMonthDayToDate(value: string | undefined): Date | undefined {
  const parsed = parseChargeMonthDay(value);
  if (!parsed) {
    return undefined;
  }
  return new Date(CHARGE_MONTH_DAY_ANCHOR_YEAR, parsed.month - 1, parsed.day);
}

export function dateToChargeMonthDay(date: Date | undefined): string | undefined {
  if (!date) {
    return undefined;
  }
  return formatChargeMonthDay(date.getMonth() + 1, date.getDate());
}
