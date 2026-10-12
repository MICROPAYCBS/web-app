/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import {
  accountNumberPatternRuleIssues,
  countSequenceSegments,
  FORMAT_SEGMENT_PATTERN
} from '@mifos/domain';
import { z } from 'zod';

const PREFIX_TEXT_TYPE_ID = 401;

const optionalPrefixTypeSchema = z.preprocess(
  (value) => (value === 0 || value === '' || value == null ? undefined : value),
  z.number().int().positive().optional()
);

/** Update can clear a stored prefix. `0` and `''` mean no prefix; omitted stays omitted. */
const nullablePrefixTypeSchema = z.preprocess(
  (value) => (value === 0 || value === '' ? null : value),
  z.number().int().positive().nullable().optional()
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
    .max(10, 'Prefix text can be at most 10 characters.')
    .optional()
    .nullable()
    .transform((value) => (value === '' ? null : value))
};

function refinePrefixCharacter(
  data: { prefixType?: number | null; prefixCharacter?: string | null },
  ctx: z.RefinementCtx
) {
  if (data.prefixType === PREFIX_TEXT_TYPE_ID && !data.prefixCharacter?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['prefixCharacter'],
      message: 'Enter the prefix text.'
    });
  }
}

function refineStructuredFields(
  data: {
    accountType?: number;
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

  if (FORMAT_SEGMENT_PATTERN.test(pattern)) {
    for (const issue of accountNumberPatternRuleIssues({
      pattern,
      accountTypeId: data.accountType,
      sequenceScope: data.sequenceScope
    })) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [issue.path],
        message: issue.message
      });
    }
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
  .superRefine(refinePrefixCharacter)
  .superRefine(refineStructuredFields);

export const updateAccountNumberPreferenceSchema = z
  .object({
    prefixType: nullablePrefixTypeSchema,
    /** Used to check pattern rules. Not sent on update. */
    accountType: z.number().int().positive().optional(),
    ...structuredFieldsSchema
  })
  .superRefine(refinePrefixCharacter)
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
  if (input.prefixCharacter !== undefined) {
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
  if (input.prefixType !== undefined) {
    payload.prefixType = input.prefixType;
  }
  appendStructuredPayload(payload, input);
  return payload;
}
