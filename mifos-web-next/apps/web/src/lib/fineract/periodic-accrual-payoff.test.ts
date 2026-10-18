/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { futureInterest, normalizePeriodicAccrualPayoff } from '@/lib/fineract/periodic-accrual-payoff';

describe('normalizePeriodicAccrualPayoff', () => {
  it('returns null when the template omits the breakdown', () => {
    assert.equal(normalizePeriodicAccrualPayoff(undefined), null);
    assert.equal(normalizePeriodicAccrualPayoff(null), null);
  });

  it('keeps both payoffs, a zero gap, and a null accrued-through date', () => {
    const payoff = normalizePeriodicAccrualPayoff({
      asOfDate: [2026, 2, 15],
      accruedTill: null,
      accrualPaused: false,
      contractPayoff: 1795,
      earnedPayoff: 1795,
      interestNotYetInBooks: 0
    });
    assert.deepEqual(payoff?.asOfDate, [2026, 2, 15]);
    assert.equal(payoff?.accruedTill, null);
    assert.equal(payoff?.accrualPaused, false);
    assert.equal(payoff?.contractPayoff, 1795);
    assert.equal(payoff?.earnedPayoff, 1795);
    assert.equal(payoff?.interestNotYetInBooks, 0);
    assert.equal(payoff?.interestBooked, undefined);
  });

  it('keeps a zero booked total and does not invent one', () => {
    const present = normalizePeriodicAccrualPayoff({ interestBooked: 0 });
    const absent = normalizePeriodicAccrualPayoff({ contractPayoff: 1 });
    assert.equal(present?.interestBooked, 0);
    assert.equal(absent?.interestBooked, undefined);
  });

  it('keeps a negative gap and a paused loan', () => {
    const payoff = normalizePeriodicAccrualPayoff({
      accruedTill: [2026, 2, 1],
      accrualPaused: true,
      interestNotYetInBooks: -20
    });
    assert.deepEqual(payoff?.accruedTill, [2026, 2, 1]);
    assert.equal(payoff?.accrualPaused, true);
    assert.equal(payoff?.interestNotYetInBooks, -20);
  });
});

describe('futureInterest', () => {
  it('subtracts unpaid earned interest from unpaid contract interest', () => {
    const payoff = normalizePeriodicAccrualPayoff({
      interestOnContractOutstanding: 780,
      interestEarnedOutstanding: 340,
      accrualPaused: true,
      interestNotYetInBooks: 0
    });
    assert.ok(payoff);
    assert.equal(futureInterest(payoff)?.toFixed(2), '440.00');
  });

  it('keeps zero and a negative remainder', () => {
    const equal = normalizePeriodicAccrualPayoff({
      interestOnContractOutstanding: 100,
      interestEarnedOutstanding: 100
    });
    const negative = normalizePeriodicAccrualPayoff({
      interestOnContractOutstanding: 100,
      interestEarnedOutstanding: 120.5
    });
    assert.ok(equal);
    assert.ok(negative);
    assert.equal(futureInterest(equal)?.toFixed(2), '0.00');
    assert.equal(futureInterest(negative)?.toFixed(2), '-20.50');
  });

  it('omits the figure when either interest field is missing', () => {
    const missingEarned = normalizePeriodicAccrualPayoff({
      interestOnContractOutstanding: 100
    });
    assert.ok(missingEarned);
    assert.equal(futureInterest(missingEarned), null);
  });
});
