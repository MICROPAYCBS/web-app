/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/** Uganda NIN: 14 alphanumeric characters (NIRA / integrator standard). */
export const UGANDA_NIN_PATTERN = /^[A-Z0-9]{14}$/;

export const UGANDA_NIN_PLACEHOLDER = 'CM95012345678A';

export const UGANDA_NIN_MESSAGE =
  'Enter a valid 14-character National ID number (letters and digits only; spaces are ignored).';

/** Remove whitespace and uppercase before validation or storage. */
export function normalizeUgandaNin(value: string): string {
  return value.replace(/\s+/g, '').toUpperCase();
}

export function isValidUgandaNin(value: string): boolean {
  return UGANDA_NIN_PATTERN.test(normalizeUgandaNin(value));
}
