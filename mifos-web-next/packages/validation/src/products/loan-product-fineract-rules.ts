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
