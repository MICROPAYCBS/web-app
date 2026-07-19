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
  savingsTransactionOffersEdit,
  savingsTransactionOffersReceipt,
  savingsTransactionOffersUndo,
  savingsTransactionOffersUndoTransfer
} from './savings-transaction-actions';

function transaction(
  overrides: Partial<FineractSavingsAccountTransaction> = {}
): FineractSavingsAccountTransaction {
  return {
    id: 1,
    reversed: false,
    ...overrides
  } as FineractSavingsAccountTransaction;
}

describe('savingsTransactionOffersEdit', () => {
  it('allows manual deposits and withdrawals', () => {
    assert.equal(
      savingsTransactionOffersEdit(
        transaction({ transactionType: { deposit: true, withdrawal: false } })
      ),
      true
    );
    assert.equal(
      savingsTransactionOffersEdit(
        transaction({ transactionType: { deposit: false, withdrawal: true } })
      ),
      true
    );
  });

  it('rejects reversed, transfer, and accrual transactions', () => {
    assert.equal(savingsTransactionOffersEdit(transaction({ reversed: true })), false);
    assert.equal(
      savingsTransactionOffersEdit(transaction({ transfer: { id: 9, reversed: false } })),
      false
    );
    assert.equal(
      savingsTransactionOffersEdit(
        transaction({
          transactionType: { deposit: true, accrual: true }
        })
      ),
      false
    );
    assert.equal(
      savingsTransactionOffersEdit(
        transaction({
          transactionType: { deposit: true, code: 'savings.accrual' }
        })
      ),
      false
    );
  });

  it('rejects interest, fee, tax, and overdraft postings', () => {
    assert.equal(
      savingsTransactionOffersEdit(
        transaction({ transactionType: { interestPosting: true } })
      ),
      false
    );
    assert.equal(
      savingsTransactionOffersEdit(
        transaction({ transactionType: { feeDeduction: true } })
      ),
      false
    );
    assert.equal(
      savingsTransactionOffersEdit(
        transaction({ transactionType: { withholdTax: true } })
      ),
      false
    );
    assert.equal(
      savingsTransactionOffersEdit(
        transaction({ transactionType: { overdraftInterest: true } })
      ),
      false
    );
  });

  it('rejects transactions without a deposit or withdrawal type', () => {
    assert.equal(savingsTransactionOffersEdit(transaction({ transactionType: undefined })), false);
    assert.equal(
      savingsTransactionOffersEdit(transaction({ transactionType: { deposit: false, withdrawal: false } })),
      false
    );
  });
});

describe('savingsTransactionOffersReceipt', () => {
  it('allows receipts for manual deposits and withdrawals', () => {
    assert.equal(
      savingsTransactionOffersReceipt(
        transaction({ transactionType: { deposit: true, withdrawal: false } })
      ),
      true
    );
    assert.equal(
      savingsTransactionOffersReceipt(
        transaction({ transactionType: { deposit: false, withdrawal: true } })
      ),
      true
    );
  });

  it('rejects reversed and transfer transactions', () => {
    assert.equal(savingsTransactionOffersReceipt(transaction({ reversed: true })), false);
    assert.equal(
      savingsTransactionOffersReceipt(transaction({ transfer: { id: 9, reversed: false } })),
      false
    );
  });
});

describe('savingsTransactionOffersUndo', () => {
  it('allows undo for active non-transfer transactions', () => {
    assert.equal(savingsTransactionOffersUndo(transaction()), true);
    assert.equal(savingsTransactionOffersUndo(transaction({ reversed: true })), false);
    assert.equal(
      savingsTransactionOffersUndo(transaction({ transfer: { id: 2, reversed: false } })),
      false
    );
  });
});

describe('savingsTransactionOffersUndoTransfer', () => {
  it('allows undo transfer only for active transfer rows', () => {
    assert.equal(savingsTransactionOffersUndoTransfer(transaction()), false);
    assert.equal(
      savingsTransactionOffersUndoTransfer(transaction({ transfer: { id: 2, reversed: false } })),
      true
    );
    assert.equal(
      savingsTransactionOffersUndoTransfer(
        transaction({ reversed: true, transfer: { id: 2, reversed: false } })
      ),
      false
    );
  });
});
