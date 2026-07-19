/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { z } from 'zod';

const statusSchema = z.enum(['ACTIVE', 'INACTIVE']);

const sharedContactTypeFields = {
  typeCode: z.string().trim().min(1, 'Type code is required').max(20),
  typeName: z.string().trim().min(1, 'Type name is required').max(100),
  example: z.string().trim().max(255).optional(),
  validationRegex: z
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
    ),
  mandatory: z.boolean().default(false),
  displayOrder: z.coerce.number().int().min(0).optional(),
  status: statusSchema.default('ACTIVE')
};

export const createContactTypeSchema = z.object(sharedContactTypeFields);

export const updateContactTypeSchema = z.object(sharedContactTypeFields);

export type UpsertContactTypeInput = z.input<typeof createContactTypeSchema>;
export type UpsertContactTypePayload = z.output<typeof createContactTypeSchema>;
export type UpdateContactTypeInput = z.input<typeof updateContactTypeSchema>;
export type UpdateContactTypePayload = z.output<typeof updateContactTypeSchema>;

export type ContactTypeUpdateClearFields = {
  displayOrder: boolean;
};

export function validateCreateContactType(input: unknown) {
  return createContactTypeSchema.safeParse(input);
}

export function validateUpdateContactType(input: unknown) {
  return updateContactTypeSchema.safeParse(input);
}

export function buildUpsertContactTypePayload(
  input: UpsertContactTypePayload
): Record<string, unknown> {
  return {
    typeCode: input.typeCode,
    typeName: input.typeName,
    example: input.example ?? null,
    validationRegex: input.validationRegex ?? null,
    mandatory: input.mandatory,
    displayOrder: input.displayOrder,
    status: input.status
  };
}

export function buildUpdateContactTypePayload(
  input: UpdateContactTypePayload,
  clear: ContactTypeUpdateClearFields
): Record<string, unknown> {
  const payload: Record<string, unknown> = buildUpsertContactTypePayload(input);
  if (clear.displayOrder) {
    payload.displayOrder = null;
  }
  return payload;
}
