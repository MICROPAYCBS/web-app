/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { z } from 'zod';

const loanOriginatorNameSchema = z
  .string()
  .trim()
  .min(1, 'Name is required')
  .regex(/^[A-Za-z].*/, 'Name cannot begin with a special character or number');

const loanOriginatorSharedFields = {
  name: loanOriginatorNameSchema,
  status: z.string().trim().min(1, 'Status is required'),
  originatorTypeId: z.coerce.number().int().positive().optional(),
  channelTypeId: z.coerce.number().int().positive().optional()
};

export const createLoanOriginatorSchema = z.object({
  externalId: z.string().trim().min(1, 'External ID is required'),
  ...loanOriginatorSharedFields
});

export const updateLoanOriginatorSchema = z.object(loanOriginatorSharedFields);

export type CreateLoanOriginatorInput = z.input<typeof createLoanOriginatorSchema>;
export type CreateLoanOriginatorPayload = z.output<typeof createLoanOriginatorSchema>;
export type UpdateLoanOriginatorInput = z.input<typeof updateLoanOriginatorSchema>;
export type UpdateLoanOriginatorPayload = z.output<typeof updateLoanOriginatorSchema>;

export function validateCreateLoanOriginator(input: unknown) {
  return createLoanOriginatorSchema.safeParse(input);
}

export function validateUpdateLoanOriginator(input: unknown) {
  return updateLoanOriginatorSchema.safeParse(input);
}
