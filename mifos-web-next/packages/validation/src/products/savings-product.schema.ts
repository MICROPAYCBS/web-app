/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { z } from 'zod';
import { optionalInMultiplesOf } from './product-currency.schema';

const optionalId = z.coerce
  .number()
  .int()
  .positive()
  .optional()
  .or(z.literal(''))
  .transform((v) => (v === '' ? undefined : v));

const glAccountId = z.coerce.number().int().positive().optional();

const paymentChannelMappingSchema = z.object({
  paymentTypeId: z.coerce.number().int().positive(),
  fundSourceAccountId: z.coerce.number().int().positive()
});

const chargeIncomeMappingSchema = z.object({
  chargeId: z.coerce.number().int().positive(),
  incomeAccountId: z.coerce.number().int().positive()
});

export const savingsProductDetailsStepSchema = z
  .object({
    name: z.string().trim().min(1, 'Name is required.').max(100),
    shortName: z.string().trim().min(1, 'Short name is required.').max(4),
    description: z.string().trim().max(500).optional().or(z.literal('')),
    startDate: z.string().trim().optional().or(z.literal('')),
    closeDate: z.string().trim().optional().or(z.literal(''))
  })
  .superRefine((data, ctx) => {
    if (!data.startDate?.trim() || !data.closeDate?.trim()) {
      return;
    }
    const start = Date.parse(data.startDate);
    const close = Date.parse(data.closeDate);
    if (Number.isNaN(start) || Number.isNaN(close)) {
      return;
    }
    if (close < start) {
      ctx.addIssue({
        code: 'custom',
        message: 'Close date must be on or after the start date.',
        path: ['closeDate']
      });
    }
  });

export const savingsProductCurrencyStepSchema = z.object({
  currencyCode: z.string().trim().min(1, 'Select a currency.').max(3),
  digitsAfterDecimal: z.coerce
    .number()
    .int()
    .min(0, 'Min 0 decimal places.')
    .max(6, 'Max 6 decimal places.'),
  inMultiplesOf: optionalInMultiplesOf
});

export const savingsProductTermsStepSchema = z.object({
  nominalAnnualInterestRate: z.coerce.number().min(0, 'Interest rate is required.'),
  interestCompoundingPeriodType: z.coerce.number().int().min(0),
  interestPostingPeriodType: z.coerce.number().int().min(0),
  interestCalculationType: z.coerce.number().int().min(0),
  interestCalculationDaysInYearType: z.coerce.number().int().min(0)
});

export const savingsProductSettingsStepSchema = z
  .object({
    minRequiredOpeningBalance: z.coerce.number().min(0).optional(),
    enableLockinPeriod: z.boolean().optional(),
    lockinPeriodFrequency: z.coerce.number().int().min(1).optional(),
    lockinPeriodFrequencyType: z.coerce.number().int().min(0).optional(),
    withdrawalFeeForTransfers: z.boolean().optional(),
    minBalanceForInterestCalculation: z.coerce.number().min(0).optional(),
    enforceMinRequiredBalance: z.boolean().optional(),
    minRequiredBalance: z.coerce.number().min(0).optional(),
    allowOverdraft: z.boolean().optional(),
    minOverdraftForInterestCalculation: z.coerce.number().min(0).optional(),
    nominalAnnualInterestRateOverdraft: z.coerce.number().min(0).optional(),
    overdraftLimit: z.coerce.number().min(0).optional(),
    withHoldTax: z.boolean().optional(),
    taxGroupId: optionalId,
    isDormancyTrackingActive: z.boolean().optional(),
    daysToInactive: z.coerce.number().int().min(0).optional(),
    daysToDormancy: z.coerce.number().int().min(0).optional(),
    daysToEscheat: z.coerce.number().int().min(0).optional()
  })
  .superRefine((data, ctx) => {
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
          message: 'Lock-in period type is required.',
          path: ['lockinPeriodFrequencyType']
        });
      }
    }
    if (data.withHoldTax && !data.taxGroupId) {
      ctx.addIssue({
        code: 'custom',
        message: 'Tax group is required when withholding tax.',
        path: ['taxGroupId']
      });
    }
    if (data.isDormancyTrackingActive) {
      for (const key of ['daysToInactive', 'daysToDormancy', 'daysToEscheat'] as const) {
        if (data[key] == null) {
          ctx.addIssue({
            code: 'custom',
            message: 'Required when dormancy tracking is enabled.',
            path: [key]
          });
        }
      }
    }
  });

export const savingsProductChargesStepSchema = z.object({
  chargeIds: z.array(z.coerce.number().int().positive()).default([])
});

function refineSavingsAccounting(
  data: {
    accountingRule: number;
    savingsReferenceAccountId?: number;
    overdraftPortfolioControlId?: number;
    savingsControlAccountId?: number;
    transfersInSuspenseAccountId?: number;
    interestOnSavingsAccountId?: number;
    writeOffAccountId?: number;
    incomeFromFeeAccountId?: number;
    incomeFromPenaltyAccountId?: number;
    incomeFromInterestId?: number;
    feesReceivableAccountId?: number;
    penaltiesReceivableAccountId?: number;
    interestReceivableAccountId?: number;
    interestPayableAccountId?: number;
    escheatLiabilityId?: number;
  },
  ctx: z.RefinementCtx,
  context?: { allowOverdraft?: boolean; isDormancyTrackingActive?: boolean }
) {
  if (data.accountingRule === 1) {
    return;
  }

  const required = [
    'savingsReferenceAccountId',
    'overdraftPortfolioControlId',
    'savingsControlAccountId',
    'transfersInSuspenseAccountId',
    'interestOnSavingsAccountId',
    'writeOffAccountId',
    'incomeFromFeeAccountId',
    'incomeFromPenaltyAccountId',
    'incomeFromInterestId'
  ] as const;

  for (const key of required) {
    if (!data[key]) {
      ctx.addIssue({
        code: 'custom',
        message: 'Required for cash/accrual accounting.',
        path: [key]
      });
    }
  }

  if (data.accountingRule === 3) {
    for (const key of [
      'feesReceivableAccountId',
      'penaltiesReceivableAccountId',
      'interestPayableAccountId'
    ] as const) {
      if (!data[key]) {
        ctx.addIssue({
          code: 'custom',
          message: 'Required for accrual accounting.',
          path: [key]
        });
      }
    }
  }

  if (context?.isDormancyTrackingActive && !data.escheatLiabilityId) {
    ctx.addIssue({
      code: 'custom',
      message: 'Escheat liability account is required when dormancy tracking is enabled.',
      path: ['escheatLiabilityId']
    });
  }
}

const savingsProductAccountingCoreSchema = z.object({
    accountingRule: z.coerce.number().int().min(2).max(3),
  savingsReferenceAccountId: glAccountId,
  overdraftPortfolioControlId: glAccountId,
  savingsControlAccountId: glAccountId,
  transfersInSuspenseAccountId: glAccountId,
  interestOnSavingsAccountId: glAccountId,
  writeOffAccountId: glAccountId,
  incomeFromFeeAccountId: glAccountId,
  incomeFromPenaltyAccountId: glAccountId,
  incomeFromInterestId: glAccountId,
  feesReceivableAccountId: glAccountId,
  penaltiesReceivableAccountId: glAccountId,
  interestReceivableAccountId: glAccountId,
  interestPayableAccountId: glAccountId,
  escheatLiabilityId: glAccountId
});

export const savingsProductMappingsStepSchema = z.object({
  paymentChannelToFundSourceMappings: z.array(paymentChannelMappingSchema).optional(),
  feeToIncomeAccountMappings: z.array(chargeIncomeMappingSchema).optional(),
  penaltyToIncomeAccountMappings: z.array(chargeIncomeMappingSchema).optional()
});

/** Wizard accounting step — GL accounts and rule only (mappings are a separate step). */
export const savingsProductAccountingCoreStepSchema =
  savingsProductAccountingCoreSchema.superRefine((data, ctx) => refineSavingsAccounting(data, ctx));

export const savingsProductAccountingStepSchema = savingsProductAccountingCoreSchema
  .merge(savingsProductMappingsStepSchema)
  .superRefine((data, ctx) => refineSavingsAccounting(data, ctx));

export function validateSavingsProductAccounting(
  accounting: z.infer<typeof savingsProductAccountingCoreSchema>,
  context?: { allowOverdraft?: boolean; isDormancyTrackingActive?: boolean }
) {
  return savingsProductAccountingCoreSchema.superRefine((data, ctx) =>
    refineSavingsAccounting(data, ctx, context)
  );
}

export const upsertSavingsProductSchema = z
  .object({
    details: savingsProductDetailsStepSchema,
    currency: savingsProductCurrencyStepSchema,
    terms: savingsProductTermsStepSchema,
    settings: savingsProductSettingsStepSchema,
    charges: savingsProductChargesStepSchema,
    accounting: savingsProductAccountingStepSchema
  })
  .superRefine((data, ctx) => {
    refineSavingsAccounting(data.accounting, ctx, {
      allowOverdraft: data.settings.allowOverdraft,
      isDormancyTrackingActive: data.settings.isDormancyTrackingActive
    });
  });

export type SavingsProductDetailsInput = z.infer<typeof savingsProductDetailsStepSchema>;
export type SavingsProductCurrencyInput = z.infer<typeof savingsProductCurrencyStepSchema>;
export type SavingsProductTermsInput = z.infer<typeof savingsProductTermsStepSchema>;
export type SavingsProductSettingsInput = z.infer<typeof savingsProductSettingsStepSchema>;
export type SavingsProductChargesInput = z.infer<typeof savingsProductChargesStepSchema>;
export type SavingsProductMappingsInput = z.infer<typeof savingsProductMappingsStepSchema>;
export type SavingsProductAccountingInput = z.infer<typeof savingsProductAccountingStepSchema>;
export type UpsertSavingsProductInput = z.infer<typeof upsertSavingsProductSchema>;
