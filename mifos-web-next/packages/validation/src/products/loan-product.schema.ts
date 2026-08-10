/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { z } from 'zod';
import {
  fineractDaysInMonthTypeSchema,
  fineractDaysInYearTypeSchema,
  fineractInterestRateFrequencyTypeSchema,
  fineractLoanScheduleOptionIdSchema,
  fineractLoanScheduleProcessingOptionIdSchema,
  fineractRepaymentFrequencyTypeSchema,
  fineractRepaymentStartDateTypeSchema,
  refineMinMaxNumberRange
} from './loan-product-fineract-rules';
import { optionalInMultiplesOf } from './product-currency.schema';

const optionalId = z.coerce.number().int().positive().optional().or(z.literal('')).transform((v) => (v === '' ? undefined : v));

export const loanProductDetailsStepSchema = z
  .object({
    name: z.string().trim().min(1, 'Name is required.').max(100),
    shortName: z.string().trim().min(1, 'Short name is required.').max(4),
    description: z.string().trim().max(500).optional().or(z.literal('')),
    externalId: z.string().trim().optional().or(z.literal('')),
    fundId: optionalId,
    startDate: z.string().trim().optional().or(z.literal('')),
    closeDate: z.string().trim().optional().or(z.literal('')),
    includeInBorrowerCycle: z.boolean().optional()
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

export const loanProductCurrencyStepSchema = z.object({
  currencyCode: z.string().trim().min(1, 'Select a currency.').max(3),
  digitsAfterDecimal: z.coerce.number().int().min(0, 'Min 0 decimal places.').max(6, 'Max 6 decimal places.'),
  inMultiplesOf: optionalInMultiplesOf,
  installmentAmountInMultiplesOf: z.coerce.number().min(0).optional()
});

function refineFixedInterestRates(
  data: {
    interestRatePerPeriod?: number;
    minInterestRatePerPeriod?: number;
    maxInterestRatePerPeriod?: number;
    interestRateFrequencyType?: number;
  },
  ctx: z.RefinementCtx
): void {
  if (data.interestRatePerPeriod === undefined) {
    ctx.addIssue({
      code: 'custom',
      message: 'Interest rate per period is required.',
      path: ['interestRatePerPeriod']
    });
    return;
  }

  if (data.interestRateFrequencyType === undefined) {
    ctx.addIssue({
      code: 'custom',
      message: 'Interest rate frequency is required.',
      path: ['interestRateFrequencyType']
    });
  }

  refineMinMaxNumberRange(ctx, {
    min: data.minInterestRatePerPeriod,
    max: data.maxInterestRatePerPeriod,
    value: data.interestRatePerPeriod,
    minPath: ['minInterestRatePerPeriod'],
    maxPath: ['maxInterestRatePerPeriod'],
    valuePath: ['interestRatePerPeriod'],
    minMaxMessage: 'Maximum interest rate must be at least the minimum.',
    valueBelowMinMessage: 'Default interest rate must be at least the minimum.',
    valueAboveMaxMessage: 'Default interest rate must not exceed the maximum.'
  });
}

function refineFloatingInterestRates(
  data: {
    floatingRatesId?: number;
    interestRateDifferential?: number;
    minDifferentialLendingRate?: number;
    defaultDifferentialLendingRate?: number;
    maxDifferentialLendingRate?: number;
    isFloatingInterestRateCalculationAllowed?: boolean;
  },
  ctx: z.RefinementCtx
): void {
  if (!data.floatingRatesId) {
    ctx.addIssue({ code: 'custom', message: 'Select a floating rate.', path: ['floatingRatesId'] });
  }
  if (data.interestRateDifferential === undefined) {
    ctx.addIssue({
      code: 'custom',
      message: 'Interest rate differential is required.',
      path: ['interestRateDifferential']
    });
  }
  if (data.minDifferentialLendingRate === undefined) {
    ctx.addIssue({
      code: 'custom',
      message: 'Minimum differential rate is required.',
      path: ['minDifferentialLendingRate']
    });
  }
  if (data.defaultDifferentialLendingRate === undefined) {
    ctx.addIssue({
      code: 'custom',
      message: 'Default differential rate is required.',
      path: ['defaultDifferentialLendingRate']
    });
  }
  if (data.maxDifferentialLendingRate === undefined) {
    ctx.addIssue({
      code: 'custom',
      message: 'Maximum differential rate is required.',
      path: ['maxDifferentialLendingRate']
    });
  }
  if (data.isFloatingInterestRateCalculationAllowed === undefined) {
    ctx.addIssue({
      code: 'custom',
      message: 'Specify whether floating interest rate calculation is allowed.',
      path: ['isFloatingInterestRateCalculationAllowed']
    });
  }

  refineMinMaxNumberRange(ctx, {
    min: data.minDifferentialLendingRate,
    max: data.maxDifferentialLendingRate,
    value: data.defaultDifferentialLendingRate,
    minPath: ['minDifferentialLendingRate'],
    maxPath: ['maxDifferentialLendingRate'],
    valuePath: ['defaultDifferentialLendingRate'],
    minMaxMessage: 'Maximum differential rate must be at least the minimum.',
    valueBelowMinMessage: 'Default differential rate must be at least the minimum.',
    valueAboveMaxMessage: 'Default differential rate must not exceed the maximum.'
  });
}

export const loanProductTermsStepSchema = z
  .object({
    isLinkedToFloatingInterestRates: z.boolean().default(false),
    principal: z.coerce.number().positive('Principal must be greater than zero.'),
    minPrincipal: z.coerce.number().positive().optional(),
    maxPrincipal: z.coerce.number().positive().optional(),
    numberOfRepayments: z.coerce.number().int().min(1, 'At least one repayment.'),
    minNumberOfRepayments: z.coerce.number().int().min(1).optional(),
    maxNumberOfRepayments: z.coerce.number().int().min(1).optional(),
    repaymentEvery: z.coerce.number().int().min(1, 'Repayment frequency is required.'),
    repaymentFrequencyType: fineractRepaymentFrequencyTypeSchema,
    interestRatePerPeriod: z.coerce.number().min(0).optional(),
    minInterestRatePerPeriod: z.coerce.number().min(0).optional(),
    maxInterestRatePerPeriod: z.coerce.number().min(0).optional(),
    interestRateFrequencyType: fineractInterestRateFrequencyTypeSchema.optional(),
    floatingRatesId: optionalId,
    interestRateDifferential: z.coerce.number().min(0).optional(),
    minDifferentialLendingRate: z.coerce.number().min(0).optional(),
    defaultDifferentialLendingRate: z.coerce.number().min(0).optional(),
    maxDifferentialLendingRate: z.coerce.number().min(0).optional(),
    isFloatingInterestRateCalculationAllowed: z.boolean().optional(),
    repaymentStartDateType: fineractRepaymentStartDateTypeSchema.optional()
  })
  .superRefine((data, ctx) => {
    refineMinMaxNumberRange(ctx, {
      min: data.minPrincipal,
      max: data.maxPrincipal,
      value: data.principal,
      minPath: ['minPrincipal'],
      maxPath: ['maxPrincipal'],
      valuePath: ['principal'],
      minMaxMessage: 'Maximum principal must be at least the minimum.',
      valueBelowMinMessage: 'Default principal must be at least the minimum.',
      valueAboveMaxMessage: 'Default principal must not exceed the maximum.'
    });

    refineMinMaxNumberRange(ctx, {
      min: data.minNumberOfRepayments,
      max: data.maxNumberOfRepayments,
      value: data.numberOfRepayments,
      minPath: ['minNumberOfRepayments'],
      maxPath: ['maxNumberOfRepayments'],
      valuePath: ['numberOfRepayments'],
      minMaxMessage: 'Maximum repayments must be at least the minimum.',
      valueBelowMinMessage: 'Number of repayments must be at least the minimum.',
      valueAboveMaxMessage: 'Number of repayments must not exceed the maximum.'
    });

    if (data.isLinkedToFloatingInterestRates) {
      refineFloatingInterestRates(data, ctx);
      return;
    }

    refineFixedInterestRates(data, ctx);
  });

export const loanProductSettingsStepSchema = z
  .object({
    amortizationType: z.coerce.number().int().min(0).max(1),
    interestType: z.coerce.number().int().min(0).max(1),
    isEqualAmortization: z.boolean().optional(),
    interestCalculationPeriodType: z.coerce.number().int().min(0).max(1),
    allowPartialPeriodInterestCalculation: z.boolean().optional(),
    transactionProcessingStrategyCode: z.string().trim().min(1, 'Select a repayment strategy.'),
    graceOnPrincipalPayment: z.coerce.number().int().min(0).optional(),
    graceOnInterestPayment: z.coerce.number().int().min(0).optional(),
    graceOnInterestCharged: z.coerce.number().int().min(0).optional(),
    inArrearsTolerance: z.coerce.number().min(0).optional(),
    daysInYearType: fineractDaysInYearTypeSchema,
    daysInMonthType: fineractDaysInMonthTypeSchema,
    daysInYearCustomStrategy: z.coerce.number().int().optional(),
    canDefineInstallmentAmount: z.boolean().optional(),
    graceOnArrearsAgeing: z.coerce.number().int().min(0).optional(),
    overdueDaysForNPA: z.coerce.number().int().min(0).optional(),
    accountMovesOutOfNPAOnlyOnArrearsCompletion: z.boolean().optional(),
    principalThresholdForLastInstallment: z.coerce
      .number()
      .min(0)
      .max(100, 'Principal threshold must be between 0 and 100.')
      .optional(),
    allowVariableInstallments: z.boolean().optional(),
    minimumGap: z.coerce.number().int().min(0).optional(),
    maximumGap: z.coerce.number().int().min(0).optional(),
    disallowExpectedDisbursements: z.boolean().optional(),
    canUseForTopup: z.boolean().optional(),
    isInterestRecalculationEnabled: z.boolean().optional(),
    holdGuaranteeFunds: z.boolean().optional(),
    mandatoryGuarantee: z.coerce.number().min(0).optional(),
    minimumGuaranteeFromOwnFunds: z.coerce.number().min(0).optional(),
    minimumGuaranteeFromGuarantor: z.coerce.number().min(0).optional(),
    multiDisburseLoan: z.boolean().optional(),
    maxTrancheCount: z.coerce.number().int().min(1).optional(),
    allowFullTermForTranche: z.boolean().optional(),
    enableDownPayment: z.boolean().optional(),
    disbursedAmountPercentageForDownPayment: z.coerce.number().min(0).max(100).optional(),
    enableAutoRepaymentForDownPayment: z.boolean().optional(),
    enableInstallmentLevelDelinquency: z.boolean().optional(),
    delinquencyBucketId: optionalId,
    useDueForRepaymentsConfigurations: z.boolean().optional(),
    dueDaysForRepaymentEvent: z.coerce.number().int().min(0).optional(),
    overDueDaysForRepaymentEvent: z.coerce.number().int().min(0).optional(),
    loanScheduleType: fineractLoanScheduleOptionIdSchema,
    loanScheduleProcessingType: fineractLoanScheduleProcessingOptionIdSchema.optional(),
    allowAccrualPostingInArrears: z.boolean().optional(),
    syncExpectedWithDisbursementDate: z.boolean().optional(),
    allowApprovedDisbursedAmountsOverApplied: z.boolean().optional(),
    overAppliedCalculationType: z.enum(['percentage', 'flat']).optional(),
    overAppliedNumber: z.coerce.number().min(0).optional(),
    allowAttributeConfiguration: z.boolean().optional(),
    allowAttributeOverrides: z
      .object({
        amortizationType: z.boolean().optional(),
        interestType: z.boolean().optional(),
        transactionProcessingStrategyCode: z.boolean().optional(),
        interestCalculationPeriodType: z.boolean().optional(),
        inArrearsTolerance: z.boolean().optional(),
        repaymentEvery: z.boolean().optional(),
        graceOnPrincipalAndInterestPayment: z.boolean().optional(),
        graceOnArrearsAgeing: z.boolean().optional(),
        delinquencyBucketClassification: z.boolean().optional(),
        discountDefault: z.boolean().optional(),
        periodPaymentFrequency: z.boolean().optional(),
        periodPaymentFrequencyType: z.boolean().optional(),
        breach: z.boolean().optional()
      })
      .optional()
  })
  .superRefine((data, ctx) => {
    if (data.allowVariableInstallments) {
      if (data.minimumGap == null) {
        ctx.addIssue({
          code: 'custom',
          message: 'Minimum gap is required when variable installments are enabled.',
          path: ['minimumGap']
        });
      }
      if (data.maximumGap == null) {
        ctx.addIssue({
          code: 'custom',
          message: 'Maximum gap is required when variable installments are enabled.',
          path: ['maximumGap']
        });
      } else if (data.minimumGap != null && data.maximumGap < data.minimumGap) {
        ctx.addIssue({
          code: 'custom',
          message: 'Maximum gap must be at least the minimum gap.',
          path: ['maximumGap']
        });
      }
    }

    if (data.multiDisburseLoan && data.maxTrancheCount == null) {
      ctx.addIssue({
        code: 'custom',
        message: 'Maximum tranche count is required when multiple disbursements are enabled.',
        path: ['maxTrancheCount']
      });
    }

    if (data.enableDownPayment) {
      if (data.disbursedAmountPercentageForDownPayment == null) {
        ctx.addIssue({
          code: 'custom',
          message: 'Down payment percentage is required when down payment is enabled.',
          path: ['disbursedAmountPercentageForDownPayment']
        });
      } else if (data.disbursedAmountPercentageForDownPayment < 1) {
        ctx.addIssue({
          code: 'custom',
          message: 'Down payment percentage must be at least 1.',
          path: ['disbursedAmountPercentageForDownPayment']
        });
      }
    }

    if (data.enableInstallmentLevelDelinquency && !data.delinquencyBucketId) {
      ctx.addIssue({
        code: 'custom',
        message: 'Select a delinquency bucket before enabling installment-level delinquency.',
        path: ['delinquencyBucketId']
      });
    }

    if (data.holdGuaranteeFunds) {
      if (data.mandatoryGuarantee == null) {
        ctx.addIssue({
          code: 'custom',
          message: 'Mandatory guarantee is required when guarantee funds are held.',
          path: ['mandatoryGuarantee']
        });
      } else {
        const ownFunds = data.minimumGuaranteeFromOwnFunds ?? 0;
        const guarantor = data.minimumGuaranteeFromGuarantor ?? 0;
        if (data.mandatoryGuarantee < ownFunds + guarantor) {
          ctx.addIssue({
            code: 'custom',
            message: 'Mandatory guarantee must be at least the sum of own-fund and guarantor minimums.',
            path: ['mandatoryGuarantee']
          });
        }
      }
    }

    if (data.allowApprovedDisbursedAmountsOverApplied) {
      if (!data.overAppliedCalculationType) {
        ctx.addIssue({
          code: 'custom',
          message: 'Select how over-applied amounts are calculated.',
          path: ['overAppliedCalculationType']
        });
      }
      if (data.overAppliedNumber == null) {
        ctx.addIssue({
          code: 'custom',
          message: 'Over-applied amount is required when over-application is allowed.',
          path: ['overAppliedNumber']
        });
      }
    }
  });

export const loanProductChargesStepSchema = z.object({
  chargeIds: z.array(z.coerce.number().int().positive()).default([]),
  /** Optional product-level amount overrides keyed by charge id string. */
  chargeAmounts: z.record(z.string(), z.coerce.number().positive()).default({})
});

const glAccountId = z.coerce.number().int().positive().optional();

const paymentChannelMappingSchema = z.object({
  paymentTypeId: z.coerce.number().int().positive(),
  fundSourceAccountId: z.coerce.number().int().positive()
});

const chargeIncomeMappingSchema = z.object({
  chargeId: z.coerce.number().int().positive(),
  incomeAccountId: z.coerce.number().int().positive()
});

export const loanProductMappingsStepSchema = z.object({
  paymentChannelToFundSourceMappings: z.array(paymentChannelMappingSchema).optional(),
  feeToIncomeAccountMappings: z.array(chargeIncomeMappingSchema).optional(),
  penaltyToIncomeAccountMappings: z.array(chargeIncomeMappingSchema).optional()
});

function refineAccountingCore(
  data: {
    accountingRule: number;
    fundSourceAccountId?: number;
    loanPortfolioAccountId?: number;
    transfersInSuspenseAccountId?: number;
    interestOnLoanAccountId?: number;
    incomeFromFeeAccountId?: number;
    incomeFromPenaltyAccountId?: number;
    incomeFromRecoveryAccountId?: number;
    writeOffAccountId?: number;
    overpaymentLiabilityAccountId?: number;
    receivableInterestAccountId?: number;
    receivableFeeAccountId?: number;
    receivablePenaltyAccountId?: number;
  },
  ctx: z.RefinementCtx
) {
  if (data.accountingRule === 1) {
    return;
  }
  const required = [
    'fundSourceAccountId',
    'loanPortfolioAccountId',
    'transfersInSuspenseAccountId',
    'interestOnLoanAccountId',
    'incomeFromFeeAccountId',
    'incomeFromPenaltyAccountId',
    'incomeFromRecoveryAccountId',
    'writeOffAccountId',
    'overpaymentLiabilityAccountId'
  ] as const;
  for (const key of required) {
    if (!data[key]) {
      ctx.addIssue({ code: 'custom', message: 'Required for cash/accrual accounting.', path: [key] });
    }
  }
  if (data.accountingRule === 3 || data.accountingRule === 4) {
    for (const key of [
      'receivableInterestAccountId',
      'receivableFeeAccountId',
      'receivablePenaltyAccountId'
    ] as const) {
      if (!data[key]) {
        ctx.addIssue({ code: 'custom', message: 'Required for accrual accounting.', path: [key] });
      }
    }
  }
}

const loanProductAccountingCoreSchema = z.object({
  accountingRule: z.coerce.number().int().min(2).max(4),
  enableAccrualActivityPosting: z.boolean().optional(),
  fundSourceAccountId: glAccountId,
  loanPortfolioAccountId: glAccountId,
  transfersInSuspenseAccountId: glAccountId,
  interestOnLoanAccountId: glAccountId,
  incomeFromFeeAccountId: glAccountId,
  incomeFromPenaltyAccountId: glAccountId,
  incomeFromRecoveryAccountId: glAccountId,
  writeOffAccountId: glAccountId,
  overpaymentLiabilityAccountId: glAccountId,
  receivableInterestAccountId: glAccountId,
  receivableFeeAccountId: glAccountId,
  receivablePenaltyAccountId: glAccountId,
  goodwillCreditAccountId: glAccountId,
  chargeOffExpenseAccountId: glAccountId,
  chargeOffFraudExpenseAccountId: glAccountId,
  incomeFromChargeOffInterestAccountId: glAccountId,
  incomeFromChargeOffFeesAccountId: glAccountId,
  incomeFromChargeOffPenaltyAccountId: glAccountId,
  incomeFromGoodwillCreditInterestAccountId: glAccountId,
  incomeFromGoodwillCreditFeesAccountId: glAccountId,
  incomeFromGoodwillCreditPenaltyAccountId: glAccountId
});

/** Wizard accounting step — GL accounts and rule only (mappings are a separate step). */
export const loanProductAccountingCoreStepSchema =
  loanProductAccountingCoreSchema.superRefine(refineAccountingCore);

export const loanProductAccountingStepSchema = loanProductAccountingCoreSchema
  .merge(loanProductMappingsStepSchema)
  .superRefine(refineAccountingCore);

function refineUpsertLoanProductCrossStep(
  data: {
    terms: z.infer<typeof loanProductTermsStepSchema>;
    settings: z.infer<typeof loanProductSettingsStepSchema>;
  },
  ctx: z.RefinementCtx
): void {
  const repayments = data.terms.numberOfRepayments;

  if (
    data.settings.graceOnPrincipalPayment != null &&
    data.settings.graceOnPrincipalPayment >= repayments
  ) {
    ctx.addIssue({
      code: 'custom',
      message: 'Grace on principal must be less than the number of repayments.',
      path: ['settings', 'graceOnPrincipalPayment']
    });
  }

  if (
    data.settings.graceOnInterestPayment != null &&
    data.settings.graceOnInterestPayment >= repayments
  ) {
    ctx.addIssue({
      code: 'custom',
      message: 'Grace on interest payment must be less than the number of repayments.',
      path: ['settings', 'graceOnInterestPayment']
    });
  }

  if (
    data.settings.graceOnInterestCharged != null &&
    data.settings.graceOnInterestCharged >= repayments
  ) {
    ctx.addIssue({
      code: 'custom',
      message: 'Grace on interest charged must be less than the number of repayments.',
      path: ['settings', 'graceOnInterestCharged']
    });
  }

  if (data.terms.isLinkedToFloatingInterestRates) {
    if (data.settings.interestType !== 0) {
      ctx.addIssue({
        code: 'custom',
        message: 'Floating interest rates require declining-balance interest.',
        path: ['settings', 'interestType']
      });
    }
    if (!data.settings.isInterestRecalculationEnabled) {
      ctx.addIssue({
        code: 'custom',
        message: 'Floating interest rates require interest recalculation to be enabled.',
        path: ['settings', 'isInterestRecalculationEnabled']
      });
    }
  }
}

export const upsertLoanProductSchema = z
  .object({
    details: loanProductDetailsStepSchema,
    currency: loanProductCurrencyStepSchema,
    terms: loanProductTermsStepSchema,
    settings: loanProductSettingsStepSchema,
    charges: loanProductChargesStepSchema,
    accounting: loanProductAccountingStepSchema
  })
  .superRefine(refineUpsertLoanProductCrossStep);

export type LoanProductDetailsInput = z.infer<typeof loanProductDetailsStepSchema>;
export type LoanProductCurrencyInput = z.infer<typeof loanProductCurrencyStepSchema>;
export type LoanProductTermsInput = z.infer<typeof loanProductTermsStepSchema>;
export type LoanProductSettingsInput = z.infer<typeof loanProductSettingsStepSchema>;
export type LoanProductChargesInput = z.infer<typeof loanProductChargesStepSchema>;
export type LoanProductMappingsInput = z.infer<typeof loanProductMappingsStepSchema>;
export type LoanProductAccountingInput = z.infer<typeof loanProductAccountingStepSchema>;
export type UpsertLoanProductInput = z.infer<typeof upsertLoanProductSchema>;
