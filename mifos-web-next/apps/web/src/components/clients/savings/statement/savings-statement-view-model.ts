/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractSavingsAccountDetail, FineractSavingsAccountTransaction } from '@mifos/api-client';
import { format } from 'date-fns';
import { formatAccountMoney } from '@/lib/fineract/format-account-money';
import {
  formatSavingsAccountDate,
  isSavingsTransactionDebit,
  savingsTransactionDate
} from '@/lib/fineract/savings-account-display';
import type { SavingsStatementResult } from '@/lib/fineract/savings-statement';
import { savingsStatementTransactionDescription } from '@/lib/fineract/savings-statement';
import { FINERACT_DATE_FORMAT } from '@/lib/fineract/dates';

export type SavingsStatementRow = {
  id: number;
  dateLabel: string;
  description: string;
  amountLabel: string;
  balanceLabel: string;
  tone: 'credit' | 'debit' | 'neutral';
};

export type SavingsStatementDocumentData = {
  accountNo: string;
  clientName: string;
  currencyCode: string;
  orgName?: string;
  periodFromLabel: string;
  periodToLabel: string;
  openingBalanceLabel: string;
  closingBalanceLabel: string;
  totalDepositsLabel: string;
  totalWithdrawalsLabel: string;
  rows: SavingsStatementRow[];
};

function formatStatementPeriodDate(date: Date): string {
  return format(date, FINERACT_DATE_FORMAT);
}

function statementRowTone(
  transaction: FineractSavingsAccountTransaction
): SavingsStatementRow['tone'] {
  if (isSavingsTransactionDebit(transaction)) {
    return 'debit';
  }
  if (transaction.transactionType?.deposit || transaction.transactionType?.interestPosting) {
    return 'credit';
  }
  return 'neutral';
}

function formatStatementRowAmount(
  transaction: FineractSavingsAccountTransaction,
  currencyCode: string
): string {
  const formatted = formatAccountMoney(transaction.amount, currencyCode);
  if (formatted === '—') {
    return '—';
  }
  return isSavingsTransactionDebit(transaction) ? `-${formatted}` : formatted;
}

export function buildSavingsStatementDocumentData(input: {
  account: Pick<FineractSavingsAccountDetail, 'accountNo' | 'clientName'>;
  orgName: string;
  currencyCode: string;
  fromDate: Date;
  toDate: Date;
  statement: SavingsStatementResult;
}): SavingsStatementDocumentData {
  const { account, orgName, currencyCode, fromDate, toDate, statement } = input;

  return {
    accountNo: account.accountNo,
    clientName: account.clientName?.trim() || '—',
    currencyCode,
    orgName,
    periodFromLabel: formatStatementPeriodDate(fromDate),
    periodToLabel: formatStatementPeriodDate(toDate),
    openingBalanceLabel: formatAccountMoney(statement.openingBalance, currencyCode),
    closingBalanceLabel: formatAccountMoney(statement.closingBalance, currencyCode),
    totalDepositsLabel: formatAccountMoney(statement.totalDeposits, currencyCode),
    totalWithdrawalsLabel: formatAccountMoney(statement.totalWithdrawals, currencyCode),
    rows: statement.transactions.map((transaction) => ({
      id: transaction.id,
      dateLabel: formatSavingsAccountDate(savingsTransactionDate(transaction)),
      description: savingsStatementTransactionDescription(transaction),
      amountLabel: formatStatementRowAmount(transaction, currencyCode),
      balanceLabel:
        transaction.runningBalance != null
          ? formatAccountMoney(transaction.runningBalance, currencyCode)
          : '—',
      tone: statementRowTone(transaction)
    }))
  };
}

export function savingsStatementFileName(accountNo: string, toDate: Date): string {
  return `statement_${accountNo}_${format(toDate, 'yyyyMMdd')}.pdf`;
}
