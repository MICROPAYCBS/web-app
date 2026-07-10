/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { z } from 'zod';
import {
  glAccountCodeHeaderStemError,
  glAccountCodeLengthError,
  glAccountCodeMatchesHeaderStem,
  glAccountCodeMatchesStructuredLength,
  glAccountCodeMatchesTypePrefix,
  glAccountCodeTypePrefixError,
  glAccountParentTypeError,
  glAccountParentTypeMatches,
  glAccountRequiresStatementTag,
  glAccountStatementTagError,
  glAccountStructuredValidationApplies,
  type GlAccountStructuredSnapshot
} from './gl-account-governance';

const optionalPositiveInt = z.preprocess(
  (value) => {
    if (value === '' || value === null || value === undefined) {
      return undefined;
    }
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : value;
  },
  z.number().int().positive().optional()
);

export const upsertGlAccountFormSchema = z.object({
  type: z.number().int().positive('Account type is required.'),
  name: z.string().trim().min(1, 'Account name is required.'),
  usage: z.number().int().positive('Account usage is required.'),
  glCode: z.string().trim().min(1, 'GL code is required.'),
  parentId: optionalPositiveInt,
  tagId: optionalPositiveInt,
  manualEntriesAllowed: z.boolean(),
  description: z.string().optional()
});

export type UpsertGlAccountFormInput = z.infer<typeof upsertGlAccountFormSchema>;

export type UpsertGlAccountValidationContext = {
  parentTypeId?: number;
  parentGlCode?: string;
  enforceStructured?: boolean;
  codeLength?: number;
  /** Edit flow: skip structured checks until code, class, or parent changes. */
  original?: GlAccountStructuredSnapshot;
};

export function buildUpsertGlAccountValidationContext(
  policy: { enforceStructured: boolean; codeLength: number },
  options: {
    parentGlCode?: string;
    parentTypeId?: number;
    original?: GlAccountStructuredSnapshot;
  } = {}
): UpsertGlAccountValidationContext {
  return {
    enforceStructured: policy.enforceStructured,
    codeLength: policy.codeLength,
    parentGlCode: options.parentGlCode,
    parentTypeId: options.parentTypeId,
    original: options.original
  };
}

export function refineUpsertGlAccountForm(
  data: UpsertGlAccountFormInput,
  ctx: z.RefinementCtx,
  validationContext: UpsertGlAccountValidationContext = {}
) {
  if (
    validationContext.enforceStructured &&
    glAccountStructuredValidationApplies(data, validationContext.original)
  ) {
    const codeLength = validationContext.codeLength ?? 6;

    if (!glAccountCodeMatchesTypePrefix(data.glCode, data.type)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: glAccountCodeTypePrefixError(data.type, codeLength),
        path: ['glCode']
      });
    }

    if (!glAccountCodeMatchesStructuredLength(data.glCode, codeLength)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: glAccountCodeLengthError(data.glCode, codeLength),
        path: ['glCode']
      });
    }

    if (
      validationContext.parentGlCode &&
      !glAccountCodeMatchesHeaderStem(data.glCode, validationContext.parentGlCode)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: glAccountCodeHeaderStemError(
          data.glCode,
          validationContext.parentGlCode,
          codeLength
        ),
        path: ['glCode']
      });
    }
  }

  if (!glAccountParentTypeMatches(validationContext.parentTypeId, data.type)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: glAccountParentTypeError(data.type),
      path: ['parentId']
    });
  }

  if (glAccountRequiresStatementTag(data.type) && data.tagId == null) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: glAccountStatementTagError(data.type),
      path: ['tagId']
    });
  }
}

export const toggleGlAccountDisabledSchema = z.object({
  disabled: z.boolean()
});

export type ToggleGlAccountDisabledInput = z.infer<typeof toggleGlAccountDisabledSchema>;

export function validateUpsertGlAccountForm(
  input: unknown,
  validationContext: UpsertGlAccountValidationContext = {}
) {
  return upsertGlAccountFormSchema
    .superRefine((data, ctx) => refineUpsertGlAccountForm(data, ctx, validationContext))
    .safeParse(input);
}

export function validateToggleGlAccountDisabled(input: unknown) {
  return toggleGlAccountDisabledSchema.safeParse(input);
}

export function buildGlAccountApiPayload(input: UpsertGlAccountFormInput) {
  return {
    type: input.type,
    name: input.name.trim(),
    usage: input.usage,
    glCode: input.glCode.trim(),
    parentId: input.parentId,
    tagId: input.tagId,
    manualEntriesAllowed: input.manualEntriesAllowed,
    description: input.description?.trim() || undefined
  };
}
