/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import Decimal from 'decimal.js';

/** Fineract amount constraints (align with platform rules). */
export const AMOUNT_MAX_INTEGER_DIGITS = 13;
export const AMOUNT_MAX_DECIMAL_PLACES = 6;

export function parseAmount(value: string): Decimal | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  const regex = new RegExp(
    `^\\d{1,${AMOUNT_MAX_INTEGER_DIGITS}}(\\.\\d{1,${AMOUNT_MAX_DECIMAL_PLACES}})?$`
  );
  if (!regex.test(trimmed)) {
    return null;
  }
  return new Decimal(trimmed);
}

export function formatAmount(amount: Decimal, locale = 'en'): string {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: AMOUNT_MAX_DECIMAL_PLACES
  }).format(amount.toNumber());
}

/** Coerce Fineract API numeric values for display formatting. */
export function toDecimal(
  value: Decimal | string | number | null | undefined
): Decimal | null {
  if (value == null || value === '') {
    return null;
  }
  if (value instanceof Decimal) {
    return value;
  }
  try {
    return new Decimal(value);
  } catch {
    return null;
  }
}

/**
 * Display money with ISO currency code context (e.g. `KES 1,234.00`).
 * Uses `Intl` currency style when the code is supported; falls back to code + amount.
 */
export function formatMoney(
  amount: Decimal | string | number | null | undefined,
  currencyCode: string,
  locale = 'en'
): string | null {
  const decimal = toDecimal(amount);
  if (!decimal) {
    return null;
  }
  const code = currencyCode.trim().toUpperCase();
  if (!code) {
    return formatAmount(decimal, locale);
  }
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: code,
      minimumFractionDigits: 2,
      maximumFractionDigits: AMOUNT_MAX_DECIMAL_PLACES
    }).format(decimal.toNumber());
  } catch {
    return `${code} ${formatAmount(decimal, locale)}`;
  }
}
