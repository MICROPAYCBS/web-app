/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/** Blank when unset; Fineract omits the field rather than sending 0. */
export function optionalMultipleFieldValue(value: number | undefined | null): string {
  if (value == null || value <= 0) {
    return '';
  }
  return String(value);
}

export function parseOptionalMultipleFieldValue(value: string): number | undefined {
  if (value.trim() === '') {
    return undefined;
  }
  return Number(value);
}
