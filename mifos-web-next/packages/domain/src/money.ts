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
