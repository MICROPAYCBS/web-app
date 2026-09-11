/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { parseAmount, toDecimal } from '@mifos/domain';
import {
  FINERACT_DATE_FORMAT,
  normalizeFineractDateField,
  parseFineractDateString,
  toFineractDate
} from '@/lib/fineract/dates';

export const SAVINGS_TRANSACTIONS_IMPORT_PATH = '/savings/import';

export const SAVINGS_TRANSACTIONS_IMPORT_TEMPLATE_HINT =
  'Fill one deposit or withdrawal per row. Required: customer name, transaction type (Deposit or Withdrawal), amount, date, payment type, and savings account number. Optional: check no, routing code, receipt no, bank no, and note. Account No is the savings account number. Enter it as text if it has leading zeros. Cash payment types that require denominations cannot be imported.';

export const SAVINGS_TRANSACTIONS_IMPORT_SHEET_NAME = 'SavingsTransactions';

export const SAVINGS_TRANSACTIONS_IMPORT_COLUMNS = [
  'Client Name',
  'Transaction Type',
  'Amount',
  'Date',
  'Payment Type',
  'Account No',
  'Check No',
  'Routing Code',
  'Receipt No',
  'Bank No',
  'Note'
] as const;

export type SavingsTransactionsImportColumn =
  (typeof SAVINGS_TRANSACTIONS_IMPORT_COLUMNS)[number];

export const SAVINGS_TRANSACTIONS_IMPORT_REQUIRED_COLUMNS: SavingsTransactionsImportColumn[] = [
  'Client Name',
  'Transaction Type',
  'Amount',
  'Date',
  'Payment Type',
  'Account No'
];

export const SAVINGS_TRANSACTION_IMPORT_TYPES = ['Deposit', 'Withdrawal'] as const;

export type SavingsTransactionImportType = (typeof SAVINGS_TRANSACTION_IMPORT_TYPES)[number];

export type SavingsTransactionsImportWorkbookRawRow = {
  /** 1-based spreadsheet row number. */
  rowNumber: number;
  values: Partial<Record<SavingsTransactionsImportColumn, unknown>>;
};

export type SavingsTransactionImportCommand = 'deposit' | 'withdrawal';

export type SavingsTransactionImportAccount = {
  id: number;
  accountNo: string;
  clientId: number;
  clientName: string;
  active: boolean;
  blockAll: boolean;
  blockCredit: boolean;
  blockDebit: boolean;
};

export type SavingsTransactionImportAccountLookup =
  | { status: 'found'; account: SavingsTransactionImportAccount }
  | { status: 'missing' }
  | { status: 'ambiguous' };

export type SavingsTransactionImportPaymentType = {
  id: number;
  name: string;
  isCashPayment: boolean;
};

export type SavingsTransactionsImportAnalyzeContext = {
  accountsByAccountNo: Record<string, SavingsTransactionImportAccountLookup>;
  paymentTypes: SavingsTransactionImportPaymentType[];
  businessDate?: string;
  canDeposit: boolean;
  canWithdraw: boolean;
  requireCashierForCash: boolean;
  hasActiveCashierSession: boolean;
  cashDenominationsRequired: boolean;
};

export type SavingsTransactionsImportAnalyzedRow = {
  rowNumber: number;
  clientName: string;
  transactionType: string;
  amount: string;
  date: string;
  paymentType: string;
  accountNo: string;
  checkNo: string;
  routingCode: string;
  receiptNo: string;
  bankNo: string;
  note: string;
  errors: string[];
  warnings: string[];
  command?: SavingsTransactionImportCommand;
  account?: SavingsTransactionImportAccount;
  paymentTypeId?: number;
  transactionAmount?: number;
  transactionDate?: string;
};

export type SavingsTransactionsImportAnalysis = {
  rows: SavingsTransactionsImportAnalyzedRow[];
  rowCount: number;
  errorRowCount: number;
  warningRowCount: number;
  canPost: boolean;
};

export type SavingsTransactionImportPayload = {
  transactionDate: string;
  transactionAmount: number;
  paymentTypeId: number;
  checkNumber?: string;
  routingCode?: string;
  receiptNumber?: string;
  bankNumber?: string;
  note?: string;
};

export type SavingsTransactionsImportPreparedRow = {
  rowNumber: number;
  clientId: string;
  accountId: string;
  command: SavingsTransactionImportCommand;
  displayClientName: string;
  accountNo: string;
  transactionType: SavingsTransactionImportType;
  amountLabel: string;
  date: string;
  paymentType: string;
  input: SavingsTransactionImportPayload;
};

export type SavingsTransactionsImportRowProgressStatus =
  | 'pending'
  | 'posting'
  | 'success'
  | 'pending_approval'
  | 'failed';

export type SavingsTransactionsImportRowProgress = {
  status: SavingsTransactionsImportRowProgressStatus;
  message?: string;
  resourceId?: number;
};

export const CASH_DENOMINATION_IMPORT_MESSAGE =
  'Cash payment types that require denominations cannot be imported. Post them from the savings account screen.';

export function cellText(value: unknown): string {
  if (value == null) {
    return '';
  }
  if (value instanceof Date) {
    return toFineractDate(value);
  }
  return String(value).trim();
}

export function normalizeCompareKey(value: unknown): string {
  return cellText(value).replace(/\s+/g, ' ').toUpperCase();
}

export function accountNoText(value: unknown): string {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(Math.trunc(value));
  }
  return cellText(value);
}

export function parseImportTransactionType(
  value: unknown
): SavingsTransactionImportType | undefined {
  const key = normalizeCompareKey(value);
  if (key === 'DEPOSIT') {
    return 'Deposit';
  }
  if (key === 'WITHDRAWAL') {
    return 'Withdrawal';
  }
  return undefined;
}

export function parseImportAmount(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    const parsed = toDecimal(value);
    if (!parsed || !parsed.isFinite() || parsed.lte(0)) {
      return undefined;
    }
    return parsed.toNumber();
  }
  const text = cellText(value).replace(/,/g, '');
  const parsed = parseAmount(text);
  if (!parsed || parsed.lte(0)) {
    return undefined;
  }
  return parsed.toNumber();
}

export function parseImportDate(
  value: unknown
): { ok: true; value: string } | { ok: false; message: string } {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return { ok: true, value: toFineractDate(value) };
  }
  if (typeof value === 'number' && Number.isFinite(value) && value > 20000 && value < 80000) {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const parsed = new Date(excelEpoch.getTime() + value * 24 * 60 * 60 * 1000);
    if (!Number.isNaN(parsed.getTime())) {
      return { ok: true, value: toFineractDate(parsed) };
    }
  }
  const text = cellText(value);
  if (!text) {
    return { ok: false, message: 'Date is required.' };
  }
  const normalized = normalizeFineractDateField(text);
  if (!normalized || !parseFineractDateString(normalized)) {
    return {
      ok: false,
      message: `Date must be a valid date (e.g. ${FINERACT_DATE_FORMAT}).`
    };
  }
  return { ok: true, value: normalized };
}

export function isTransactionDateAfterBusinessDate(
  transactionDate: string,
  businessDate: string | undefined
): boolean {
  if (!businessDate?.trim()) {
    return false;
  }
  const selected = parseFineractDateString(transactionDate);
  const cap = parseFineractDateString(businessDate);
  if (!selected || !cap) {
    return false;
  }
  return selected.getTime() > cap.getTime();
}

export function findImportPaymentType(
  options: SavingsTransactionImportPaymentType[],
  raw: string
): SavingsTransactionImportPaymentType | undefined {
  const key = normalizeCompareKey(raw);
  if (!key) {
    return undefined;
  }
  const asId = Number(raw);
  if (Number.isInteger(asId) && asId > 0) {
    const byId = options.find((option) => option.id === asId);
    if (byId) {
      return byId;
    }
  }
  return options.find((option) => normalizeCompareKey(option.name) === key);
}

function optionalField(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

export function analyzeSavingsTransactionImportRows(
  rows: SavingsTransactionsImportWorkbookRawRow[],
  context: SavingsTransactionsImportAnalyzeContext
): SavingsTransactionsImportAnalysis {
  const analyzed = rows.map((row) => analyzeSavingsTransactionImportRow(row, context));
  const errorRowCount = analyzed.filter((row) => row.errors.length > 0).length;
  const warningRowCount = analyzed.filter(
    (row) => row.errors.length === 0 && row.warnings.length > 0
  ).length;
  return {
    rows: analyzed,
    rowCount: analyzed.length,
    errorRowCount,
    warningRowCount,
    canPost: analyzed.length > 0 && errorRowCount === 0
  };
}

export function analyzeSavingsTransactionImportRow(
  row: SavingsTransactionsImportWorkbookRawRow,
  context: SavingsTransactionsImportAnalyzeContext
): SavingsTransactionsImportAnalyzedRow {
  const values = row.values;
  const clientName = cellText(values['Client Name']);
  const transactionTypeRaw = cellText(values['Transaction Type']);
  const paymentTypeRaw = cellText(values['Payment Type']);
  const accountNo = accountNoText(values['Account No']);
  const checkNo = cellText(values['Check No']);
  const routingCode = cellText(values['Routing Code']);
  const receiptNo = cellText(values['Receipt No']);
  const bankNo = cellText(values['Bank No']);
  const note = cellText(values['Note']);
  const errors: string[] = [];
  const warnings: string[] = [];

  const analyzed: SavingsTransactionsImportAnalyzedRow = {
    rowNumber: row.rowNumber,
    clientName,
    transactionType: transactionTypeRaw,
    amount: cellText(values.Amount),
    date: cellText(values.Date),
    paymentType: paymentTypeRaw,
    accountNo,
    checkNo,
    routingCode,
    receiptNo,
    bankNo,
    note,
    errors,
    warnings
  };

  if (!clientName) {
    errors.push('Customer name is required.');
  }
  const transactionType = parseImportTransactionType(transactionTypeRaw);
  if (!transactionType) {
    errors.push('Transaction type must be Deposit or Withdrawal.');
  } else {
    analyzed.command = transactionType === 'Deposit' ? 'deposit' : 'withdrawal';
    analyzed.transactionType = transactionType;
  }

  const amount = parseImportAmount(values.Amount);
  if (amount == null) {
    errors.push('Amount must be a number greater than zero.');
  } else {
    analyzed.transactionAmount = amount;
    analyzed.amount = String(amount);
  }

  const parsedDate = parseImportDate(values.Date);
  if (!parsedDate.ok) {
    errors.push(parsedDate.message);
  } else {
    analyzed.transactionDate = parsedDate.value;
    analyzed.date = parsedDate.value;
    if (isTransactionDateAfterBusinessDate(parsedDate.value, context.businessDate)) {
      errors.push('Date cannot be after the organisation business date.');
    }
  }

  const paymentType = findImportPaymentType(context.paymentTypes, paymentTypeRaw);
  if (!paymentTypeRaw) {
    errors.push('Payment type is required.');
  } else if (!paymentType) {
    errors.push('Unknown payment type.');
  } else {
    analyzed.paymentTypeId = paymentType.id;
    analyzed.paymentType = paymentType.name;
    if (paymentType.isCashPayment && context.cashDenominationsRequired) {
      errors.push(CASH_DENOMINATION_IMPORT_MESSAGE);
    } else if (
      paymentType.isCashPayment &&
      context.requireCashierForCash &&
      !context.hasActiveCashierSession
    ) {
      errors.push('An active cashier session is required for cash transactions.');
    }
  }

  if (!accountNo) {
    errors.push('Account number is required.');
  } else {
    const lookup = context.accountsByAccountNo[accountNo];
    if (!lookup || lookup.status === 'missing') {
      errors.push('No savings account found for this account number.');
    } else if (lookup.status === 'ambiguous') {
      errors.push('More than one savings account matches this account number.');
    } else {
      analyzed.account = lookup.account;
      if (
        clientName &&
        normalizeCompareKey(clientName) !== normalizeCompareKey(lookup.account.clientName)
      ) {
        errors.push('Customer name does not match this savings account.');
      }
      if (!lookup.account.active || lookup.account.blockAll) {
        errors.push('This savings account is not active.');
      } else if (analyzed.command === 'deposit' && lookup.account.blockCredit) {
        errors.push('Deposits are blocked on this savings account.');
      } else if (analyzed.command === 'withdrawal' && lookup.account.blockDebit) {
        errors.push('Withdrawals are blocked on this savings account.');
      }
    }
  }

  if (analyzed.command === 'deposit' && !context.canDeposit) {
    errors.push('Your role cannot post deposits.');
  }
  if (analyzed.command === 'withdrawal' && !context.canWithdraw) {
    errors.push('Your role cannot post withdrawals.');
  }

  return analyzed;
}

export function prepareSavingsTransactionImportRows(
  analysis: SavingsTransactionsImportAnalysis
): { ok: true; rows: SavingsTransactionsImportPreparedRow[] } | { ok: false; message: string } {
  if (!analysis.canPost) {
    return { ok: false, message: 'Fix the highlighted rows before posting transactions.' };
  }

  const rows: SavingsTransactionsImportPreparedRow[] = [];
  for (const row of analysis.rows) {
    if (
      !row.account ||
      !row.command ||
      row.paymentTypeId == null ||
      row.transactionAmount == null ||
      !row.transactionDate
    ) {
      return { ok: false, message: 'Fix the highlighted rows before posting transactions.' };
    }
    rows.push({
      rowNumber: row.rowNumber,
      clientId: String(row.account.clientId),
      accountId: String(row.account.id),
      command: row.command,
      displayClientName: row.account.clientName,
      accountNo: row.account.accountNo,
      transactionType: row.command === 'deposit' ? 'Deposit' : 'Withdrawal',
      amountLabel: String(row.transactionAmount),
      date: row.transactionDate,
      paymentType: row.paymentType,
      input: {
        transactionDate: row.transactionDate,
        transactionAmount: row.transactionAmount,
        paymentTypeId: row.paymentTypeId,
        checkNumber: optionalField(row.checkNo),
        routingCode: optionalField(row.routingCode),
        receiptNumber: optionalField(row.receiptNo),
        bankNumber: optionalField(row.bankNo),
        note: optionalField(row.note)
      }
    });
  }
  return { ok: true, rows };
}
