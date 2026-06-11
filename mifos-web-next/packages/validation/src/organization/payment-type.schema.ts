/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { z } from 'zod';

const paymentTypeFields = {
  name: z.string().trim().min(1, 'Payment type name is required').max(200),
  description: z.string().trim().optional(),
  isCashPayment: z.boolean().default(false),
  position: z.coerce.number().int().min(1, 'Position must be at least 1')
};

export const createPaymentTypeSchema = z.object(paymentTypeFields);

export const updatePaymentTypeSchema = z.object({
  name: paymentTypeFields.name,
  description: paymentTypeFields.description,
  isCashPayment: z.boolean().optional(),
  position: paymentTypeFields.position.optional()
});

export const updateSystemPaymentTypeSchema = z.object({
  name: paymentTypeFields.name,
  description: paymentTypeFields.description
});

export type CreatePaymentTypeInput = z.input<typeof createPaymentTypeSchema>;
export type CreatePaymentTypePayload = z.output<typeof createPaymentTypeSchema>;
export type UpdatePaymentTypeInput = z.input<typeof updatePaymentTypeSchema>;
export type UpdatePaymentTypePayload = z.output<typeof updatePaymentTypeSchema>;
export type UpdateSystemPaymentTypeInput = z.input<typeof updateSystemPaymentTypeSchema>;
export type UpdateSystemPaymentTypePayload = z.output<typeof updateSystemPaymentTypeSchema>;

export function validateCreatePaymentType(input: unknown) {
  return createPaymentTypeSchema.safeParse(input);
}

export function validateUpdatePaymentType(input: unknown, isSystemDefined: boolean) {
  if (isSystemDefined) {
    return updateSystemPaymentTypeSchema.safeParse(input);
  }
  return updatePaymentTypeSchema.safeParse(input);
}
