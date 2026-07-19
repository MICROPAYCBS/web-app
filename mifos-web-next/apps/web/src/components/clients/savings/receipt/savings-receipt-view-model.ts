/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractSavingsAccountTransaction } from '@mifos/api-client';
import { formatMoney, parseAmount } from '@mifos/domain';
import type { PaymentDetailFieldValues } from '@/components/composites/payment-detail-fields';
import {
  FINERACT_DATE_FORMAT,
  formatFineractDateArray,
  parseFineractDateString
} from '@/lib/fineract/dates';
import { formatAccountMoney } from '@/lib/fineract/format-account-money';
import {
  formatSavingsTransactionType,
  savingsTransactionDate
} from '@/lib/fineract/savings-account-display';
import { format } from 'date-fns';

export type SavingsReceiptData = {
  transactionId: number;
  transactionDateLabel: string;
  transactionAmountLabel: string;
  transactionTypeLabel: string;
  paymentType?: string;
  receiptNumber?: string;
  checkNumber?: string;
  routingCode?: string;
  accountNumber?: string;
  bankNumber?: string;
  note?: string;
  runningBalanceLabel?: string;
  accountNo: string;
  clientName: string;
  currencyCode: string;
  orgName?: string;
};

function formatReceiptDate(value: string | number[] | undefined): string {
  if (Array.isArray(value)) {
    return formatFineractDateArray(value) ?? '—';
  }
  if (typeof value === 'string' && value.trim()) {
    const parsed = parseFineractDateString(value);
    if (parsed) {
      return format(parsed, FINERACT_DATE_FORMAT);
    }
    return value;
  }
  return '—';
}

function formatReceiptAmount(amount: string | number, currencyCode: string): string {
  if (typeof amount === 'number') {
    return formatAccountMoney(amount, currencyCode);
  }
  const parsed = parseAmount(amount);
  if (!parsed) {
    return amount.trim() || '—';
  }
  return formatMoney(parsed, currencyCode) ?? formatAccountMoney(parsed.toNumber(), currencyCode);
}

export function buildSavingsReceiptFromTransaction(
  transaction: FineractSavingsAccountTransaction,
  account: { accountNo: string; clientName?: string },
  currencyCode: string,
  orgName?: string
): SavingsReceiptData {
  const payment = transaction.paymentDetailData;
  const runningBalance =
    transaction.runningBalance != null
      ? formatAccountMoney(transaction.runningBalance, currencyCode)
      : undefined;

  return {
    transactionId: transaction.id,
    transactionDateLabel: formatReceiptDate(savingsTransactionDate(transaction)),
    transactionAmountLabel: formatAccountMoney(transaction.amount, currencyCode),
    transactionTypeLabel: formatSavingsTransactionType(transaction),
    paymentType: payment?.paymentType?.name,
    receiptNumber: payment?.receiptNumber,
    checkNumber: payment?.checkNumber,
    routingCode: payment?.routingCode,
    accountNumber: payment?.accountNumber,
    bankNumber: payment?.bankNumber,
    note: transaction.note,
    runningBalanceLabel: runningBalance,
    accountNo: account.accountNo,
    clientName: account.clientName?.trim() || '—',
    currencyCode,
    orgName
  };
}

export function buildSavingsReceiptFromSubmission(input: {
  transactionId: number;
  transactionDate: string;
  transactionAmount: string;
  transactionTypeLabel: string;
  paymentTypeName?: string;
  note?: string;
  paymentDetails: PaymentDetailFieldValues;
  account: { accountNo: string; clientName?: string };
  currencyCode: string;
  orgName?: string;
}): SavingsReceiptData {
  return {
    transactionId: input.transactionId,
    transactionDateLabel: formatReceiptDate(input.transactionDate),
    transactionAmountLabel: formatReceiptAmount(input.transactionAmount, input.currencyCode),
    transactionTypeLabel: input.transactionTypeLabel,
    paymentType: input.paymentTypeName,
    receiptNumber: input.paymentDetails.receiptNumber.trim() || undefined,
    checkNumber: input.paymentDetails.checkNumber.trim() || undefined,
    routingCode: input.paymentDetails.routingCode.trim() || undefined,
    accountNumber: input.paymentDetails.accountNumber.trim() || undefined,
    bankNumber: input.paymentDetails.bankNumber.trim() || undefined,
    note: input.note?.trim() || undefined,
    accountNo: input.account.accountNo,
    clientName: input.account.clientName?.trim() || '—',
    currencyCode: input.currencyCode,
    orgName: input.orgName
  };
}
