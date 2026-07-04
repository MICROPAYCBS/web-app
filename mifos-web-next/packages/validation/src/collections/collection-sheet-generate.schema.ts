/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { z } from 'zod';

export const generateCollectionSheetSchema = z.object({
  officeId: z.coerce.number().int().positive(),
  staffId: z.coerce.number().int().positive().optional(),
  transactionDate: z.string().trim().min(1),
  locale: z.string().optional(),
  dateFormat: z.string().optional()
});

export type GenerateCollectionSheetInput = z.input<typeof generateCollectionSheetSchema>;

export function validateGenerateCollectionSheet(input: unknown) {
  return generateCollectionSheetSchema.safeParse(input);
}
