/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { z } from 'zod';
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
}, z.number().min(0, 'Range to must be zero or greater.').nullable());

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
    chargeAppliesTo: z.coerce.number().int().positive('Applies to is required.'),
    name: z.string().trim().min(1, 'Name is required.').max(100),
    currencyCode: z.string().trim().min(1, 'Select a currency.').max(3),
    chargeTimeType: z.coerce.number().int().min(0, 'Charge time type is required.'),
    chargeCalculationType: z.coerce.number().int().min(0, 'Calculation type is required.'),
    // Coerce missing/blank to 0 so tiered charges (Amount field hidden) still parse.
    amount: z.preprocess(
      (value) => (value === '' || value === undefined || value === null ? 0 : value),
      z.coerce.number().min(0, 'Amount must be zero or greater.')
    ),
    active: z.boolean().default(false),
    penalty: z.boolean().default(false),
    chargePaymentMode: z.coerce.number().int().min(0).optional(),
    incomeAccountId: optionalId,
    taxGroupId: optionalId,
    minCap: z.coerce.number().min(0).optional(),
    maxCap: z.coerce.number().min(0).optional(),
    feeInterval: z.coerce.number().int().positive().optional(),
    feeFrequency: z.coerce.number().int().min(0).optional(),
    feeOnMonthDay: z.string().trim().optional(),
    addFeeFrequency: z.boolean().optional(),
    useChargeTiers: z.boolean().default(false),
    chargeTiers: z.array(chargeTierSchema).default([])
  })
  .superRefine((data, ctx) => {
    const addIssue = (path: (string | number)[], message: string) => {
      ctx.addIssue({ code: 'custom', message, path });
    };

    if (data.chargeAppliesTo === 1 || data.chargeAppliesTo === 5) {
      if (data.chargePaymentMode == null) {
        addIssue(['chargePaymentMode'], 'Payment mode is required.');
      }
    }

    if (data.chargeAppliesTo === 3 && !data.incomeAccountId) {
      addIssue(['incomeAccountId'], 'Income account is required for customer charges.');
    }

    if (data.chargeTimeType === 6 && !data.feeOnMonthDay?.trim()) {
      addIssue(['feeOnMonthDay'], 'Due date is required.');
    }

    if (data.chargeTimeType === 7) {
      if (!data.feeInterval) {
        addIssue(['feeInterval'], 'Repeat every is required.');
      } else if (data.feeInterval > 12) {
        addIssue(['feeInterval'], 'Repeat every must be between 1 and 12 months.');
      }
    }

    if (data.chargeTimeType === 11 && !data.feeInterval) {
      addIssue(['feeInterval'], 'Repeat every is required.');
    }

    if (data.chargeTimeType === 9 && data.addFeeFrequency) {
      if (data.feeFrequency == null) {
        addIssue(['feeFrequency'], 'Charge frequency is required.');
      }
      if (!data.feeInterval) {
        addIssue(['feeInterval'], 'Frequency interval is required.');
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
