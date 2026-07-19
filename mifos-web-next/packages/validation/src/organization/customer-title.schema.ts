/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { z } from 'zod';
import { GENDER_FEMALE, GENDER_MALE } from '../clients/gender';

const statusSchema = z.enum(['ACTIVE', 'INACTIVE']);
const genderIdSchema = z
  .union([z.literal(GENDER_MALE), z.literal(GENDER_FEMALE)])
  .nullable()
  .optional();

const sharedCustomerTitleFields = {
  titleCode: z.string().trim().min(1, 'Title code is required').max(20),
  titleName: z.string().trim().min(1, 'Title name is required').max(100),
  genderId: genderIdSchema,
  displayOrder: z.coerce.number().int().min(0).optional(),
  status: statusSchema.default('ACTIVE')
};

export const createCustomerTitleSchema = z.object(sharedCustomerTitleFields);

export const updateCustomerTitleSchema = z.object(sharedCustomerTitleFields);

export type UpsertCustomerTitleInput = z.input<typeof createCustomerTitleSchema>;
export type UpsertCustomerTitlePayload = z.output<typeof createCustomerTitleSchema>;
export type UpdateCustomerTitleInput = z.input<typeof updateCustomerTitleSchema>;
export type UpdateCustomerTitlePayload = z.output<typeof updateCustomerTitleSchema>;

export type CustomerTitleUpdateClearFields = {
  genderId: boolean;
  displayOrder: boolean;
};

export function validateCreateCustomerTitle(input: unknown) {
  return createCustomerTitleSchema.safeParse(input);
}

export function validateUpdateCustomerTitle(input: unknown) {
  return updateCustomerTitleSchema.safeParse(input);
}

export function buildUpsertCustomerTitlePayload(
  input: UpsertCustomerTitlePayload
): Record<string, unknown> {
  return {
    titleCode: input.titleCode,
    titleName: input.titleName,
    genderId: input.genderId ?? null,
    displayOrder: input.displayOrder,
    status: input.status
  };
}

export function buildUpdateCustomerTitlePayload(
  input: UpdateCustomerTitlePayload,
  clear: CustomerTitleUpdateClearFields
): Record<string, unknown> {
  const payload: Record<string, unknown> = buildUpsertCustomerTitlePayload(input);
  if (clear.genderId) {
    payload.genderId = null;
  }
  if (clear.displayOrder) {
    payload.displayOrder = null;
  }
  return payload;
}
