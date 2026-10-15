/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { z } from 'zod';

/**
 * Fineract {@code PeriodFrequencyType} for repayment frequency.
 * Whole term (4) is not allowed on repayment — see LoanProductDataValidator.
 */
export const FINERACT_REPAYMENT_FREQUENCY_TYPE_MIN = 0;
export const FINERACT_REPAYMENT_FREQUENCY_TYPE_MAX = 3;

/** Fineract {@code PeriodFrequencyType} for interest rate frequency (includes whole term). */
export const FINERACT_INTEREST_RATE_FREQUENCY_TYPE_MIN = 0;
export const FINERACT_INTEREST_RATE_FREQUENCY_TYPE_MAX = 4;

/** Fineract {@code DaysInYearType} API values. */
export const FINERACT_DAYS_IN_YEAR_TYPE_VALUES = [1, 360, 364, 365] as const;

/** Fineract {@code DaysInMonthType} API values. */
export const FINERACT_DAYS_IN_MONTH_TYPE_VALUES = [1, 30] as const;

/** Fineract {@code RepaymentStartDateType} API values. */
export const FINERACT_REPAYMENT_START_DATE_TYPE_VALUES = [1, 2] as const;

/** Wizard stores loan schedule type/processing as 1-based option list ids. */
export const FINERACT_LOAN_SCHEDULE_OPTION_ID_MIN = 1;
export const FINERACT_LOAN_SCHEDULE_OPTION_ID_MAX = 2;

/** Fineract {@code AdvancedPaymentScheduleTransactionProcessor} code. */
export const ADVANCED_PAYMENT_ALLOCATION_STRATEGY_CODE = 'advanced-payment-allocation-strategy';

/** {@code LoanScheduleType} option ids: ordinal + 1. */
export const LOAN_SCHEDULE_TYPE_CUMULATIVE_ID = 1;
export const LOAN_SCHEDULE_TYPE_PROGRESSIVE_ID = 2;

/** {@code LoanScheduleProcessingType} option ids: ordinal + 1. */
export const LOAN_SCHEDULE_PROCESSING_HORIZONTAL_ID = 1;
export const LOAN_SCHEDULE_PROCESSING_VERTICAL_ID = 2;

export const PROGRESSIVE_SCHEDULE_REQUIRES_ADVANCED_STRATEGY_MESSAGE =
  'Progressive schedule requires the Advanced payment allocation repayment strategy.';

export const ADVANCED_STRATEGY_REQUIRES_PROGRESSIVE_SCHEDULE_MESSAGE =
  'Advanced payment allocation uses a progressive schedule.';

export const VERTICAL_PROCESSING_REQUIRES_ADVANCED_STRATEGY_MESSAGE =
  'Vertical schedule processing requires the Advanced payment allocation repayment strategy.';

export function isAdvancedPaymentAllocationStrategy(code: string | null | undefined): boolean {
  return code === ADVANCED_PAYMENT_ALLOCATION_STRATEGY_CODE;
}

/**
 * Values to write when the repayment strategy and schedule pair disagree.
 * Returns null when the current values are already allowed.
 */
export function loanScheduleFieldsForStrategy(input: {
  transactionProcessingStrategyCode?: string | null;
  loanScheduleType?: number | null;
  loanScheduleProcessingType?: number | null;
}): { loanScheduleType?: number; loanScheduleProcessingType?: number } | null {
  const advanced = isAdvancedPaymentAllocationStrategy(input.transactionProcessingStrategyCode);
  const loanScheduleType = advanced
    ? LOAN_SCHEDULE_TYPE_PROGRESSIVE_ID
    : LOAN_SCHEDULE_TYPE_CUMULATIVE_ID;
  const processingIsIllegal =
    !advanced && input.loanScheduleProcessingType === LOAN_SCHEDULE_PROCESSING_VERTICAL_ID;
  const loanScheduleProcessingType = processingIsIllegal
    ? LOAN_SCHEDULE_PROCESSING_HORIZONTAL_ID
    : undefined;

  const patch: { loanScheduleType?: number; loanScheduleProcessingType?: number } = {};
  if (input.loanScheduleType !== loanScheduleType) {
    patch.loanScheduleType = loanScheduleType;
  }
  if (loanScheduleProcessingType != null) {
    patch.loanScheduleProcessingType = loanScheduleProcessingType;
  }
  return Object.keys(patch).length > 0 ? patch : null;
}

function isOneOf<T extends number>(values: readonly T[], value: number): value is T {
  return (values as readonly number[]).includes(value);
}

export const fineractRepaymentFrequencyTypeSchema: z.ZodType<number> = z.coerce
  .number()
  .int()
  .min(FINERACT_REPAYMENT_FREQUENCY_TYPE_MIN, 'Select a valid repayment frequency.')
  .max(FINERACT_REPAYMENT_FREQUENCY_TYPE_MAX, 'Select a valid repayment frequency.');

export const fineractInterestRateFrequencyTypeSchema: z.ZodType<number> = z.coerce
  .number()
  .int()
  .min(FINERACT_INTEREST_RATE_FREQUENCY_TYPE_MIN, 'Select a valid interest rate frequency.')
  .max(FINERACT_INTEREST_RATE_FREQUENCY_TYPE_MAX, 'Select a valid interest rate frequency.');

export const fineractDaysInYearTypeSchema: z.ZodType<number> = z.coerce
  .number()
  .int()
  .refine((value) => isOneOf(FINERACT_DAYS_IN_YEAR_TYPE_VALUES, value), {
    message: 'Select a valid days-in-year type.'
  });

export const fineractDaysInMonthTypeSchema: z.ZodType<number> = z.coerce
  .number()
  .int()
  .refine((value) => isOneOf(FINERACT_DAYS_IN_MONTH_TYPE_VALUES, value), {
    message: 'Select a valid days-in-month type.'
  });

export const fineractRepaymentStartDateTypeSchema: z.ZodType<number> = z.coerce
  .number()
  .int()
  .refine((value) => isOneOf(FINERACT_REPAYMENT_START_DATE_TYPE_VALUES, value), {
    message: 'Select a valid repayment start date type.'
  });

export const fineractLoanScheduleOptionIdSchema: z.ZodType<number> = z.coerce
  .number()
  .int()
  .min(FINERACT_LOAN_SCHEDULE_OPTION_ID_MIN, 'Select a valid loan schedule type.')
  .max(FINERACT_LOAN_SCHEDULE_OPTION_ID_MAX, 'Select a valid loan schedule type.');

export const fineractLoanScheduleProcessingOptionIdSchema: z.ZodType<number> = z.coerce
  .number()
  .int()
  .min(FINERACT_LOAN_SCHEDULE_OPTION_ID_MIN, 'Select a valid loan schedule processing type.')
  .max(FINERACT_LOAN_SCHEDULE_OPTION_ID_MAX, 'Select a valid loan schedule processing type.');

export function refineMinMaxNumberRange(
  ctx: z.RefinementCtx,
  options: {
    min?: number | null;
    max?: number | null;
    value?: number | null;
    minPath: [string];
    maxPath: [string];
    valuePath: [string];
    minMaxMessage: string;
    valueBelowMinMessage: string;
    valueAboveMaxMessage: string;
  }
): void {
  const { min, max, value, minPath, maxPath, valuePath, minMaxMessage, valueBelowMinMessage, valueAboveMaxMessage } =
    options;

  if (min != null && max != null && max < min) {
    ctx.addIssue({ code: 'custom', message: minMaxMessage, path: maxPath });
  }

  if (value == null) {
    return;
  }

  if (min != null && value < min) {
    ctx.addIssue({ code: 'custom', message: valueBelowMinMessage, path: valuePath });
  }

  if (max != null && value > max) {
    ctx.addIssue({ code: 'custom', message: valueAboveMaxMessage, path: valuePath });
  }
}
