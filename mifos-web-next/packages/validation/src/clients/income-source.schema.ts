/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { z } from 'zod';

const optionalFineractDate = z.string().trim().optional();

export const incomeSourceSchema = z
  .object({
    incomeSourceTypeId: z.coerce.number().int().positive(),
    sourceOfFundsId: z.coerce.number().int().positive().optional(),
    employerBusinessName: z.string().trim().max(200).optional().or(z.literal('')),
    employerAddress: z.string().trim().max(500).optional().or(z.literal('')),
    occupation: z.string().trim().max(100).optional().or(z.literal('')),
    subIndustryId: z.coerce.number().int().positive().optional(),
    monthlyIncome: z.coerce.number().nonnegative().optional(),
    incomeCurrencyCode: z.string().trim().max(3).optional().or(z.literal('')),
    incomeFrequencyId: z.coerce.number().int().positive().optional(),
    startDate: optionalFineractDate,
    endDate: optionalFineractDate,
    isPrimarySource: z.boolean().optional(),
    verificationStatusId: z.coerce.number().int().positive().optional(),
    supportingDocument: z.string().trim().max(255).optional().or(z.literal('')),
    remarks: z.string().trim().max(500).optional().or(z.literal('')),
    status: z.string().trim().max(20).optional(),
    dateFormat: z.string().optional(),
    locale: z.string().optional()
  })
  .superRefine((data, ctx) => {
    if (data.startDate?.trim() && data.endDate?.trim() && data.endDate < data.startDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'End date must be on or after start date',
        path: ['endDate']
      });
    }
  });

export type IncomeSourceInput = z.input<typeof incomeSourceSchema>;
export type IncomeSourcePayload = z.output<typeof incomeSourceSchema>;
