/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractSavingsAccountTransaction } from '@mifos/api-client';
import {
  endOfDay,
  isBefore,
  isWithinInterval,
  startOfDay
} from 'date-fns';
import { fineractDateToDate } from '@/lib/fineract/date-input';
import {
  formatSavingsTransactionType,
  isPureSavingsDeposit,
  isPureSavingsWithdrawal,
  isSavingsAccountTransfer,
  isSavingsTransactionDebit,
  savingsTransactionDate
} from '@/lib/fineract/savings-account-display';

export type SavingsStatementResult = {
  transactions: FineractSavingsAccountTransaction[];
  openingBalance: number;
  closingBalance: number;
  totalDeposits: number;
  totalWithdrawals: number;
  totalInwardTransfers: number;
  totalOutwardTransfers: number;
};

export function isReversedSavingsStatementTransaction(
  transaction: FineractSavingsAccountTransaction
): boolean {
  return transaction.reversed === true;
}

export function savingsStatementTransactionDate(
  transaction: FineractSavingsAccountTransaction
): Date | null {
  const value = savingsTransactionDate(transaction);
  if (Array.isArray(value) && value.length >= 3) {
    return new Date(value[0], value[1] - 1, value[2]);
  }
  if (typeof value === 'string' && value.trim()) {
    return fineractDateToDate(value) ?? null;
  }
  return null;
}

export function savingsStatementTransactionDescription(
  transaction: FineractSavingsAccountTransaction
): string {
  const transferDescription = transaction.transfer?.transferDescription?.trim();
  if (transferDescription) {
    return transferDescription;
  }
  return formatSavingsTransactionType(transaction);
}

export function buildSavingsStatement(
  allTransactions: FineractSavingsAccountTransaction[],
  fromDate: Date,
  toDate: Date
): SavingsStatementResult {
  const effectiveTransactions = allTransactions.filter(
    (transaction) => !isReversedSavingsStatementTransaction(transaction)
  );

  const sorted = [...effectiveTransactions].sort((left, right) => {
    const leftDate = savingsStatementTransactionDate(left);
    const rightDate = savingsStatementTransactionDate(right);
    if (!leftDate || !rightDate) {
      return 0;
    }
    const leftTime = leftDate.getTime();
    const rightTime = rightDate.getTime();
    if (leftTime === rightTime) {
      return left.id - right.id;
    }
    return leftTime - rightTime;
  });

  const start = startOfDay(fromDate);
  const end = endOfDay(toDate);

  const transactions = sorted.filter((transaction) => {
    const transactionDate = savingsStatementTransactionDate(transaction);
    if (!transactionDate) {
      return false;
    }
    return isWithinInterval(transactionDate, { start, end });
  });

  const previousTransactions = sorted.filter((transaction) => {
    const transactionDate = savingsStatementTransactionDate(transaction);
    if (!transactionDate) {
      return false;
    }
    return isBefore(transactionDate, start);
  });

  let openingBalance = 0;
  if (previousTransactions.length > 0) {
    const lastPrevious = previousTransactions[previousTransactions.length - 1];
    openingBalance = lastPrevious.runningBalance ?? 0;
  }

  let closingBalance = openingBalance;
  if (transactions.length > 0) {
    const lastTransaction = transactions[transactions.length - 1];
    closingBalance = lastTransaction.runningBalance ?? openingBalance;
  }

  const totalDeposits = transactions
    .filter(isPureSavingsDeposit)
    .reduce((sum, transaction) => sum + (transaction.amount ?? 0), 0);

  const totalWithdrawals = transactions
    .filter(isPureSavingsWithdrawal)
    .reduce((sum, transaction) => sum + (transaction.amount ?? 0), 0);

  const totalInwardTransfers = transactions
    .filter(
      (transaction) =>
        isSavingsAccountTransfer(transaction) && !isSavingsTransactionDebit(transaction)
    )
    .reduce((sum, transaction) => sum + (transaction.amount ?? 0), 0);

  const totalOutwardTransfers = transactions
    .filter(
      (transaction) =>
        isSavingsAccountTransfer(transaction) && isSavingsTransactionDebit(transaction)
    )
    .reduce((sum, transaction) => sum + (transaction.amount ?? 0), 0);

  return {
    transactions,
    openingBalance,
    closingBalance,
    totalDeposits,
    totalWithdrawals,
    totalInwardTransfers,
    totalOutwardTransfers
  };
}
