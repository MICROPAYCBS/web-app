/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { z } from 'zod';
import { optionalInMultiplesOf } from './product-currency.schema';

const optionalId = z.coerce.number().int().positive().optional().or(z.literal('')).transform((v) => (v === '' ? undefined : v));

export const loanProductDetailsStepSchema = z.object({
  name: z.string().trim().min(1, 'Name is required.').max(100),
  shortName: z.string().trim().min(1, 'Short name is required.').max(4),
  description: z.string().trim().max(500).optional().or(z.literal('')),
  externalId: z.string().trim().optional().or(z.literal('')),
  fundId: optionalId,
  startDate: z.string().trim().optional().or(z.literal('')),
  closeDate: z.string().trim().optional().or(z.literal('')),
  includeInBorrowerCycle: z.boolean().optional()
});

export const loanProductCurrencyStepSchema = z.object({
  currencyCode: z.string().trim().min(1, 'Select a currency.').max(3),
  digitsAfterDecimal: z.coerce.number().int().min(0, 'Min 0 decimal places.').max(6, 'Max 6 decimal places.'),
  inMultiplesOf: optionalInMultiplesOf,
  installmentAmountInMultiplesOf: z.coerce.number().min(0).optional()
});

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
    repaymentFrequencyType: z.coerce.number().int().min(0).max(3),
    interestRatePerPeriod: z.coerce.number().min(0).optional(),
    minInterestRatePerPeriod: z.coerce.number().min(0).optional(),
    maxInterestRatePerPeriod: z.coerce.number().min(0).optional(),
    interestRateFrequencyType: z.coerce.number().int().min(0).max(3).optional(),
    floatingRatesId: optionalId,
    interestRateDifferential: z.coerce.number().optional(),
    minDifferentialLendingRate: z.coerce.number().optional(),
    defaultDifferentialLendingRate: z.coerce.number().optional(),
    maxDifferentialLendingRate: z.coerce.number().optional(),
    isFloatingInterestRateCalculationAllowed: z.boolean().optional(),
    repaymentStartDateType: z.coerce.number().int().optional()
  })
  .superRefine((data, ctx) => {
    if (data.isLinkedToFloatingInterestRates) {
      if (!data.floatingRatesId) {
        ctx.addIssue({ code: 'custom', message: 'Select a floating rate.', path: ['floatingRatesId'] });
      }
      if (data.defaultDifferentialLendingRate === undefined) {
        ctx.addIssue({
          code: 'custom',
          message: 'Default differential rate is required.',
          path: ['defaultDifferentialLendingRate']
        });
      }
    } else if (data.interestRatePerPeriod === undefined) {
      ctx.addIssue({
        code: 'custom',
        message: 'Interest rate per period is required.',
        path: ['interestRatePerPeriod']
      });
    } else if (data.interestRateFrequencyType === undefined) {
      ctx.addIssue({
        code: 'custom',
        message: 'Interest rate frequency is required.',
        path: ['interestRateFrequencyType']
      });
    } else {
      if (
        data.minInterestRatePerPeriod != null &&
        data.maxInterestRatePerPeriod != null &&
        data.maxInterestRatePerPeriod < data.minInterestRatePerPeriod
      ) {
        ctx.addIssue({
          code: 'custom',
          message: 'Maximum interest rate must be at least the minimum.',
          path: ['maxInterestRatePerPeriod']
        });
      }
      if (
        data.interestRatePerPeriod != null &&
        data.minInterestRatePerPeriod != null &&
        data.interestRatePerPeriod < data.minInterestRatePerPeriod
      ) {
        ctx.addIssue({
          code: 'custom',
          message: 'Default interest rate must be at least the minimum.',
          path: ['interestRatePerPeriod']
        });
      }
      if (
        data.interestRatePerPeriod != null &&
        data.maxInterestRatePerPeriod != null &&
        data.interestRatePerPeriod > data.maxInterestRatePerPeriod
      ) {
        ctx.addIssue({
          code: 'custom',
          message: 'Default interest rate must not exceed the maximum.',
          path: ['interestRatePerPeriod']
        });
      }
    }
  });

export const loanProductSettingsStepSchema = z.object({
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
  daysInYearType: z.coerce.number().int(),
  daysInMonthType: z.coerce.number().int(),
  daysInYearCustomStrategy: z.coerce.number().int().optional(),
  canDefineInstallmentAmount: z.boolean().optional(),
  graceOnArrearsAgeing: z.coerce.number().int().min(0).optional(),
  overdueDaysForNPA: z.coerce.number().int().min(0).optional(),
  accountMovesOutOfNPAOnlyOnArrearsCompletion: z.boolean().optional(),
  principalThresholdForLastInstallment: z.coerce.number().min(0).optional(),
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
  loanScheduleType: z.coerce.number().int(),
  loanScheduleProcessingType: z.coerce.number().int().optional(),
  allowAccrualPostingInArrears: z.boolean().optional(),
  syncExpectedWithDisbursementDate: z.boolean().optional(),
  allowApprovedDisbursedAmountsOverApplied: z.boolean().optional(),
  overAppliedCalculationType: z.string().trim().optional(),
  overAppliedNumber: z.coerce.number().optional()
});

export const loanProductChargesStepSchema = z.object({
  chargeIds: z.array(z.coerce.number().int().positive()).default([])
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

export const upsertLoanProductSchema = z.object({
  details: loanProductDetailsStepSchema,
  currency: loanProductCurrencyStepSchema,
  terms: loanProductTermsStepSchema,
  settings: loanProductSettingsStepSchema,
  charges: loanProductChargesStepSchema,
  accounting: loanProductAccountingStepSchema
});

export type LoanProductDetailsInput = z.infer<typeof loanProductDetailsStepSchema>;
export type LoanProductCurrencyInput = z.infer<typeof loanProductCurrencyStepSchema>;
export type LoanProductTermsInput = z.infer<typeof loanProductTermsStepSchema>;
export type LoanProductSettingsInput = z.infer<typeof loanProductSettingsStepSchema>;
export type LoanProductChargesInput = z.infer<typeof loanProductChargesStepSchema>;
export type LoanProductMappingsInput = z.infer<typeof loanProductMappingsStepSchema>;
export type LoanProductAccountingInput = z.infer<typeof loanProductAccountingStepSchema>;
export type UpsertLoanProductInput = z.infer<typeof upsertLoanProductSchema>;
