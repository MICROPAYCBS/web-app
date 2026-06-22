/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractSavingsAccountTransaction } from '@mifos/api-client';
import { isSavingsTransactionAccrual } from '@/lib/fineract/savings-account-display';

export interface SavingsTransactionActionPermissions {
  undoTransaction: boolean;
  undoTransfer: boolean;
  modifyTransaction: boolean;
  viewJournal: boolean;
}

export function savingsTransactionOffersUndo(
  transaction: Pick<FineractSavingsAccountTransaction, 'reversed' | 'transfer'>
): boolean {
  return !transaction.reversed && !transaction.transfer;
}

export function savingsTransactionOffersUndoTransfer(
  transaction: Pick<FineractSavingsAccountTransaction, 'reversed' | 'transfer'>
): boolean {
  return !transaction.reversed && transaction.transfer?.id != null;
}

/** Manual deposits and withdrawals only — not transfers, accruals, or system postings. */
export function savingsTransactionOffersEdit(
  transaction: FineractSavingsAccountTransaction
): boolean {
  if (transaction.reversed || transaction.transfer) {
    return false;
  }
  if (isSavingsTransactionAccrual(transaction)) {
    return false;
  }
  const type = transaction.transactionType;
  if (!type) {
    return false;
  }
  if (
    type.interestPosting ||
    type.feeDeduction ||
    type.withholdTax ||
    type.overdraftInterest ||
    type.accrual
  ) {
    return false;
  }
  return type.deposit === true || type.withdrawal === true;
}
