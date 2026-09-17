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
  LOAN_VARIABLE_SCHEDULE_CHANGE_REQUIRED_MESSAGE,
  loanVariableScheduleExceptionsSchema
} from './loan-variable-installments.schema';

describe('loanVariableScheduleExceptionsSchema', () => {
  it('requires at least one installment change', () => {
    const result = loanVariableScheduleExceptionsSchema.safeParse({
      loanId: 18,
      amountKind: 'installmentAmount'
    });
    assert.equal(result.success, false);
    if (!result.success) {
      assert.ok(
        result.error.issues.some(
          (issue) => issue.message === LOAN_VARIABLE_SCHEDULE_CHANGE_REQUIRED_MESSAGE
        )
      );
    }
  });

  it('accepts a modified installment amount for equal-installment loans', () => {
    const result = loanVariableScheduleExceptionsSchema.safeParse({
      loanId: 18,
      amountKind: 'installmentAmount',
      modifiedinstallments: [
        {
          dueDate: '20 October 2026',
          installmentAmount: 2500
        }
      ]
    });
    assert.equal(result.success, true);
  });

  it('rejects principal on equal-installment loans', () => {
    const result = loanVariableScheduleExceptionsSchema.safeParse({
      loanId: 18,
      amountKind: 'installmentAmount',
      modifiedinstallments: [
        {
          dueDate: '20 October 2026',
          principal: 2500
        }
      ]
    });
    assert.equal(result.success, false);
  });

  it('accepts a new principal installment on flat loans', () => {
    const result = loanVariableScheduleExceptionsSchema.safeParse({
      loanId: 18,
      amountKind: 'principal',
      newinstallments: [
        {
          dueDate: '31 October 2026',
          principal: 5000
        }
      ]
    });
    assert.equal(result.success, true);
  });

  it('requires an amount on new installments', () => {
    const result = loanVariableScheduleExceptionsSchema.safeParse({
      loanId: 18,
      amountKind: 'principal',
      newinstallments: [{ dueDate: '31 October 2026' }]
    });
    assert.equal(result.success, false);
  });
});
