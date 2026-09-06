/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractSavingsAccountTransaction } from '@mifos/api-client';
import {
  savingsTransactionOffersReceipt,
  savingsTransactionOffersUndo
} from '@/lib/fineract/savings-transaction-actions';

export interface DepositTransactionActionPermissions {
  undoTransaction: boolean;
  viewJournal: boolean;
}

/** Same eligibility as savings: not reversed and not a transfer. */
export function depositTransactionOffersUndo(
  transaction: Pick<FineractSavingsAccountTransaction, 'reversed' | 'transfer'>
): boolean {
  return savingsTransactionOffersUndo(transaction);
}

/** Receipts for manual deposits and withdrawals (RD installment cash, etc.). */
export function depositTransactionOffersReceipt(
  transaction: FineractSavingsAccountTransaction
): boolean {
  return savingsTransactionOffersReceipt(transaction);
}
