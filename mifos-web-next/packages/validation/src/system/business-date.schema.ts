/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { z } from 'zod';

export const businessDateTypeSchema = z.enum(['BUSINESS_DATE', 'COB_DATE']);

export const updateBusinessDateSchema = z.object({
  type: businessDateTypeSchema,
  date: z.string().trim().min(1, 'Date is required'),
  dateFormat: z.string().trim().min(1),
  locale: z.string().trim().min(1)
});

export type UpdateBusinessDateInput = z.infer<typeof updateBusinessDateSchema>;

export function validateUpdateBusinessDate(input: unknown) {
  return updateBusinessDateSchema.safeParse(input);
}
