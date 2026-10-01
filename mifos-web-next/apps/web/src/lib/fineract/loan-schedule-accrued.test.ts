/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  loanScheduleHasAccruedInterest,
  loanScheduleTotalAccruedInterest
} from '@/components/clients/loan-account/schedule/loan-schedule-format';
import { buildLoanRepaymentScheduleDocumentData } from '@/components/clients/loan-account/schedule/loan-repayment-schedule-view-model';
import { normalizeLoanScheduleData } from '@/lib/fineract/loan-schedule-normalize';
import type { FineractLoanAccountDetail } from '@/lib/fineract/loan-account-types';

function account(): FineractLoanAccountDetail {
  return {
    id: 1,
    accountNo: '100LP00000000035',
    status: { id: 300, value: 'Active', code: 'loanStatusType.active', active: true },
    currency: { code: 'UGX', name: 'Ugandan Shilling' }
  };
}

describe('normalizeLoanScheduleData accrued interest', () => {
  it('keeps totalAccruedInterest, including zero, and omits it when absent', () => {
    const schedule = normalizeLoanScheduleData({
      currency: { code: 'UGX' },
      periods: [
        { period: 0, dueDate: [2026, 7, 1] },
        { period: 1, dueDate: [2026, 8, 1], interestDue: 50, totalAccruedInterest: 0 },
        { period: 2, dueDate: [2026, 9, 1], interestDue: 40, totalAccruedInterest: '12.5' },
        { period: 3, dueDate: [2026, 10, 1], interestDue: 30 }
      ]
    });

    assert.ok(schedule);
    assert.equal(schedule.periods?.[0]?.totalAccruedInterest, undefined);
    assert.equal(schedule.periods?.[1]?.totalAccruedInterest, 0);
    assert.equal(schedule.periods?.[2]?.totalAccruedInterest, 12.5);
    assert.equal(schedule.periods?.[3]?.totalAccruedInterest, undefined);
  });
});

describe('loanScheduleHasAccruedInterest', () => {
  it('is true when any period includes the field, including zero', () => {
    assert.equal(
      loanScheduleHasAccruedInterest([{ totalAccruedInterest: undefined }, { totalAccruedInterest: 0 }]),
      true
    );
    assert.equal(loanScheduleHasAccruedInterest([{ interestDue: 10 }]), false);
    assert.equal(loanScheduleHasAccruedInterest([]), false);
  });

  it('sums only periods that include accrued interest', () => {
    assert.equal(
      loanScheduleTotalAccruedInterest([
        { totalAccruedInterest: 0.1 },
        {},
        { totalAccruedInterest: 0.2 }
      ]),
      0.3
    );
    assert.equal(loanScheduleTotalAccruedInterest([{}]), undefined);
  });
});

describe('buildLoanRepaymentScheduleDocumentData accrued interest', () => {
  it('adds the accrued column and total only when the schedule includes it', () => {
    const without = buildLoanRepaymentScheduleDocumentData({
      account: account(),
      schedule: {
        currency: { code: 'UGX' },
        periods: [{ period: 1, interestDue: 10 }]
      },
      generatedOn: new Date(2026, 9, 1)
    });
    assert.equal(without.showAccruedInterest, false);
    assert.equal(without.totalAccruedInterestLabel, undefined);
    assert.equal(without.rows[0]?.accruedInterest, undefined);

    const withAccrued = buildLoanRepaymentScheduleDocumentData({
      account: account(),
      schedule: {
        currency: { code: 'UGX' },
        periods: [
          { period: 0, principalDisbursed: 1000 },
          { period: 1, interestDue: 50, totalAccruedInterest: 0 },
          { period: 2, interestDue: 40 }
        ]
      },
      generatedOn: new Date(2026, 9, 1)
    });
    assert.equal(withAccrued.showAccruedInterest, true);
    assert.match(withAccrued.totalAccruedInterestLabel ?? '', /0\.00/);
    assert.equal(withAccrued.rows[0]?.accruedInterest, '—');
    assert.match(withAccrued.rows[1]?.accruedInterest ?? '', /0\.00/);
    assert.equal(withAccrued.rows[2]?.accruedInterest, '—');
  });
});
