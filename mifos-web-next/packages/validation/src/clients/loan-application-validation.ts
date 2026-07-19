/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { CreateLoanAccountInput } from './create-loan-account.schema';
import { formatMoney } from '@mifos/domain';

/** Product limits and flags used for client-side loan application validation. */
export interface LoanApplicationProductContext {
  minPrincipal?: number;
  maxPrincipal?: number;
  minNumberOfRepayments?: number;
  maxNumberOfRepayments?: number;
  minInterestRatePerPeriod?: number;
  maxInterestRatePerPeriod?: number;
  minInterestRateDifferential?: number;
  maxInterestRateDifferential?: number;
  linkedToFloatingInterestRates?: boolean;
  currencyCode?: string;
  hasAccountTransferCharge?: boolean;
  chargeAmountLimits?: LoanApplicationChargeAmountLimit[];
}

/** Per-charge min/max caps from the loan application template. */
export interface LoanApplicationChargeAmountLimit {
  chargeId: number;
  name?: string;
  minCap?: number;
  maxCap?: number;
  chargeCalculationTypeId?: number;
  currencyCode?: string;
}

export interface LoanApplicationValidationOptions {
  /** Skip linked-savings requirements — used for calculateLoanSchedule preview. */
  schedulePreview?: boolean;
}

export function computedLoanTermFrequency(
  repaymentEvery: number,
  numberOfRepayments: number
): number {
  return repaymentEvery * numberOfRepayments;
}

export function computedNumberOfRepayments(
  loanTermFrequency: number,
  repaymentEvery: number
): number | undefined {
  if (loanTermFrequency <= 0 || repaymentEvery <= 0) {
    return undefined;
  }
  const repayments = loanTermFrequency / repaymentEvery;
  return Number.isInteger(repayments) && repayments > 0 ? repayments : undefined;
}

export function loanTermMatchesRepaymentStructure(input: {
  loanTermFrequency: number;
  loanTermFrequencyType: number;
  repaymentEvery: number;
  repaymentFrequencyType: number;
  numberOfRepayments: number;
}): boolean {
  if (input.loanTermFrequencyType !== input.repaymentFrequencyType) {
    return false;
  }
  return (
    input.loanTermFrequency ===
    computedLoanTermFrequency(input.repaymentEvery, input.numberOfRepayments)
  );
}

function formatPrincipalLimit(
  ctx: LoanApplicationProductContext | undefined,
  amount: number
): string {
  if (ctx?.currencyCode) {
    return formatMoney(amount, ctx.currencyCode) ?? String(amount);
  }
  return String(amount);
}

function formatRateLimit(value: number): string {
  return `${value}%`;
}

export function loanApplicationLinkedSavingsReasons(
  input: Pick<CreateLoanAccountInput, 'createStandingInstructionAtDisbursement'>,
  options?: Pick<LoanApplicationProductContext, 'hasAccountTransferCharge'>
): string[] {
  const reasons: string[] = [];
  if (input.createStandingInstructionAtDisbursement) {
    reasons.push('standing instruction at disbursement');
  }
  if (options?.hasAccountTransferCharge) {
    reasons.push('account-transfer fees on this application');
  }
  return reasons;
}

export function loanApplicationRequiresLinkedSavingsAccount(
  input: Pick<
    CreateLoanAccountInput,
    'linkAccountId' | 'createStandingInstructionAtDisbursement'
  >,
  options?: Pick<LoanApplicationProductContext, 'hasAccountTransferCharge'>
): boolean {
  return (
    loanApplicationLinkedSavingsReasons(input, options).length > 0 &&
    (input.linkAccountId ?? 0) <= 0
  );
}

function linkedSavingsAccountErrorMessage(reasons: string[]): string {
  if (reasons.length === 1) {
    return `Link a savings account — required for ${reasons[0]}.`;
  }
  return `Link a savings account — required for: ${reasons.join('; ')}.`;
}

/** Percentage-based charge calculation types (Fineract). */
const PERCENTAGE_CHARGE_CALCULATION_IDS = [2, 3, 4, 5] as const;

function isPercentageChargeCalculation(calculationTypeId?: number): boolean {
  return (
    calculationTypeId != null &&
    (PERCENTAGE_CHARGE_CALCULATION_IDS as readonly number[]).includes(calculationTypeId)
  );
}

function formatChargeAmountLimit(
  amount: number,
  limit: LoanApplicationChargeAmountLimit,
  currencyCode?: string
): string {
  if (isPercentageChargeCalculation(limit.chargeCalculationTypeId)) {
    return `${new Intl.NumberFormat('en', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 6
    }).format(amount)}%`;
  }
  const code = limit.currencyCode ?? currencyCode;
  if (code) {
    return formatMoney(amount, code) ?? String(amount);
  }
  return String(amount);
}

function chargeAmountLimitLabel(limit: LoanApplicationChargeAmountLimit): string {
  return limit.name?.trim() || `Charge #${limit.chargeId}`;
}

export function validateLoanApplicationChargeAmountRules(
  input: Pick<CreateLoanAccountInput, 'charges'>,
  ctx: Pick<LoanApplicationProductContext, 'currencyCode' | 'chargeAmountLimits'> | undefined
): Record<string, string> {
  const errors: Record<string, string> = {};
  const limitsById = new Map(
    (ctx?.chargeAmountLimits ?? []).map((limit) => [limit.chargeId, limit])
  );

  for (const [index, charge] of (input.charges ?? []).entries()) {
    const limit = limitsById.get(charge.chargeId);
    if (!limit || (limit.minCap == null && limit.maxCap == null)) {
      continue;
    }

    const amount = charge.amount;
    if (amount == null || !Number.isFinite(amount)) {
      continue;
    }

    const fieldKey = `charges.${index}.amount`;
    const label = chargeAmountLimitLabel(limit);
    const percentage = isPercentageChargeCalculation(limit.chargeCalculationTypeId);
    const valueLabel = percentage ? 'rate' : 'amount';

    if (limit.minCap != null && amount < limit.minCap) {
      errors[fieldKey] = `${label} ${valueLabel} must be at least ${formatChargeAmountLimit(
        limit.minCap,
        limit,
        ctx?.currencyCode
      )}.`;
    } else if (limit.maxCap != null && amount > limit.maxCap) {
      errors[fieldKey] = `${label} ${valueLabel} must not exceed ${formatChargeAmountLimit(
        limit.maxCap,
        limit,
        ctx?.currencyCode
      )}.`;
    }
  }

  return errors;
}

export function validateLoanApplicationProductRangeRules(
  input: CreateLoanAccountInput,
  ctx: LoanApplicationProductContext | undefined
): Record<string, string> {
  const errors: Record<string, string> = {};

  if (input.principal > 0) {
    if (ctx?.minPrincipal != null && input.principal < ctx.minPrincipal) {
      errors.principal = `Principal must be at least ${formatPrincipalLimit(ctx, ctx.minPrincipal)}.`;
    }
    if (ctx?.maxPrincipal != null && input.principal > ctx.maxPrincipal) {
      errors.principal = `Principal must not exceed ${formatPrincipalLimit(ctx, ctx.maxPrincipal)}.`;
    }
  }

  if (input.numberOfRepayments > 0) {
    if (
      ctx?.minNumberOfRepayments != null &&
      input.numberOfRepayments < ctx.minNumberOfRepayments
    ) {
      errors.numberOfRepayments = `At least ${ctx.minNumberOfRepayments} repayments required.`;
    }
    if (
      ctx?.maxNumberOfRepayments != null &&
      input.numberOfRepayments > ctx.maxNumberOfRepayments
    ) {
      errors.numberOfRepayments = `At most ${ctx.maxNumberOfRepayments} repayments allowed.`;
    }
  }

  if (ctx?.linkedToFloatingInterestRates) {
    const differential = input.interestRateDifferential;
    if (differential != null && differential >= 0) {
      if (
        ctx.minInterestRateDifferential != null &&
        differential < ctx.minInterestRateDifferential
      ) {
        errors.interestRateDifferential = `Minimum differential is ${ctx.minInterestRateDifferential}.`;
      }
      if (
        ctx.maxInterestRateDifferential != null &&
        differential > ctx.maxInterestRateDifferential
      ) {
        errors.interestRateDifferential = `Maximum differential is ${ctx.maxInterestRateDifferential}.`;
      }
    }
  } else if (input.interestRatePerPeriod != null && input.interestRatePerPeriod >= 0) {
    if (
      ctx?.minInterestRatePerPeriod != null &&
      input.interestRatePerPeriod < ctx.minInterestRatePerPeriod
    ) {
      errors.interestRatePerPeriod = `Minimum rate is ${formatRateLimit(ctx.minInterestRatePerPeriod)}.`;
    }
    if (
      ctx?.maxInterestRatePerPeriod != null &&
      input.interestRatePerPeriod > ctx.maxInterestRatePerPeriod
    ) {
      errors.interestRatePerPeriod = `Maximum rate is ${formatRateLimit(ctx.maxInterestRatePerPeriod)}.`;
    }
  }

  return errors;
}

export function validateLoanApplicationProductRules(
  input: CreateLoanAccountInput,
  ctx: LoanApplicationProductContext | undefined,
  options?: LoanApplicationValidationOptions
): Record<string, string> {
  const errors: Record<string, string> = {
    ...validateLoanApplicationProductRangeRules(input, ctx),
    ...validateLoanApplicationChargeAmountRules(input, ctx)
  };

  if (ctx?.linkedToFloatingInterestRates) {
    if (input.interestRatePerPeriod != null && input.interestRatePerPeriod > 0) {
      errors.interestRatePerPeriod =
        'This product uses floating rates — enter the rate differential instead.';
    }
    const differential = input.interestRateDifferential;
    if (differential == null || differential < 0) {
      errors.interestRateDifferential = 'Rate differential is required.';
    }
    if (input.interestType !== 0) {
      errors.interestType = 'Declining balance interest is required for floating-rate products.';
    }
  } else {
    if (input.interestRatePerPeriod == null || input.interestRatePerPeriod < 0) {
      errors.interestRatePerPeriod = 'Interest rate is required.';
    }
  }

  if (input.loanTermFrequencyType !== input.repaymentFrequencyType) {
    errors.loanTermFrequencyType = 'Term unit must match repayment interval unit.';
    errors.repaymentFrequencyType = 'Repayment interval unit must match term unit.';
  } else if (
    !loanTermMatchesRepaymentStructure({
      loanTermFrequency: input.loanTermFrequency,
      loanTermFrequencyType: input.loanTermFrequencyType,
      repaymentEvery: input.repaymentEvery,
      repaymentFrequencyType: input.repaymentFrequencyType,
      numberOfRepayments: input.numberOfRepayments
    })
  ) {
    const expected = computedLoanTermFrequency(
      input.repaymentEvery,
      input.numberOfRepayments
    );
    errors.loanTermFrequency = `Loan term must equal repayments × repay every (${expected}).`;
  }

  for (const [field, label] of [
    ['graceOnPrincipalPayment', 'Principal grace'],
    ['graceOnInterestPayment', 'Interest payment grace'],
    ['graceOnInterestCharged', 'Interest charged grace']
  ] as const) {
    const value = input[field] ?? 0;
    if (value >= input.numberOfRepayments) {
      errors[field] = `${label} must be less than the number of repayments.`;
    }
  }

  if (!options?.schedulePreview) {
    const linkedSavingsReasons = loanApplicationLinkedSavingsReasons(input, ctx);
    if (linkedSavingsReasons.length > 0 && !input.linkAccountId) {
      errors.linkAccountId = linkedSavingsAccountErrorMessage(linkedSavingsReasons);
    }
  }

  return errors;
}

export function loanApplicationHasScheduleMinimumFields(
  input: Partial<CreateLoanAccountInput>,
  linkedToFloatingInterestRates = false
): boolean {
  const hasInterest = linkedToFloatingInterestRates
    ? input.interestRateDifferential != null && input.interestRateDifferential >= 0
    : input.interestRatePerPeriod != null && input.interestRatePerPeriod >= 0;

  return (
    hasInterest &&
    (input.productId ?? 0) > 0 &&
    (input.principal ?? 0) > 0 &&
    (input.loanTermFrequency ?? 0) > 0 &&
    (input.numberOfRepayments ?? 0) > 0 &&
    (input.repaymentEvery ?? 0) > 0 &&
    input.expectedDisbursementDate != null &&
    input.expectedDisbursementDate !== '' &&
    input.submittedOnDate != null &&
    input.submittedOnDate !== '' &&
    input.transactionProcessingStrategyCode != null &&
    input.transactionProcessingStrategyCode !== '' &&
    input.amortizationType != null &&
    input.interestType != null &&
    input.interestCalculationPeriodType != null
  );
}
