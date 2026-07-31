/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { z } from 'zod';

/**
 * Uganda phone (mobile or landline) in E.164 form: +256 followed by 9 national digits.
 * Mobile: +2567xxxxxxxx · Landline: +256417000000 (from local 0417000000).
 */
export const UGANDA_PHONE_INTERNATIONAL_REGEX = /^\+256\d{9}$/;

/** @deprecated Prefer {@link UGANDA_PHONE_INTERNATIONAL_REGEX}. */
export const UGANDA_MOBILE_INTERNATIONAL_REGEX = UGANDA_PHONE_INTERNATIONAL_REGEX;

export const UGANDA_MOBILE_INTERNATIONAL_PLACEHOLDER = '+256712345678';

export const UGANDA_PHONE_INTERNATIONAL_HINT =
  'International format (+256…). Mobile (e.g. +256712345678), MTN fixed (+2563…), Airtel fixed (+256200…), or landline (+25641…). Spaces are ignored.';

export const UGANDA_MOBILE_INTERNATIONAL_MESSAGE =
  'Enter a valid Uganda phone number in international format (+256 followed by 9 digits). Spaces are ignored. Numbers starting with 0 are not accepted.';

/** Remove whitespace before phone validation or normalization. */
export function stripPhoneSpaces(value: string): string {
  return value.replace(/\s/g, '');
}

export function preparePhoneForValidation(value: string): string {
  return stripPhoneSpaces(value.trim());
}

function toInternationalCandidate(prepared: string): string {
  if (UGANDA_PHONE_INTERNATIONAL_REGEX.test(prepared)) {
    return prepared;
  }
  if (/^0\d{9}$/.test(prepared)) {
    return `+256${prepared.slice(1)}`;
  }
  return prepared;
}

export function isValidUgandaMobileInternational(value: string): boolean {
  const prepared = preparePhoneForValidation(value);
  if (!prepared) {
    return false;
  }
  const candidate = toInternationalCandidate(prepared);
  return UGANDA_PHONE_INTERNATIONAL_REGEX.test(candidate);
}

/** Normalize local `07xxxxxxxx` / `0417000000` numbers to `+256…` for forms and diff baselines. */
export function normalizeUgandaMobileInternational(value: string | undefined): string {
  const prepared = preparePhoneForValidation(value ?? '');
  if (!prepared) {
    return '';
  }
  const candidate = toInternationalCandidate(prepared);
  if (UGANDA_PHONE_INTERNATIONAL_REGEX.test(candidate)) {
    return candidate;
  }
  return prepared;
}

const ugandaPhoneInternationalValueSchema = z
  .string()
  .regex(UGANDA_PHONE_INTERNATIONAL_REGEX, {
    message: UGANDA_MOBILE_INTERNATIONAL_MESSAGE
  });

export const ugandaMobileInternationalSchema = z
  .string()
  .trim()
  .transform(preparePhoneForValidation)
  .transform(toInternationalCandidate)
  .pipe(ugandaPhoneInternationalValueSchema);

/** Empty, omitted, or null values are allowed; any other value must match international format. */
export const optionalUgandaMobileInternationalSchema = z
  .union([
    z.literal(''),
    z.null(),
    z.undefined(),
    z
      .string()
      .transform((value) => preparePhoneForValidation(value))
      .transform((value) => (value ? toInternationalCandidate(value) : ''))
      .pipe(z.union([z.literal(''), ugandaPhoneInternationalValueSchema]))
  ])
  .transform((value) => (value == null ? '' : value));
