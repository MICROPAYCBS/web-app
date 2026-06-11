/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { z } from 'zod';

export const upsertFinancialActivityMappingFormSchema = z.object({
  financialActivityId: z.number().int().positive('Financial activity is required.'),
  glAccountId: z.number().int().positive('GL account is required.')
});

export type UpsertFinancialActivityMappingFormInput = z.infer<
  typeof upsertFinancialActivityMappingFormSchema
>;

export function validateUpsertFinancialActivityMappingForm(input: unknown) {
  return upsertFinancialActivityMappingFormSchema.safeParse(input);
}

export function buildUpsertFinancialActivityMappingPayload(
  input: UpsertFinancialActivityMappingFormInput
) {
  return {
    financialActivityId: input.financialActivityId,
    glAccountId: input.glAccountId
  };
}
