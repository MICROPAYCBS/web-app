/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractSavingsAccountTransaction } from '@mifos/api-client';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildSavingsStatement,
  savingsStatementTransactionDescription
} from './savings-statement';

function transaction(
  overrides: Partial<FineractSavingsAccountTransaction> = {}
): FineractSavingsAccountTransaction {
  return {
    id: 1,
    amount: 100,
    reversed: false,
    ...overrides
  } as FineractSavingsAccountTransaction;
}

describe('buildSavingsStatement', () => {
  it('filters by date range and derives opening and closing balances', () => {
    const result = buildSavingsStatement(
      [
        transaction({
          id: 1,
          date: [2026, 5, 31],
          amount: 1000,
          runningBalance: 1000,
          transactionType: { deposit: true, value: 'Deposit' }
        }),
        transaction({
          id: 2,
          date: [2026, 6, 5],
          amount: 200,
          runningBalance: 1200,
          transactionType: { deposit: true, value: 'Deposit' }
        }),
        transaction({
          id: 3,
          date: [2026, 6, 20],
          amount: 50,
          runningBalance: 1150,
          transactionType: { withdrawal: true, value: 'Withdrawal' }
        })
      ],
      new Date(2026, 5, 1),
      new Date(2026, 5, 30)
    );

    assert.equal(result.transactions.length, 2);
    assert.equal(result.openingBalance, 1000);
    assert.equal(result.closingBalance, 1150);
    assert.equal(result.totalDeposits, 200);
    assert.equal(result.totalWithdrawals, 50);
  });

  it('excludes reversed transactions', () => {
    const result = buildSavingsStatement(
      [
        transaction({
          id: 1,
          date: [2026, 6, 1],
          runningBalance: 500,
          reversed: true,
          transactionType: { deposit: true, value: 'Deposit' }
        }),
        transaction({
          id: 2,
          date: [2026, 6, 2],
          runningBalance: 700,
          transactionType: { deposit: true, value: 'Deposit' }
        })
      ],
      new Date(2026, 5, 1),
      new Date(2026, 5, 30)
    );

    assert.equal(result.transactions.length, 1);
    assert.equal(result.transactions[0]?.id, 2);
  });
});

describe('savingsStatementTransactionDescription', () => {
  it('prefers transfer description over transaction type', () => {
    assert.equal(
      savingsStatementTransactionDescription(
        transaction({
          transactionType: { withdrawal: true, value: 'Withdrawal' },
          transfer: { transferDescription: 'Loan repayment' }
        })
      ),
      'Loan repayment'
    );
  });
});
