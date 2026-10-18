/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { toDecimal } from '@mifos/domain';
import type { Decimal } from 'decimal.js';

/** Server payoff split for a periodic-accrual loan. Absent on cash and upfront products. */
export interface PeriodicAccrualPayoff {
  asOfDate?: number[];
  /** Null when the loan has never been accrued. */
  accruedTill: number[] | null;
  accrualPaused: boolean;
  principalOutstanding?: number;
  feeChargesOutstanding?: number;
  penaltyChargesOutstanding?: number;
  interestOnContractOutstanding?: number;
  interestEarnedOutstanding?: number;
  interestPostedOutstanding?: number;
  /** Interest recognized on the loan, including interest already paid. Omitted when the server does not send it. */
  interestBooked?: number;
  contractPayoff?: number;
  earnedPayoff?: number;
  interestNotYetInBooks?: number;
}

function toNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function dateArray(value: unknown): number[] | undefined {
  if (!Array.isArray(value) || value.length < 3) {
    return undefined;
  }
  const year = Number(value[0]);
  const month = Number(value[1]);
  const day = Number(value[2]);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return undefined;
  }
  return [year, month, day];
}

/**
 * Unpaid contract interest that has not been earned by the payoff date.
 * Null when either server interest field is missing. Does not clamp, including a negative result.
 */
export function futureInterest(payoff: PeriodicAccrualPayoff): Decimal | null {
  const contractInterest = toDecimal(payoff.interestOnContractOutstanding);
  const earnedInterest = toDecimal(payoff.interestEarnedOutstanding);
  if (contractInterest == null || earnedInterest == null) {
    return null;
  }
  return contractInterest.minus(earnedInterest);
}

/** Returns null when the template omits the object. Does not invent or clamp amounts. */
export function normalizePeriodicAccrualPayoff(raw: unknown): PeriodicAccrualPayoff | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return null;
  }
  const row = raw as Record<string, unknown>;
  return {
    asOfDate: dateArray(row.asOfDate),
    accruedTill: row.accruedTill == null ? null : (dateArray(row.accruedTill) ?? null),
    accrualPaused: row.accrualPaused === true,
    principalOutstanding: toNumber(row.principalOutstanding),
    feeChargesOutstanding: toNumber(row.feeChargesOutstanding),
    penaltyChargesOutstanding: toNumber(row.penaltyChargesOutstanding),
    interestOnContractOutstanding: toNumber(row.interestOnContractOutstanding),
    interestEarnedOutstanding: toNumber(row.interestEarnedOutstanding),
    interestPostedOutstanding: toNumber(row.interestPostedOutstanding),
    interestBooked: toNumber(row.interestBooked),
    contractPayoff: toNumber(row.contractPayoff),
    earnedPayoff: toNumber(row.earnedPayoff),
    interestNotYetInBooks: toNumber(row.interestNotYetInBooks)
  };
}
