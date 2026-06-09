/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { z } from 'zod';
import { optionalInMultiplesOf } from './product-currency.schema';

const glAccountId = z.coerce.number().int().positive().optional();

export const shareProductDetailsStepSchema = z.object({
  name: z.string().trim().min(1, 'Name is required.').max(100),
  shortName: z.string().trim().min(1, 'Short name is required.').max(4),
  description: z.string().trim().min(1, 'Description is required.').max(500)
});

export const shareProductCurrencyStepSchema = z.object({
  currencyCode: z.string().trim().min(1, 'Select a currency.').max(3),
  digitsAfterDecimal: z.coerce
    .number()
    .int()
    .min(0, 'Min 0 decimal places.')
    .max(6, 'Max 6 decimal places.'),
  inMultiplesOf: optionalInMultiplesOf
});

export const shareProductTermsStepSchema = z
  .object({
    totalShares: z.coerce.number().int().min(1, 'Total shares must be at least 1.'),
    sharesIssued: z.coerce.number().int().min(1, 'Shares issued must be at least 1.'),
    unitPrice: z.coerce.number().min(1, 'Unit price must be at least 1.'),
    shareCapital: z.coerce.number().min(0).optional()
  })
  .superRefine((data, ctx) => {
    if (data.sharesIssued > data.totalShares) {
      ctx.addIssue({
        code: 'custom',
        message: 'Shares issued cannot exceed total shares.',
        path: ['sharesIssued']
      });
    }
  });

export const shareProductSettingsStepSchema = z
  .object({
    minimumShares: z.coerce.number().int().min(1, 'Must be at least 1.').optional(),
    nominalShares: z.coerce.number().int().min(1, 'Nominal shares is required.'),
    maximumShares: z.coerce.number().int().min(1, 'Must be at least 1.').optional(),
    minimumActivePeriodForDividends: z.coerce
      .number()
      .int()
      .min(1, 'Minimum active period is required.'),
    minimumactiveperiodFrequencyType: z.coerce.number().int().min(0).optional(),
    enableLockinPeriod: z.boolean().optional(),
    lockinPeriodFrequency: z.coerce.number().int().min(1).optional(),
    lockinPeriodFrequencyType: z.coerce.number().int().min(0).optional(),
    allowDividendCalculationForInactiveClients: z.boolean().optional()
  })
  .superRefine((data, ctx) => {
    const { minimumShares, nominalShares, maximumShares } = data;
    if (
      minimumShares != null &&
      nominalShares != null &&
      maximumShares != null &&
      (minimumShares > nominalShares || nominalShares > maximumShares)
    ) {
      ctx.addIssue({
        code: 'custom',
        message:
          'Minimum shares must be less than or equal to nominal, and nominal less than or equal to maximum.',
        path: ['nominalShares']
      });
    }
    if (data.enableLockinPeriod) {
      if (!data.lockinPeriodFrequency) {
        ctx.addIssue({
          code: 'custom',
          message: 'Lock-in frequency is required.',
          path: ['lockinPeriodFrequency']
        });
      }
      if (data.lockinPeriodFrequencyType == null) {
        ctx.addIssue({
          code: 'custom',
          message: 'Lock-in frequency type is required.',
          path: ['lockinPeriodFrequencyType']
        });
      }
    }
  });

const marketPricePeriodSchema = z.object({
  fromDate: z.string().trim().min(1, 'From date is required.'),
  shareValue: z.coerce.number().min(1, 'Share value must be at least 1.')
});

export const shareProductMarketPriceStepSchema = z.object({
  marketPricePeriods: z.array(marketPricePeriodSchema).default([])
});

export const shareProductChargesStepSchema = z.object({
  chargeIds: z.array(z.coerce.number().int().positive()).default([])
});

function refineShareAccounting(
  data: {
    accountingRule: number;
    shareReferenceId?: number;
    shareSuspenseId?: number;
    shareEquityId?: number;
    incomeFromFeeAccountId?: number;
  },
  ctx: z.RefinementCtx
) {
  if (data.accountingRule === 1) {
    return;
  }
  for (const key of [
    'shareReferenceId',
    'shareSuspenseId',
    'shareEquityId',
    'incomeFromFeeAccountId'
  ] as const) {
    if (!data[key]) {
      ctx.addIssue({
        code: 'custom',
        message: 'Required for cash accounting.',
        path: [key]
      });
    }
  }
}

export const shareProductAccountingStepSchema = z
  .object({
    accountingRule: z.coerce.number().int().min(1).max(2),
    shareReferenceId: glAccountId,
    shareSuspenseId: glAccountId,
    shareEquityId: glAccountId,
    incomeFromFeeAccountId: glAccountId
  })
  .superRefine((data, ctx) => refineShareAccounting(data, ctx));

export const upsertShareProductSchema = z
  .object({
    details: shareProductDetailsStepSchema,
    currency: shareProductCurrencyStepSchema,
    terms: shareProductTermsStepSchema,
    settings: shareProductSettingsStepSchema,
    marketPrice: shareProductMarketPriceStepSchema,
    charges: shareProductChargesStepSchema,
    accounting: shareProductAccountingStepSchema
  })
  .superRefine((data, ctx) => {
    refineShareAccounting(data.accounting, ctx);
  });

export type ShareProductDetailsInput = z.infer<typeof shareProductDetailsStepSchema>;
export type ShareProductCurrencyInput = z.infer<typeof shareProductCurrencyStepSchema>;
export type ShareProductTermsInput = z.infer<typeof shareProductTermsStepSchema>;
export type ShareProductSettingsInput = z.infer<typeof shareProductSettingsStepSchema>;
export type ShareProductMarketPriceInput = z.infer<typeof shareProductMarketPriceStepSchema>;
export type ShareProductChargesInput = z.infer<typeof shareProductChargesStepSchema>;
export type ShareProductAccountingInput = z.infer<typeof shareProductAccountingStepSchema>;
export type UpsertShareProductInput = z.infer<typeof upsertShareProductSchema>;
