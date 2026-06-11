/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { z } from 'zod';

const optionalText = z.string().trim().optional().or(z.literal(''));
const optionalIsoDate = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use a valid date')
  .optional()
  .or(z.literal(''));

export const investorSearchRequestSchema = z.object({
  text: optionalText,
  effectiveFromDate: optionalIsoDate,
  effectiveToDate: optionalIsoDate,
  settlementFromDate: optionalIsoDate,
  settlementToDate: optionalIsoDate
});

export const investorSearchSchema = z.object({
  request: investorSearchRequestSchema.optional().default({}),
  page: z.coerce.number().int().min(0).default(0),
  size: z.coerce.number().int().min(1).max(200).default(50)
});

export const cancelInvestorTransferSchema = z.object({
  transferId: z.coerce.number().int().positive(),
  transferExternalId: z.string().trim().min(1, 'Transfer external ID is required')
});

export type InvestorSearchInput = z.input<typeof investorSearchSchema>;
export type InvestorSearchPayload = z.output<typeof investorSearchSchema>;
export type CancelInvestorTransferInput = z.input<typeof cancelInvestorTransferSchema>;

export function validateInvestorSearch(input: unknown) {
  return investorSearchSchema.safeParse(input);
}

export function validateCancelInvestorTransfer(input: unknown) {
  return cancelInvestorTransferSchema.safeParse(input);
}
