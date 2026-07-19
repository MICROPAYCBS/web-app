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

export const depositProductDetailsStepSchema = z.object({
  name: z.string().trim().min(1, 'Name is required.').max(100),
  shortName: z.string().trim().min(1, 'Short name is required.').max(4),
  description: z.string().trim().min(1, 'Description is required.').max(500)
});

export const depositProductCurrencyStepSchema = z.object({
  currencyCode: z.string().trim().min(1, 'Select a currency.').max(3),
  digitsAfterDecimal: z.coerce
    .number()
    .int()
    .min(0, 'Min 0 decimal places.')
    .max(6, 'Max 6 decimal places.'),
  inMultiplesOf: optionalInMultiplesOf
});

export const depositProductTermsStepSchema = z
  .object({
    minDepositAmount: z.coerce.number().min(0).optional(),
    depositAmount: z.coerce.number().min(0).optional(),
    maxDepositAmount: z.coerce.number().min(0).optional(),
    interestCompoundingPeriodType: z.coerce.number().int().min(0).optional(),
    interestPostingPeriodType: z.coerce.number().int().min(0).optional(),
    interestCalculationType: z.coerce.number().int().min(0).optional(),
    interestCalculationDaysInYearType: z.coerce.number().int().min(0).optional()
  })
  .superRefine((data, ctx) => {
    if (data.depositAmount == null) {
      ctx.addIssue({
        code: 'custom',
        message: 'Deposit amount is required.',
        path: ['depositAmount']
      });
    }
    const requiredSelects = [
      ['interestCompoundingPeriodType', 'Interest compounding period is required.'],
      ['interestPostingPeriodType', 'Interest posting period is required.'],
      ['interestCalculationType', 'Interest calculation is required.'],
      ['interestCalculationDaysInYearType', 'Days in year is required.']
    ] as const;
    for (const [path, message] of requiredSelects) {
      if (data[path] == null) {
        ctx.addIssue({ code: 'custom', message, path: [path] });
      }
    }
  });

export const depositProductSettingsStepSchema = z
  .object({
    isMandatoryDeposit: z.boolean().optional(),
    adjustAdvanceTowardsFuturePayments: z.boolean().optional(),
    allowWithdrawal: z.boolean().optional(),
    enableLockinPeriod: z.boolean().optional(),
    lockinPeriodFrequency: z.coerce.number().int().min(1).optional(),
    lockinPeriodFrequencyType: z.coerce.number().int().min(0).optional(),
    minDepositTerm: z.coerce.number().int().min(0).optional(),
    minDepositTermTypeId: z.coerce.number().int().min(0).optional(),
    inMultiplesOfDepositTerm: z.coerce.number().int().min(0).optional(),
    inMultiplesOfDepositTermTypeId: z.coerce.number().int().min(0).optional(),
    maxDepositTerm: z.coerce.number().int().min(0).optional(),
    maxDepositTermTypeId: z.coerce.number().int().min(0).optional(),
    preClosurePenalApplicable: z.boolean().optional(),
    preClosurePenalInterest: z.coerce.number().min(0).optional(),
    preClosurePenalInterestOnTypeId: z.coerce.number().int().min(0).optional(),
    withHoldTax: z.boolean().optional(),
    taxGroupId: optionalId
  })
  .superRefine((data, ctx) => {
    if (data.minDepositTerm == null) {
      ctx.addIssue({
        code: 'custom',
        message: 'Minimum deposit term is required.',
        path: ['minDepositTerm']
      });
    }
    if (data.minDepositTermTypeId == null) {
      ctx.addIssue({
        code: 'custom',
        message: 'Minimum deposit term type is required.',
        path: ['minDepositTermTypeId']
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
          message: 'Lock-in period type is required.',
          path: ['lockinPeriodFrequencyType']
        });
      }
    }
    if (data.preClosurePenalApplicable) {
      if (data.preClosurePenalInterest == null) {
        ctx.addIssue({
          code: 'custom',
          message: 'Pre-closure penalty interest is required.',
          path: ['preClosurePenalInterest']
        });
      }
      if (data.preClosurePenalInterestOnTypeId == null) {
        ctx.addIssue({
          code: 'custom',
          message: 'Pre-closure penalty type is required.',
          path: ['preClosurePenalInterestOnTypeId']
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
  });

const chartIncentiveSchema = z.object({
  entityType: z.coerce.number().int().min(0),
  attributeName: z.coerce.number().int().min(0),
  conditionType: z.coerce.number().int().min(0),
  attributeValue: z.string().trim().min(1, 'Attribute value is required.'),
  incentiveType: z.coerce.number().int().min(0),
  amount: z.coerce.number().min(0, 'Incentive amount is required.')
});

const chartSlabSchema = z
  .object({
    id: optionalId,
    periodType: z.coerce.number().int().min(0).optional(),
    fromPeriod: z.coerce.number().int().min(0).optional(),
    toPeriod: z.coerce.number().int().min(0).optional(),
    amountRangeFrom: z.coerce.number().min(0).optional(),
    amountRangeTo: z.coerce.number().min(0).optional(),
    annualInterestRate: z.coerce.number().min(0).optional(),
    description: z.string().trim().min(1, 'Description is required.'),
    incentives: z.array(chartIncentiveSchema).default([])
  })
  .superRefine((data, ctx) => {
    if (data.periodType == null) {
      ctx.addIssue({
        code: 'custom',
        message: 'Period type is required.',
        path: ['periodType']
      });
    }
    if (data.fromPeriod == null) {
      ctx.addIssue({
        code: 'custom',
        message: 'Period from is required.',
        path: ['fromPeriod']
      });
    }
    if (data.annualInterestRate == null) {
      ctx.addIssue({
        code: 'custom',
        message: 'Interest rate is required.',
        path: ['annualInterestRate']
      });
    }
  });

const chartSchema = z.object({
  id: optionalId,
  name: z.string().trim().optional().or(z.literal('')),
  description: z.string().trim().optional().or(z.literal('')),
  fromDate: z.string().trim().min(1, 'From date is required.'),
  endDate: z.string().trim().optional().or(z.literal('')),
  isPrimaryGroupingByAmount: z.boolean().default(false),
  chartSlabs: z.array(chartSlabSchema).min(1, 'Add at least one chart slab.')
});

export const depositProductInterestRateChartStepSchema = z.object({
  charts: z.array(chartSchema).min(1, 'Add at least one interest rate chart.')
});

export const depositProductChargesStepSchema = z.object({
  chargeIds: z.array(z.coerce.number().int().positive()).default([])
});

function refineDepositAccounting(
  data: {
    accountingRule: number;
    savingsReferenceAccountId?: number;
    savingsControlAccountId?: number;
    transfersInSuspenseAccountId?: number;
    interestOnSavingsAccountId?: number;
    incomeFromFeeAccountId?: number;
    incomeFromPenaltyAccountId?: number;
    feesReceivableAccountId?: number;
    penaltiesReceivableAccountId?: number;
    interestPayableAccountId?: number;
  },
  ctx: z.RefinementCtx
) {
  if (data.accountingRule === 1) {
    return;
  }

  const required = [
    'savingsReferenceAccountId',
    'savingsControlAccountId',
    'transfersInSuspenseAccountId',
    'interestOnSavingsAccountId',
    'incomeFromFeeAccountId',
    'incomeFromPenaltyAccountId'
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
}

const depositProductAccountingCoreSchema = z.object({
  accountingRule: z.coerce.number().int().min(2).max(3),
  savingsReferenceAccountId: glAccountId,
  savingsControlAccountId: glAccountId,
  transfersInSuspenseAccountId: glAccountId,
  interestOnSavingsAccountId: glAccountId,
  incomeFromFeeAccountId: glAccountId,
  incomeFromPenaltyAccountId: glAccountId,
  feesReceivableAccountId: glAccountId,
  penaltiesReceivableAccountId: glAccountId,
  interestPayableAccountId: glAccountId,
  advancedAccountingRules: z.boolean().optional(),
  paymentChannelToFundSourceMappings: z.array(paymentChannelMappingSchema).default([]),
  feeToIncomeAccountMappings: z.array(chargeIncomeMappingSchema).default([]),
  penaltyToIncomeAccountMappings: z.array(chargeIncomeMappingSchema).default([])
});

export const depositProductAccountingStepSchema = depositProductAccountingCoreSchema.superRefine(
  refineDepositAccounting
);

export const depositProductAccountingCoreStepSchema = depositProductAccountingCoreSchema;

export function validateDepositProductAccounting(data: DepositProductAccountingInput) {
  return depositProductAccountingCoreSchema.superRefine(refineDepositAccounting);
}

export const upsertDepositProductSchema = z.object({
  variant: z.enum(['recurring', 'fixed']),
  details: depositProductDetailsStepSchema,
  currency: depositProductCurrencyStepSchema,
  terms: depositProductTermsStepSchema,
  settings: depositProductSettingsStepSchema,
  interestRateChart: depositProductInterestRateChartStepSchema,
  charges: depositProductChargesStepSchema,
  accounting: depositProductAccountingStepSchema
});

export type DepositProductDetailsInput = z.infer<typeof depositProductDetailsStepSchema>;
export type DepositProductCurrencyInput = z.infer<typeof depositProductCurrencyStepSchema>;
export type DepositProductTermsInput = z.infer<typeof depositProductTermsStepSchema>;
export type DepositProductSettingsInput = z.infer<typeof depositProductSettingsStepSchema>;
export type DepositProductInterestRateChartInput = z.infer<
  typeof depositProductInterestRateChartStepSchema
>;
export type DepositProductChargesInput = z.infer<typeof depositProductChargesStepSchema>;
export type DepositProductAccountingInput = z.infer<typeof depositProductAccountingStepSchema>;
export type UpsertDepositProductInput = z.infer<typeof upsertDepositProductSchema>;
