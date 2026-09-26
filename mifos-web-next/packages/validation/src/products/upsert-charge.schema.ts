/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { z } from 'zod';
import { parseChargeMonthDay } from './charge-month-day';
import { validateLookupRangeBands } from './lookup-range-bands';

const optionalId = z.coerce
  .number()
  .int()
  .positive()
  .optional()
  .or(z.literal(''))
  .transform((value) => (value === '' ? undefined : value));

/** Fineract charge time types that may use lookup amount tiers. */
export const LOAN_CHARGE_TIER_TIME_TYPES = [1, 2, 8, 9, 12] as const;
export const SAVINGS_CHARGE_TIER_TIME_TYPES = [5, 16] as const;

export function isChargeTiersAllowed(
  chargeAppliesTo?: number,
  chargeTimeType?: number
): boolean {
  if (chargeTimeType == null) {
    return false;
  }
  if (chargeAppliesTo === 1) {
    return (LOAN_CHARGE_TIER_TIME_TYPES as readonly number[]).includes(chargeTimeType);
  }
  if (chargeAppliesTo === 2) {
    return (SAVINGS_CHARGE_TIER_TIME_TYPES as readonly number[]).includes(chargeTimeType);
  }
  return false;
}

const nullableAmountRangeTo = z.preprocess((value) => {
  if (value === '' || value === undefined || value === null) {
    return null;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : value;
  }
  return value;
}, z.number().positive('Range to must be greater than zero.').nullable());

const optionalPositive = z.preprocess(
  (value) => (value === '' || value === undefined || value === null ? undefined : value),
  z.coerce.number().positive('Must be greater than zero.').optional()
);

const optionalPositiveInt = z.preprocess(
  (value) => (value === '' || value === undefined || value === null ? undefined : value),
  z.coerce.number().int().positive('Must be greater than zero.').optional()
);

const LOAN_TIME_TYPES = [1, 2, 8, 9, 12] as const;
/** 4 (savings closure) is accepted by the API and hidden in the picker unless already selected. */
const SAVINGS_TIME_TYPES = [2, 3, 4, 5, 6, 7, 10, 11, 16] as const;
const CLIENT_TIME_TYPES = [2] as const;
const SHARE_TIME_TYPES = [13, 14, 15] as const;
const WORKING_CAPITAL_TIME_TYPES = [2] as const;

function timeTypesFor(chargeAppliesTo: number): readonly number[] {
  switch (chargeAppliesTo) {
    case 1:
      return LOAN_TIME_TYPES;
    case 2:
      return SAVINGS_TIME_TYPES;
    case 3:
      return CLIENT_TIME_TYPES;
    case 4:
      return SHARE_TIME_TYPES;
    case 5:
      return WORKING_CAPITAL_TIME_TYPES;
    default:
      return [];
  }
}

function calculationAllowed(
  chargeAppliesTo: number,
  chargeTimeType: number,
  chargeCalculationType: number
): boolean {
  if (chargeAppliesTo === 1) {
    if (chargeTimeType === 12) {
      return chargeCalculationType === 1 || chargeCalculationType === 5;
    }
    return chargeCalculationType >= 1 && chargeCalculationType <= 4;
  }
  if (chargeAppliesTo === 2) {
    if (chargeCalculationType === 1) {
      return true;
    }
    return chargeCalculationType === 2 && (chargeTimeType === 5 || chargeTimeType === 16);
  }
  if (chargeAppliesTo === 3 || chargeAppliesTo === 5) {
    return chargeCalculationType === 1;
  }
  if (chargeAppliesTo === 4) {
    if (chargeTimeType === 13) {
      return chargeCalculationType === 1;
    }
    return chargeCalculationType === 1 || chargeCalculationType === 2;
  }
  return false;
}

export const chargeTierSchema = z.object({
  amountRangeFrom: z.coerce.number().min(0, 'Range from must be zero or greater.'),
  amountRangeTo: nullableAmountRangeTo,
  amount: z.coerce.number().positive('Tier amount must be greater than zero.')
});

export type ChargeTierInput = z.infer<typeof chargeTierSchema>;

export function validateChargeTiersContiguous(
  tiers: ChargeTierInput[],
  addIssue: (path: (string | number)[], message: string) => void
): void {
  validateLookupRangeBands(
    tiers.map((tier) => ({
      from: tier.amountRangeFrom,
      to: tier.amountRangeTo ?? null
    })),
    addIssue,
    {
      pathPrefix: ['chargeTiers'],
      fromField: 'amountRangeFrom',
      toField: 'amountRangeTo',
      entityLabel: 'tier',
      emptyMessage: 'Add at least one charge tier.'
    }
  );
}

export const upsertChargeSchema = z
  .object({
    chargeAppliesTo: z.coerce
      .number()
      .int()
      .min(1, 'Applies to is required.')
      .max(5, 'Applies to is required.'),
    name: z.string().trim().min(1, 'Name is required.').max(100),
    currencyCode: z
      .string()
      .trim()
      .length(3, 'Select a currency.'),
    chargeTimeType: z.coerce.number().int().positive('Charge time type is required.'),
    chargeCalculationType: z.coerce
      .number()
      .int()
      .min(1, 'Calculation type is required.')
      .max(5, 'Calculation type is required.'),
    // Coerce missing/blank to 0 so tiered charges (Amount field hidden) still parse.
    amount: z.preprocess(
      (value) => (value === '' || value === undefined || value === null ? 0 : value),
      z.coerce.number().min(0, 'Amount must be zero or greater.')
    ),
    active: z.boolean().default(false),
    penalty: z.boolean().default(false),
    chargePaymentMode: z.preprocess(
      (value) => (value === '' || value === undefined || value === null ? undefined : value),
      z.coerce.number().int().min(0).max(1).optional()
    ),
    incomeAccountId: optionalId,
    taxGroupId: optionalId,
    minCap: optionalPositive,
    maxCap: optionalPositive,
    feeInterval: optionalPositiveInt,
    feeFrequency: z.preprocess(
      (value) => (value === '' || value === undefined || value === null ? undefined : value),
      z.coerce.number().int().min(0).max(3, 'Frequency must be days, weeks, months, or years.').optional()
    ),
    feeOnMonthDay: z.string().trim().optional(),
    addFeeFrequency: z.boolean().optional(),
    enableFreeWithdrawalCharge: z.boolean().optional(),
    freeWithdrawalFrequency: optionalPositiveInt,
    restartCountFrequency: optionalPositiveInt,
    countFrequencyType: z.preprocess(
      (value) => (value === '' || value === undefined || value === null ? undefined : value),
      z.coerce.number().int().min(0).max(3).optional()
    ),
    enablePaymentType: z.boolean().optional(),
    paymentTypeId: optionalId,
    useChargeTiers: z.boolean().default(false),
    chargeTiers: z.array(chargeTierSchema).default([])
  })
  .superRefine((data, ctx) => {
    const addIssue = (path: (string | number)[], message: string) => {
      ctx.addIssue({ code: 'custom', message, path });
    };

    const allowedTimes = timeTypesFor(data.chargeAppliesTo);
    if (!allowedTimes.includes(data.chargeTimeType)) {
      addIssue(['chargeTimeType'], 'This charge time is not available for the selected product.');
    } else if (
      !calculationAllowed(data.chargeAppliesTo, data.chargeTimeType, data.chargeCalculationType)
    ) {
      addIssue(
        ['chargeCalculationType'],
        'This calculation type is not available for the selected charge time.'
      );
    }

    if (data.chargeAppliesTo === 1 && data.chargePaymentMode == null) {
      addIssue(['chargePaymentMode'], 'Payment mode is required.');
    }

    if (data.chargeTimeType === 1 || data.chargeTimeType === 12) {
      if (data.penalty) {
        addIssue(['penalty'], 'This charge time cannot be a penalty.');
      }
    }
    if (data.chargeTimeType === 9 && !data.penalty) {
      addIssue(['penalty'], 'Overdue instalment charges must be a penalty.');
    }

    const monthDay = data.feeOnMonthDay?.trim() ?? '';
    if (data.chargeTimeType === 6 || data.chargeTimeType === 7) {
      if (!monthDay) {
        addIssue(['feeOnMonthDay'], 'Due date is required.');
      } else if (!parseChargeMonthDay(monthDay)) {
        addIssue(
          ['feeOnMonthDay'],
          'Choose a day that exists in that month. February allows 1–29; April, June, September, and November allow 1–30.'
        );
      }
    } else if (monthDay) {
      addIssue(['feeOnMonthDay'], 'Due date applies only to annual and monthly fees.');
    }

    if (data.chargeTimeType === 7) {
      if (!data.feeInterval) {
        addIssue(['feeInterval'], 'Repeat every is required.');
      } else if (data.feeInterval > 12) {
        addIssue(['feeInterval'], 'Repeat every must be between 1 and 12 months.');
      }
    }

    if (data.chargeTimeType === 9 && data.addFeeFrequency) {
      if (data.feeFrequency == null) {
        addIssue(['feeFrequency'], 'Charge frequency is required.');
      }
      if (!data.feeInterval) {
        addIssue(['feeInterval'], 'Frequency interval is required.');
      }
    } else if (data.feeFrequency != null && !data.feeInterval) {
      addIssue(['feeInterval'], 'Frequency interval is required.');
    }

    if (data.chargeAppliesTo === 2 && data.enableFreeWithdrawalCharge) {
      if (!data.freeWithdrawalFrequency) {
        addIssue(['freeWithdrawalFrequency'], 'Free withdrawals is required.');
      }
      if (!data.restartCountFrequency) {
        addIssue(['restartCountFrequency'], 'Restart count frequency is required.');
      }
      if (data.countFrequencyType == null) {
        addIssue(['countFrequencyType'], 'Count frequency type is required.');
      }
    }

    if (data.chargeAppliesTo === 2 && data.enablePaymentType && !data.paymentTypeId) {
      addIssue(['paymentTypeId'], 'Payment type is required.');
    }

    const capsAllowed = data.chargeCalculationType === 2 || data.chargeCalculationType === 5;
    if (!data.useChargeTiers && !capsAllowed && (data.minCap != null || data.maxCap != null)) {
      if (data.minCap != null) {
        addIssue(['minCap'], 'Caps apply only to percent of amount or percent of disbursement.');
      }
      if (data.maxCap != null) {
        addIssue(['maxCap'], 'Caps apply only to percent of amount or percent of disbursement.');
      }
    }

    if (data.useChargeTiers) {
      if (!isChargeTiersAllowed(data.chargeAppliesTo, data.chargeTimeType)) {
        addIssue(
          ['useChargeTiers'],
          'Charge tiers are not available for this applies-to and charge time.'
        );
      }
      if (data.minCap != null) {
        addIssue(['minCap'], 'Minimum cap cannot be used with charge tiers.');
      }
      if (data.maxCap != null) {
        addIssue(['maxCap'], 'Maximum cap cannot be used with charge tiers.');
      }
      validateChargeTiersContiguous(data.chargeTiers, addIssue);
    } else {
      if (!(data.amount > 0)) {
        addIssue(['amount'], 'Amount must be greater than zero.');
      }
      if (data.chargeTiers.length > 0) {
        addIssue(['chargeTiers'], 'Clear charge tiers when not using tiered amounts.');
      }
      if (data.minCap != null && data.maxCap != null && data.minCap > data.maxCap) {
        addIssue(['minCap'], 'Minimum cap cannot exceed maximum cap.');
      }
    }
  });

export type UpsertChargeInput = z.infer<typeof upsertChargeSchema>;
