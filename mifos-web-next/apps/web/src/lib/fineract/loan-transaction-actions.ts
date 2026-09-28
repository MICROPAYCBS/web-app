/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractLoanAccountTransaction } from '@/lib/fineract/loan-account-types';

export interface LoanTransactionActionPermissions {
  undoTransaction: boolean;
  undoWriteOff: boolean;
  viewJournal: boolean;
}

export const EMPTY_LOAN_TRANSACTION_ACTION_PERMISSIONS: LoanTransactionActionPermissions = {
  undoTransaction: false,
  undoWriteOff: false,
  viewJournal: false
};

/** LoanTransactionType ids that the row menu does not reverse with a generic undo. */
const NOT_UNDOABLE_TYPE_IDS = new Set([
  1, // disbursement — undone from the account, not the row
  27, // charge-off
  29, // re-age
  30, // re-amortize
  33, // interest refund
  38 // contract termination
]);

const WRITE_OFF_TYPE_ID = 6;

export function loanTransactionOffersUndo(
  transaction: Pick<FineractLoanAccountTransaction, 'reversed' | 'type'>
): boolean {
  if (transaction.reversed) {
    return false;
  }
  const typeId = transaction.type?.id;
  if (typeId == null || NOT_UNDOABLE_TYPE_IDS.has(typeId)) {
    return false;
  }
  return true;
}

export function loanTransactionUndoIsWriteOff(
  transaction: Pick<FineractLoanAccountTransaction, 'type'>
): boolean {
  return transaction.type?.id === WRITE_OFF_TYPE_ID;
}
