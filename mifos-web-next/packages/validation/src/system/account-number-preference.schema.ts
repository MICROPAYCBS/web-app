/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { z } from 'zod';

const optionalPrefixTypeSchema = z.preprocess(
  (value) => (value === 0 || value === '' || value == null ? undefined : value),
  z.number().int().positive().optional()
);

export const createAccountNumberPreferenceSchema = z.object({
  accountType: z.number().int().positive('Account type is required.'),
  prefixType: optionalPrefixTypeSchema
});

export const updateAccountNumberPreferenceSchema = z.object({
  prefixType: optionalPrefixTypeSchema
});

export type CreateAccountNumberPreferenceInput = z.infer<
  typeof createAccountNumberPreferenceSchema
>;
export type UpdateAccountNumberPreferenceInput = z.infer<
  typeof updateAccountNumberPreferenceSchema
>;

export function validateCreateAccountNumberPreference(input: unknown) {
  return createAccountNumberPreferenceSchema.safeParse(input);
}

export function validateUpdateAccountNumberPreference(input: unknown) {
  return updateAccountNumberPreferenceSchema.safeParse(input);
}

export function buildCreateAccountNumberPreferencePayload(
  input: CreateAccountNumberPreferenceInput
) {
  const payload: { accountType: number; prefixType?: number } = {
    accountType: input.accountType
  };
  if (input.prefixType != null) {
    payload.prefixType = input.prefixType;
  }
  return payload;
}

export function buildUpdateAccountNumberPreferencePayload(
  input: UpdateAccountNumberPreferenceInput
) {
  const payload: { prefixType?: number } = {};
  if (input.prefixType != null) {
    payload.prefixType = input.prefixType;
  }
  return payload;
}
