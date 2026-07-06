/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { z } from 'zod';

const optionalId = z.coerce
  .number()
  .int()
  .positive()
  .optional()
  .or(z.literal(''))
  .transform((v) => (v === '' ? undefined : v));

const submittedOnDate = z.string().trim().min(1, 'Submitted date is required.');

const optionalNonNegativeNumber = z
  .union([z.coerce.number().min(0), z.literal('')])
  .optional()
  .transform((value) => (value === '' || value === undefined ? undefined : value));

export const createClientSavingsAccountSchema = z.object({
  productId: z.coerce.number().int().positive('Select a product.'),
  submittedOnDate,
  externalId: z.string().trim().max(100).optional().or(z.literal('')),
  fieldOfficerId: z.coerce.number().int().positive('Select a field officer.'),
  nominalAnnualInterestRate: optionalNonNegativeNumber,
  interestCompoundingPeriodType: optionalId,
  interestPostingPeriodType: optionalId,
  interestCalculationType: optionalId,
  interestCalculationDaysInYearType: optionalId,
  minRequiredOpeningBalance: optionalNonNegativeNumber,
  withdrawalFeeForTransfers: z.boolean().optional(),
  lockinPeriodFrequency: z
    .union([z.coerce.number().int().min(0), z.literal('')])
    .optional()
    .transform((value) => (value === '' || value === undefined ? undefined : value)),
  lockinPeriodFrequencyType: optionalId,
  allowOverdraft: z.boolean().optional(),
  overdraftLimit: optionalNonNegativeNumber,
  minOverdraftForInterestCalculation: optionalNonNegativeNumber,
  nominalAnnualInterestRateOverdraft: optionalNonNegativeNumber,
  enforceMinRequiredBalance: z.boolean().optional(),
  minRequiredBalance: optionalNonNegativeNumber
});

export const createClientFixedDepositAccountSchema = z.object({
  productId: z.coerce.number().int().positive('Select a product.'),
  submittedOnDate,
  depositAmount: z.coerce.number().positive('Deposit amount is required.'),
  depositPeriod: z.coerce.number().int().positive('Deposit period is required.'),
  depositPeriodFrequencyId: z.coerce.number().int().positive('Select a period frequency.'),
  externalId: z.string().trim().max(100).optional().or(z.literal('')),
  fieldOfficerId: optionalId
});

export const createClientRecurringDepositAccountSchema = z.object({
  productId: z.coerce.number().int().positive('Select a product.'),
  submittedOnDate,
  depositAmount: z.coerce.number().positive('Deposit amount is required.'),
  depositPeriod: z.coerce.number().int().positive('Deposit period is required.'),
  depositPeriodFrequencyId: z.coerce.number().int().positive('Select a period frequency.'),
  recurringFrequency: z.coerce.number().int().positive('Recurring frequency is required.'),
  recurringFrequencyType: z.coerce.number().int().min(0, 'Select a recurring frequency type.'),
  mandatoryRecommendedDepositAmount: z.coerce
    .number()
    .positive('Recommended deposit amount is required.'),
  isCalendarInherited: z.boolean().default(false),
  externalId: z.string().trim().max(100).optional().or(z.literal('')),
  fieldOfficerId: optionalId
});

export type CreateClientSavingsAccountInput = z.infer<typeof createClientSavingsAccountSchema>;
export type CreateClientFixedDepositAccountInput = z.infer<
  typeof createClientFixedDepositAccountSchema
>;
export type CreateClientRecurringDepositAccountInput = z.infer<
  typeof createClientRecurringDepositAccountSchema
>;
