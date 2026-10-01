/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { toDecimal } from '@mifos/domain';

export const SAVINGS_CHANNEL_CEILING_FIELDS = [
  'maxDebitPerTxn',
  'maxDebitPerDay',
  'maxDebitPerMonth',
  'maxDebitCountPerDay',
  'maxDebitCountPerMonth',
  'maxCreditPerTxn',
  'maxCreditPerDay',
  'maxCreditPerMonth',
  'maxCreditCountPerDay',
  'maxCreditCountPerMonth'
] as const;

export type SavingsChannelCeilingField = (typeof SAVINGS_CHANNEL_CEILING_FIELDS)[number];

export const SAVINGS_CHANNEL_CUSTOMER_LIMIT_FIELDS = [
  'maxPerTxn',
  'maxPerDay',
  'maxPerMonth',
  'maxCountPerDay',
  'maxCountPerMonth'
] as const;

export type SavingsChannelCustomerLimitField =
  (typeof SAVINGS_CHANNEL_CUSTOMER_LIMIT_FIELDS)[number];

const NOT_NEGATIVE = 'Enter zero or a greater amount.';
const NOT_ABOVE_DAILY_AMOUNT = 'Per transaction cannot be above the daily amount.';
const NOT_ABOVE_MONTHLY_AMOUNT = 'This amount cannot be above the monthly amount.';
const NOT_ABOVE_MONTHLY_COUNT = 'The daily count cannot be above the monthly count.';
const ABOVE_CEILING = 'This value is above the bank ceiling.';

function isAbove(left: number | null | undefined, right: number | null | undefined): boolean {
  if (left == null || right == null) {
    return false;
  }
  const a = toDecimal(left);
  const b = toDecimal(right);
  if (!a || !b) {
    return false;
  }
  return a.greaterThan(b);
}

/** Ordering for one direction. Blank sides are skipped. Counts compare day with month only. */
export function channelLimitOrderErrors(input: {
  perTxn?: number | null;
  perDay?: number | null;
  perMonth?: number | null;
  countPerDay?: number | null;
  countPerMonth?: number | null;
  perTxnField: string;
  perDayField: string;
  perMonthField: string;
  countPerDayField: string;
  countPerMonthField: string;
}): Record<string, string> {
  const errors: Record<string, string> = {};
  if (isAbove(input.perTxn, input.perDay)) {
    errors[input.perTxnField] = NOT_ABOVE_DAILY_AMOUNT;
  }
  if (isAbove(input.perTxn, input.perMonth) && !errors[input.perTxnField]) {
    errors[input.perTxnField] = NOT_ABOVE_MONTHLY_AMOUNT;
  }
  if (isAbove(input.perDay, input.perMonth)) {
    errors[input.perDayField] = NOT_ABOVE_MONTHLY_AMOUNT;
  }
  if (isAbove(input.countPerDay, input.countPerMonth)) {
    errors[input.countPerDayField] = NOT_ABOVE_MONTHLY_COUNT;
  }
  return errors;
}

/** Compare a customer value with the bank ceiling only when both are filled in. */
export function channelLimitCeilingErrors(input: {
  values: Partial<Record<SavingsChannelCustomerLimitField, number | null>>;
  ceilings: Partial<Record<SavingsChannelCustomerLimitField, number | null>>;
}): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const field of SAVINGS_CHANNEL_CUSTOMER_LIMIT_FIELDS) {
    if (isAbove(input.values[field], input.ceilings[field])) {
      errors[field] = ABOVE_CEILING;
    }
  }
  return errors;
}

/**
 * Customer value when it is filled in, otherwise the ceiling.
 * When both are filled in, the lower one. A blank customer value is not zero.
 */
export function effectiveChannelLimit(
  customer: number | null | undefined,
  ceiling: number | null | undefined
): number | null {
  if (customer == null) {
    return ceiling ?? null;
  }
  if (ceiling == null) {
    return customer;
  }
  const customerAmount = toDecimal(customer);
  const ceilingAmount = toDecimal(ceiling);
  if (!customerAmount || !ceilingAmount) {
    return null;
  }
  return customerAmount.lessThanOrEqualTo(ceilingAmount) ? customer : ceiling;
}

/** Order the cap that would be enforced, including a ceiling used in place of a blank customer field. */
export function channelLimitEffectiveOrderErrors(input: {
  values: Partial<Record<SavingsChannelCustomerLimitField, number | null>>;
  ceilings: Partial<Record<SavingsChannelCustomerLimitField, number | null>>;
}): Record<string, string> {
  return channelLimitOrderErrors({
    perTxn: effectiveChannelLimit(input.values.maxPerTxn, input.ceilings.maxPerTxn),
    perDay: effectiveChannelLimit(input.values.maxPerDay, input.ceilings.maxPerDay),
    perMonth: effectiveChannelLimit(input.values.maxPerMonth, input.ceilings.maxPerMonth),
    countPerDay: effectiveChannelLimit(input.values.maxCountPerDay, input.ceilings.maxCountPerDay),
    countPerMonth: effectiveChannelLimit(
      input.values.maxCountPerMonth,
      input.ceilings.maxCountPerMonth
    ),
    perTxnField: 'maxPerTxn',
    perDayField: 'maxPerDay',
    perMonthField: 'maxPerMonth',
    countPerDayField: 'maxCountPerDay',
    countPerMonthField: 'maxCountPerMonth'
  });
}

/** Customer ordering, then the effective cap, then each customer value against its own ceiling. */
export function channelLimitCustomerSaveErrors(input: {
  values: Partial<Record<SavingsChannelCustomerLimitField, number | null>>;
  ceilings: Partial<Record<SavingsChannelCustomerLimitField, number | null>>;
}): Record<string, string> {
  return {
    ...channelLimitEffectiveOrderErrors(input),
    ...channelLimitOrderErrors({
      perTxn: input.values.maxPerTxn,
      perDay: input.values.maxPerDay,
      perMonth: input.values.maxPerMonth,
      countPerDay: input.values.maxCountPerDay,
      countPerMonth: input.values.maxCountPerMonth,
      perTxnField: 'maxPerTxn',
      perDayField: 'maxPerDay',
      perMonthField: 'maxPerMonth',
      countPerDayField: 'maxCountPerDay',
      countPerMonthField: 'maxCountPerMonth'
    }),
    ...channelLimitCeilingErrors(input)
  };
}

export const CHANNEL_LIMIT_NOT_NEGATIVE = NOT_NEGATIVE;
