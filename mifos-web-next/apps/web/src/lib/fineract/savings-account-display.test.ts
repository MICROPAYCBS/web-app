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
import { isSavingsTransactionDebit } from './savings-account-display';

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
