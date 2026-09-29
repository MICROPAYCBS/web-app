/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { FineractLoanAccountDetail } from '@/lib/fineract/loan-account-types';
import {
  loanRescheduleCommandDate,
  unpaidLoanRescheduleInstallments
} from '@/lib/fineract/loan-reschedule-display';

function accountWithSchedule(): FineractLoanAccountDetail {
  return {
    id: 1,
    accountNo: '100LP00000000035',
    status: { id: 300, value: 'Active', code: 'loanStatusType.active', active: true },
    currency: { code: 'UGX', name: 'Ugandan Shilling' },
    repaymentSchedule: {
      periods: [
        { period: 0, dueDate: 'Jul 1, 2026', principalDisbursed: 5_000_000 },
        {
          period: 1,
          dueDate: 'Aug 1, 2026',
          complete: false,
          principalDue: 1_617_651.82,
          interestDue: 50_000
        },
        { period: 2, dueDate: '01 September 2026', complete: true, principalDue: 100 },
        { period: 3, dueDate: 'Oct 1, 2026', complete: false, principalDue: 1_716_166.81 }
      ]
    }
  };
}

describe('loanRescheduleCommandDate', () => {
  it('converts schedule display dates to the command format', () => {
    assert.equal(loanRescheduleCommandDate('Aug 1, 2026'), '01 August 2026');
    assert.equal(loanRescheduleCommandDate('Due Aug 1, 2026'), '01 August 2026');
    assert.equal(loanRescheduleCommandDate('01 August 2026'), '01 August 2026');
    assert.equal(loanRescheduleCommandDate('29 September 2026'), '29 September 2026');
  });
});

describe('unpaidLoanRescheduleInstallments', () => {
  it('uses a command date as the option value and a display label', () => {
    const options = unpaidLoanRescheduleInstallments(accountWithSchedule());
    assert.deepEqual(
      options.map((option) => ({ dueDate: option.dueDate, label: option.label, period: option.period })),
      [
        { dueDate: '01 August 2026', label: 'Due Aug 1, 2026', period: 1 },
        { dueDate: '01 October 2026', label: 'Due Oct 1, 2026', period: 3 }
      ]
    );
  });
});
