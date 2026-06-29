/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { z } from 'zod';

/** Uganda mobile in E.164 form: +256 followed by 9 digits starting with 7. */
export const UGANDA_MOBILE_INTERNATIONAL_REGEX = /^\+2567\d{8}$/;

export const UGANDA_MOBILE_INTERNATIONAL_PLACEHOLDER = '+256712345678';

export const UGANDA_MOBILE_INTERNATIONAL_MESSAGE =
  'Enter the number in international format (e.g. +256712345678). Numbers starting with 0 are not accepted.';

export function isValidUgandaMobileInternational(value: string): boolean {
  return UGANDA_MOBILE_INTERNATIONAL_REGEX.test(value.trim());
}

/** Normalize local `07xxxxxxxx` numbers to `+2567xxxxxxxx` for forms and diff baselines. */
export function normalizeUgandaMobileInternational(value: string | undefined): string {
  const trimmed = value?.trim() ?? '';
  if (!trimmed) {
    return '';
  }
  if (UGANDA_MOBILE_INTERNATIONAL_REGEX.test(trimmed)) {
    return trimmed;
  }
  if (/^0[67]\d{8}$/.test(trimmed)) {
    return `+256${trimmed.slice(1)}`;
  }
  return trimmed;
}

export const ugandaMobileInternationalSchema = z
  .string()
  .trim()
  .regex(UGANDA_MOBILE_INTERNATIONAL_REGEX, {
    message: UGANDA_MOBILE_INTERNATIONAL_MESSAGE
  });

/** Empty, omitted, or null values are allowed; any other value must match {@link ugandaMobileInternationalSchema}. */
export const optionalUgandaMobileInternationalSchema = z
  .union([z.literal(''), z.null(), z.undefined(), ugandaMobileInternationalSchema])
  .transform((value) => (value == null ? '' : value));
