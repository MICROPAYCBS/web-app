/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/** Fineract client gender identifiers. */
export const GENDER_MALE = 1;
export const GENDER_FEMALE = 2;

export const GENDER_OPTIONS = [
  { id: GENDER_MALE, name: 'Male' },
  { id: GENDER_FEMALE, name: 'Female' }
] as const;
