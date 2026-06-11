/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { z } from 'zod';

const percentageField = z.coerce
  .number()
  .positive('Percentage must be greater than zero.')
  .max(100, 'Percentage cannot exceed 100.');

const startDateField = z.string().trim().min(1, 'Start date is required.');

export const createTaxComponentSchema = z.object({
  name: z.string().trim().min(1, 'Name is required.'),
  percentage: percentageField,
  debitAccountType: z.coerce.number().int().positive().optional(),
  debitAccountId: z.coerce.number().int().positive().optional(),
  creditAccountType: z.coerce.number().int().positive().optional(),
  creditAccountId: z.coerce.number().int().positive().optional(),
  startDate: startDateField
});

export const updateTaxComponentSchema = z.object({
  name: z.string().trim().min(1, 'Name is required.'),
  percentage: percentageField,
  startDate: startDateField
});

export type CreateTaxComponentInput = z.infer<typeof createTaxComponentSchema>;
export type UpdateTaxComponentInput = z.infer<typeof updateTaxComponentSchema>;
