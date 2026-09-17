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
  buildVariableScheduleExceptions,
  canDeleteVariableInstallment,
  hasVariableScheduleChanges,
  loanVariableInstallmentAmountKind,
  toFineractFormDate,
  type VariableInstallmentDraft
} from '@/lib/fineract/loan-variable-installments-display';

function draft(overrides: Partial<VariableInstallmentDraft>): VariableInstallmentDraft {
  return {
    key: 'period-1',
    period: 1,
    originalDueDate: '20 October 2026',
    dueDate: '20 October 2026',
    amount: 2500,
    originalAmount: 2500,
    ...overrides
  };
}

describe('loanVariableInstallmentAmountKind', () => {
  it('uses installment amount for declining-balance equal installments', () => {
    assert.equal(
      loanVariableInstallmentAmountKind({
        interestType: { id: 0 },
        amortizationType: { id: 1 }
      }),
      'installmentAmount'
    );
  });

  it('uses principal for flat interest', () => {
    assert.equal(
      loanVariableInstallmentAmountKind({
        interestType: { id: 1 },
        amortizationType: { id: 1 }
      }),
      'principal'
    );
  });
});

describe('toFineractFormDate', () => {
  it('canonicalizes locale medium dates', () => {
    assert.equal(toFineractFormDate('Oct 20, 2026'), '20 October 2026');
  });
});

describe('buildVariableScheduleExceptions', () => {
  it('emits modified due date and installment amount', () => {
    const payload = buildVariableScheduleExceptions(
      [
        draft({
          dueDate: '25 October 2026',
          amount: 3000
        })
      ],
      'installmentAmount'
    );
    assert.deepEqual(payload.modifiedinstallments, [
      {
        dueDate: '20 October 2026',
        modifiedDueDate: '25 October 2026',
        installmentAmount: 3000
      }
    ]);
  });

  it('emits new and deleted installments', () => {
    const payload = buildVariableScheduleExceptions(
      [
        draft({ deleted: true }),
        draft({
          key: 'new-1',
          isNew: true,
          originalDueDate: undefined,
          dueDate: '31 October 2026',
          amount: 5000,
          originalAmount: 5000
        })
      ],
      'principal'
    );
    assert.deepEqual(payload.deletedinstallments, [{ dueDate: '20 October 2026' }]);
    assert.deepEqual(payload.newinstallments, [
      { dueDate: '31 October 2026', principal: 5000 }
    ]);
  });

  it('ignores unchanged rows', () => {
    assert.equal(hasVariableScheduleChanges([draft({})]), false);
  });
});

describe('canDeleteVariableInstallment', () => {
  it('keeps the last remaining installment', () => {
    const rows = [
      draft({ key: 'period-1' }),
      draft({ key: 'period-2', period: 2, originalDueDate: '20 November 2026' })
    ];
    assert.equal(canDeleteVariableInstallment(rows, 'period-1'), true);
    assert.equal(canDeleteVariableInstallment(rows, 'period-2'), false);
  });
});
