/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import {
  ACCOUNT_NUMBER_FORMAT_MAX_LENGTH,
  countSequenceSegments,
  FORMAT_SEGMENT_PATTERN,
  patternTotalWidth
} from '@mifos/domain';
import { z } from 'zod';

const optionalPrefixTypeSchema = z.preprocess(
  (value) => (value === 0 || value === '' || value == null ? undefined : value),
  z.number().int().positive().optional()
);

const optionalEnumIdSchema = z.preprocess(
  (value) => (value === '' || value == null ? undefined : value),
  z.coerce.number().int().optional()
);

const structuredFieldsSchema = {
  formatPattern: z.string().trim().max(200).optional(),
  sequenceScope: optionalEnumIdSchema,
  checkDigitAlgorithm: optionalEnumIdSchema,
  structuredEnabled: z.boolean().optional(),
  prefixCharacter: z
    .string()
    .trim()
    .max(1)
    .optional()
    .nullable()
    .transform((value) => (value === '' ? null : value))
};

function refineStructuredFields(
  data: {
    structuredEnabled?: boolean;
    formatPattern?: string;
    sequenceScope?: number;
    checkDigitAlgorithm?: number;
  },
  ctx: z.RefinementCtx
) {
  if (!data.structuredEnabled) {
    return;
  }

  const pattern = data.formatPattern?.trim();
  if (!pattern) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['formatPattern'],
      message: 'Format pattern is required when structured mode is enabled.'
    });
    return;
  }

  if (!FORMAT_SEGMENT_PATTERN.test(pattern)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['formatPattern'],
      message: 'Format pattern must use {token:width} segments only.'
    });
  }

  if (countSequenceSegments(pattern) !== 1) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['formatPattern'],
      message: 'Format pattern must include exactly one sequence segment.'
    });
  }

  const totalWidth = patternTotalWidth(pattern);
  if (totalWidth > ACCOUNT_NUMBER_FORMAT_MAX_LENGTH) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['formatPattern'],
      message: `Total segment width must be ${ACCOUNT_NUMBER_FORMAT_MAX_LENGTH} characters or less.`
    });
  }

  if (data.sequenceScope == null || data.sequenceScope < 1 || data.sequenceScope > 3) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['sequenceScope'],
      message: 'Sequence scope is required for structured formats.'
    });
  }

  if (data.checkDigitAlgorithm == null || data.checkDigitAlgorithm < 0 || data.checkDigitAlgorithm > 3) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['checkDigitAlgorithm'],
      message: 'Check digit algorithm is required for structured formats.'
    });
  }
}

export const createAccountNumberPreferenceSchema = z
  .object({
    accountType: z.number().int().positive('Account type is required.'),
    prefixType: optionalPrefixTypeSchema,
    ...structuredFieldsSchema
  })
  .superRefine(refineStructuredFields);

export const updateAccountNumberPreferenceSchema = z
  .object({
    prefixType: optionalPrefixTypeSchema,
    ...structuredFieldsSchema
  })
  .superRefine(refineStructuredFields);

export const accountNumberFormatPreviewQuerySchema = z.object({
  accountType: z.coerce.number().int().positive(),
  officeId: z.coerce.number().int().positive().optional(),
  productShortName: z.string().trim().optional(),
  clientTypeLabel: z.string().trim().optional(),
  formatPattern: z.string().trim().optional(),
  sequenceScope: z.coerce.number().int().optional(),
  checkDigitAlgorithm: z.coerce.number().int().optional()
});

export type CreateAccountNumberPreferenceInput = z.infer<typeof createAccountNumberPreferenceSchema>;
export type UpdateAccountNumberPreferenceInput = z.infer<typeof updateAccountNumberPreferenceSchema>;
export type AccountNumberFormatPreviewQueryInput = z.infer<typeof accountNumberFormatPreviewQuerySchema>;

export function validateCreateAccountNumberPreference(input: unknown) {
  return createAccountNumberPreferenceSchema.safeParse(input);
}

export function validateUpdateAccountNumberPreference(input: unknown) {
  return updateAccountNumberPreferenceSchema.safeParse(input);
}

export function validateAccountNumberFormatPreviewQuery(input: unknown) {
  return accountNumberFormatPreviewQuerySchema.safeParse(input);
}

function appendStructuredPayload(
  payload: Record<string, unknown>,
  input: CreateAccountNumberPreferenceInput | UpdateAccountNumberPreferenceInput
) {
  if (input.prefixCharacter != null) {
    payload.prefixCharacter = input.prefixCharacter;
  }
  if (input.formatPattern?.trim()) {
    payload.formatPattern = input.formatPattern.trim();
  }
  if (input.sequenceScope != null) {
    payload.sequenceScope = input.sequenceScope;
  }
  if (input.checkDigitAlgorithm != null) {
    payload.checkDigitAlgorithm = input.checkDigitAlgorithm;
  }
  if (input.structuredEnabled != null) {
    payload.structuredEnabled = input.structuredEnabled;
  }
}

export function buildCreateAccountNumberPreferencePayload(input: CreateAccountNumberPreferenceInput) {
  const payload: Record<string, unknown> = {
    accountType: input.accountType
  };
  if (input.prefixType != null) {
    payload.prefixType = input.prefixType;
  }
  appendStructuredPayload(payload, input);
  return payload;
}

export function buildUpdateAccountNumberPreferencePayload(input: UpdateAccountNumberPreferenceInput) {
  const payload: Record<string, unknown> = {};
  if (input.prefixType != null) {
    payload.prefixType = input.prefixType;
  }
  appendStructuredPayload(payload, input);
  return payload;
}
