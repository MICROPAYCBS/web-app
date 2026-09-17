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
  createLoanRescheduleRequestSchema,
  LOAN_RESCHEDULE_CHANGE_REQUIRED_MESSAGE
} from './loan-reschedule.schema';

const base = {
  loanId: 18,
  rescheduleFromDate: '01 September 2026',
  rescheduleReasonId: 1,
  submittedOnDate: '17 September 2026'
};

describe('createLoanRescheduleRequestSchema', () => {
  it('requires at least one schedule change', () => {
    const result = createLoanRescheduleRequestSchema.safeParse(base);
    assert.equal(result.success, false);
    if (!result.success) {
      assert.ok(
        result.error.issues.some((issue) => issue.message === LOAN_RESCHEDULE_CHANGE_REQUIRED_MESSAGE)
      );
    }
  });

  it('accepts extra repayments as the schedule change', () => {
    const result = createLoanRescheduleRequestSchema.safeParse({
      ...base,
      extraTerms: 2
    });
    assert.equal(result.success, true);
  });

  it('requires a reason and installment date', () => {
    const result = createLoanRescheduleRequestSchema.safeParse({
      loanId: 18,
      extraTerms: 1
    });
    assert.equal(result.success, false);
    if (!result.success) {
      assert.ok(result.error.issues.some((issue) => issue.path[0] === 'rescheduleFromDate'));
      assert.ok(result.error.issues.some((issue) => issue.path[0] === 'rescheduleReasonId'));
    }
  });
});
