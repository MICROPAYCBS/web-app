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

function monthFromApi(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isInteger(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim()) {
    const asNumber = Number(value);
    if (Number.isInteger(asNumber)) {
      return asNumber;
    }
    return MONTH_INDEX[value.trim().toLowerCase()];
  }
  return undefined;
}

function dayFromApi(value: unknown): number | undefined {
  const day = typeof value === 'number' ? value : Number(value);
  return Number.isInteger(day) ? day : undefined;
}

/**
 * Turn a charge due date from a read response into `dd MMM`.
 * Accepts `04 Mar`, `01 January`, `--03-04`, `2024-03-04`, `[month, day]`,
 * `[year, month, day]`, and `{ monthValue, dayOfMonth }`.
 */
export function chargeMonthDayFromApi(value: unknown): string | undefined {
  if (value == null || value === '') {
    return undefined;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    const labeled = parseChargeMonthDay(trimmed);
    if (labeled) {
      return formatChargeMonthDay(labeled.month, labeled.day);
    }
    const isoMonthDay = /^--(\d{1,2})-(\d{1,2})$/.exec(trimmed);
    if (isoMonthDay) {
      return formatChargeMonthDay(Number(isoMonthDay[1]), Number(isoMonthDay[2]));
    }
    const isoDate = /^\d{4}-(\d{1,2})-(\d{1,2})$/.exec(trimmed);
    if (isoDate) {
      return formatChargeMonthDay(Number(isoDate[1]), Number(isoDate[2]));
    }
    return undefined;
  }
  if (Array.isArray(value)) {
    const parts = value.map((part) => Number(part));
    if (parts.length >= 3 && Number.isFinite(parts[0]) && parts[0] > 12) {
      return formatChargeMonthDay(parts[1], parts[2]);
    }
    if (parts.length >= 2) {
      const monthDay = formatChargeMonthDay(parts[0], parts[1]);
      if (monthDay) {
        return monthDay;
      }
    }
    if (parts.length >= 3) {
      return formatChargeMonthDay(parts[1], parts[2]);
    }
    return undefined;
  }
  if (typeof value === 'object') {
    const row = value as Record<string, unknown>;
    const month = monthFromApi(row.monthValue ?? row.month);
    const day = dayFromApi(row.dayOfMonth ?? row.day);
    if (month == null || day == null) {
      return undefined;
    }
    return formatChargeMonthDay(month, day);
  }
  return undefined;
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
