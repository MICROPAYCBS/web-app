/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { z } from 'zod';

const statusSchema = z.enum(['ACTIVE', 'INACTIVE']);

const validationRegexSchema = z
  .string()
  .trim()
  .max(500)
  .optional()
  .refine(
    (value) => {
      if (!value) {
        return true;
      }
      try {
        // eslint-disable-next-line no-new -- validate regex compiles
        new RegExp(value);
        return true;
      } catch {
        return false;
      }
    },
    { message: 'Validation regex is not a valid pattern' }
  );

const sharedIdentityTypeFields = {
  codeValueId: z.coerce.number().int().positive('Customer identifier type is required'),
  example: z.string().trim().max(255).optional(),
  formatDescription: z.string().trim().max(500).optional(),
  validationMessage: z.string().trim().max(500).optional(),
  validationRegex: validationRegexSchema,
  displayOrder: z.coerce.number().int().min(0).optional(),
  status: statusSchema.default('ACTIVE')
};

export const createIdentityTypeSchema = z.object(sharedIdentityTypeFields);

export const updateIdentityTypeSchema = z.object({
  example: sharedIdentityTypeFields.example,
  formatDescription: sharedIdentityTypeFields.formatDescription,
  validationMessage: sharedIdentityTypeFields.validationMessage,
  validationRegex: sharedIdentityTypeFields.validationRegex,
  displayOrder: sharedIdentityTypeFields.displayOrder,
  status: sharedIdentityTypeFields.status
});

export type UpsertIdentityTypeInput = z.input<typeof createIdentityTypeSchema>;
export type UpsertIdentityTypePayload = z.output<typeof createIdentityTypeSchema>;
export type UpdateIdentityTypeInput = z.input<typeof updateIdentityTypeSchema>;
export type UpdateIdentityTypePayload = z.output<typeof updateIdentityTypeSchema>;

export type IdentityTypeUpdateClearFields = {
  displayOrder: boolean;
};

export function validateCreateIdentityType(input: unknown) {
  return createIdentityTypeSchema.safeParse(input);
}

export function validateUpdateIdentityType(input: unknown) {
  return updateIdentityTypeSchema.safeParse(input);
}

export function buildUpsertIdentityTypePayload(
  input: UpsertIdentityTypePayload
): Record<string, unknown> {
  return {
    codeValueId: input.codeValueId,
    example: input.example ?? null,
    formatDescription: input.formatDescription ?? null,
    validationMessage: input.validationMessage ?? null,
    validationRegex: input.validationRegex ?? null,
    displayOrder: input.displayOrder,
    status: input.status
  };
}

export function buildUpdateIdentityTypePayload(
  input: UpdateIdentityTypePayload,
  clear: IdentityTypeUpdateClearFields
): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    example: input.example ?? null,
    formatDescription: input.formatDescription ?? null,
    validationMessage: input.validationMessage ?? null,
    validationRegex: input.validationRegex ?? null,
    displayOrder: input.displayOrder,
    status: input.status
  };
  if (clear.displayOrder) {
    payload.displayOrder = null;
  }
  return payload;
}
