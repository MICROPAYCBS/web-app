/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { z } from 'zod';

const optionalText = z.string().trim().optional().or(z.literal(''));

export const standingInstructionHistorySearchSchema = z.object({
  clientName: optionalText,
  clientId: optionalText,
  transferType: z.coerce.number().int().positive().optional(),
  fromAccountType: z.coerce.number().int().positive().optional(),
  fromAccountId: optionalText,
  fromDate: optionalText,
  toDate: optionalText,
  locale: z.string().optional(),
  dateFormat: z.string().optional()
});

export type StandingInstructionHistorySearchInput = z.input<
  typeof standingInstructionHistorySearchSchema
>;

export function validateStandingInstructionHistorySearch(input: unknown) {
  return standingInstructionHistorySearchSchema.safeParse(input);
}
