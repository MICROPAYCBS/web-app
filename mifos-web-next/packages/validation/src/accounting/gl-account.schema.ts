/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { z } from 'zod';
import {
  glAccountCodeMatchesTypePrefix,
  glAccountParentTypeMatches,
  glAccountRequiresStatementTag
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
};

export function refineUpsertGlAccountForm(
  data: UpsertGlAccountFormInput,
  ctx: z.RefinementCtx,
  validationContext: UpsertGlAccountValidationContext = {}
) {
  if (!glAccountCodeMatchesTypePrefix(data.glCode, data.type)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'GL code must start with the digit for this account class (1–5).',
      path: ['glCode']
    });
  }

  if (!glAccountParentTypeMatches(validationContext.parentTypeId, data.type)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Parent account must be the same account class as this account.',
      path: ['parentId']
    });
  }

  if (glAccountRequiresStatementTag(data.type) && data.tagId == null) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Statement line tag is required for income and expense accounts.',
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
