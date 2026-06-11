/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { z } from 'zod';

const tellerNamePattern = /^[A-Za-z].*/;
const fineractDate = z.string().trim().min(1);
const tellerStatus = z.coerce
  .number()
  .int()
  .refine((value) => value === 300 || value === 400, {
    message: 'Status is required'
  });

const tellerFields = {
  officeId: z.coerce.number().int().positive('Branch is required'),
  name: z
    .string()
    .trim()
    .min(1, 'Teller name is required')
    .max(200)
    .regex(tellerNamePattern, {
      message: 'Teller name cannot begin with a number or special character'
    }),
  description: z.string().trim().optional().or(z.literal('')),
  startDate: fineractDate,
  endDate: z.string().trim().optional().or(z.literal('')),
  status: tellerStatus,
  dateFormat: z.string().optional(),
  locale: z.string().optional()
};

export const createTellerSchema = z.object(tellerFields);

export const updateTellerSchema = z.object(tellerFields);

export type CreateTellerInput = z.input<typeof createTellerSchema>;
export type CreateTellerPayload = z.output<typeof createTellerSchema>;
export type UpdateTellerInput = z.input<typeof updateTellerSchema>;
export type UpdateTellerPayload = z.output<typeof updateTellerSchema>;

export function validateCreateTeller(input: unknown) {
  return createTellerSchema.safeParse(input);
}

export function validateUpdateTeller(input: unknown) {
  return updateTellerSchema.safeParse(input);
}
