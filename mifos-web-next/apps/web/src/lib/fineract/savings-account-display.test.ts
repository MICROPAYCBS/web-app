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
  formatSavingsTransactionType,
  isSavingsTransactionDebit,
  sumSavingsCashMovementTotals
} from './savings-account-display';

function transaction(
  overrides: Partial<FineractSavingsAccountTransaction> = {}
): FineractSavingsAccountTransaction {
  return {
    id: 1,
    amount: 100,
    ...overrides
  } as FineractSavingsAccountTransaction;
}

describe('isSavingsTransactionDebit', () => {
  it('uses Fineract debit and credit flags when present', () => {
    assert.equal(isSavingsTransactionDebit(transaction({ transactionType: { debit: true } })), true);
    assert.equal(isSavingsTransactionDebit(transaction({ transactionType: { credit: true } })), false);
  });

  it('treats hold amount as debit', () => {
    assert.equal(
      isSavingsTransactionDebit(
        transaction({
          transactionType: { value: 'Amount on hold', code: 'savingsAccountTransactionType.hold' }
        })
      ),
      true
    );
  });

  it('treats release amount as credit', () => {
    assert.equal(
      isSavingsTransactionDebit(
        transaction({
          transactionType: { value: 'Release amount', code: 'savingsAccountTransactionType.release' }
        })
      ),
      false
    );
  });

  it('classifies deposits and withdrawals', () => {
    assert.equal(
      isSavingsTransactionDebit(transaction({ transactionType: { deposit: true } })),
      false
    );
    assert.equal(
      isSavingsTransactionDebit(transaction({ transactionType: { withdrawal: true } })),
      true
    );
  });
});

describe('formatSavingsTransactionType', () => {
  it('labels linked account transfers as inward or outward', () => {
    assert.equal(
      formatSavingsTransactionType(
        transaction({
          transactionType: { deposit: true, value: 'Deposit' },
          transfer: { id: 1 }
        })
      ),
      'Inward Transfer'
    );
    assert.equal(
      formatSavingsTransactionType(
        transaction({
          transactionType: { withdrawal: true, value: 'Withdrawal' },
          transfer: { id: 2 }
        })
      ),
      'Outward Transfer'
    );
  });

  it('keeps cash deposits and withdrawals unchanged', () => {
    assert.equal(
      formatSavingsTransactionType(transaction({ transactionType: { deposit: true, value: 'Deposit' } })),
      'Deposit'
    );
    assert.equal(
      formatSavingsTransactionType(
        transaction({ transactionType: { withdrawal: true, value: 'Withdrawal' } })
      ),
      'Withdrawal'
    );
  });
});

describe('sumSavingsCashMovementTotals', () => {
  it('excludes account transfers from deposit and withdrawal totals', () => {
    const totals = sumSavingsCashMovementTotals([
      transaction({
        id: 1,
        amount: 10_000_000,
        transactionType: { deposit: true, value: 'Deposit' }
      }),
      transaction({
        id: 2,
        amount: 1_000_000,
        transactionType: { withdrawal: true, value: 'Withdrawal' }
      }),
      transaction({
        id: 3,
        amount: 200_000,
        transactionType: { deposit: true, value: 'Deposit' },
        transfer: { id: 9 }
      }),
      transaction({
        id: 4,
        amount: 500_000,
        transactionType: { withdrawal: true, value: 'Withdrawal' },
        transfer: { id: 10 }
      }),
      transaction({
        id: 5,
        amount: 50,
        reversed: true,
        transactionType: { withdrawal: true, value: 'Withdrawal' }
      })
    ]);

    assert.equal(totals.totalDeposits, 10_000_000);
    assert.equal(totals.totalWithdrawals, 1_000_000);
    assert.equal(totals.totalInwardTransfers, 200_000);
    assert.equal(totals.totalOutwardTransfers, 500_000);
  });
});
