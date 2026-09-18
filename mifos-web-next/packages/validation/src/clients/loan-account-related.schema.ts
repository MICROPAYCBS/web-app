/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { z } from 'zod';

const requiredDate = z.string().trim().min(1, 'Date is required.');

export const loanInterestPauseSchema = z.object({
  startDate: requiredDate,
  endDate: requiredDate
});

export const loanDelinquencyPauseSchema = loanInterestPauseSchema;

export const loanDelinquencyResumeSchema = z.object({
  startDate: requiredDate
});

export const loanTrancheRowSchema = z.object({
  id: z.coerce.number().int().positive().optional(),
  expectedDisbursementDate: requiredDate,
  principal: z.coerce.number().positive('Principal must be greater than zero.')
});

export const loanTrancheEditSchema = z.object({
  disbursementData: z
    .array(loanTrancheRowSchema)
    .min(1, 'Add at least one expected disbursement.')
});

export type LoanInterestPauseInput = z.infer<typeof loanInterestPauseSchema>;
export type LoanDelinquencyPauseInput = z.infer<typeof loanDelinquencyPauseSchema>;
export type LoanDelinquencyResumeInput = z.infer<typeof loanDelinquencyResumeSchema>;
export type LoanTrancheRowInput = z.infer<typeof loanTrancheRowSchema>;
export type LoanTrancheEditInput = z.infer<typeof loanTrancheEditSchema>;
