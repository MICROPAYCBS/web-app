/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export const FINERACT_DATE_FORMAT = 'dd MMMM yyyy';
export const FINERACT_LOCALE = 'en';

/** Format a Date for Fineract command bodies (e.g. `29 May 2026`). */
export function toFineractDate(date: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).formatToParts(date);
  const day = parts.find((p) => p.type === 'day')?.value ?? '';
  const month = parts.find((p) => p.type === 'month')?.value ?? '';
  const year = parts.find((p) => p.type === 'year')?.value ?? '';
  return `${day} ${month} ${year}`;
}

/** Fineract often returns dates as `[yyyy, mm, dd]`. */
export function fromFineractDateArray(value: number[] | undefined): Date | null {
  if (!value || value.length < 3) {
    return null;
  }
  const [year, month, day] = value;
  return new Date(year, month - 1, day);
}

export function formatFineractDateArray(
  value: number[] | undefined,
  locale = FINERACT_LOCALE
): string | null {
  const date = fromFineractDateArray(value);
  if (!date) {
    return null;
  }
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(date);
}
