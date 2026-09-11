/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as XLSX from 'xlsx';
import {
  analyzeSavingsTransactionImportRows,
  CASH_DENOMINATION_IMPORT_MESSAGE,
  prepareSavingsTransactionImportRows,
  SAVINGS_TRANSACTIONS_IMPORT_COLUMNS,
  SAVINGS_TRANSACTIONS_IMPORT_SHEET_NAME,
  type SavingsTransactionsImportAnalyzeContext,
  type SavingsTransactionsImportWorkbookRawRow
} from '@/lib/savings/savings-transactions-import';
import {
  buildSavingsTransactionsImportTemplateWorkbook,
  parseSavingsTransactionsImportWorkbook
} from '@/lib/savings/savings-transactions-import-workbook';

const account = {
  id: 88,
  accountNo: '000123',
  clientId: 12,
  clientName: 'Ada Lovelace',
  active: true,
  blockAll: false,
  blockCredit: false,
  blockDebit: false
};

const context: SavingsTransactionsImportAnalyzeContext = {
  accountsByAccountNo: {
    '000123': { status: 'found', account }
  },
  paymentTypes: [{ id: 4, name: 'Cash', isCashPayment: true }],
  businessDate: '11 September 2026',
  canDeposit: true,
  canWithdraw: true,
  requireCashierForCash: false,
  hasActiveCashierSession: true,
  cashDenominationsRequired: false
};

function validRow(
  overrides: Partial<SavingsTransactionsImportWorkbookRawRow['values']> = {}
): SavingsTransactionsImportWorkbookRawRow {
  return {
    rowNumber: 2,
    values: {
      'Client Name': 'Ada Lovelace',
      'Transaction Type': 'Deposit',
      Amount: 25000,
      Date: '10 September 2026',
      'Payment Type': 'Cash',
      'Account No': '000123',
      ...overrides
    }
  };
}

describe('savings-transactions-import workbook', () => {
  it('builds a template and parses filled rows', () => {
    const empty = parseSavingsTransactionsImportWorkbook(
      buildSavingsTransactionsImportTemplateWorkbook(context.paymentTypes)
    );
    assert.equal(empty.ok, false);
    if (!empty.ok) {
      assert.match(empty.message, /No transaction rows/);
    }

    const workbook = buildSavingsTransactionsImportTemplateWorkbook(context.paymentTypes);
    const parsedWorkbook = XLSX.read(workbook, { type: 'array' });
    assert.ok(
      parsedWorkbook.SheetNames.includes(SAVINGS_TRANSACTIONS_IMPORT_SHEET_NAME)
    );
    const sheet = parsedWorkbook.Sheets[SAVINGS_TRANSACTIONS_IMPORT_SHEET_NAME];
    XLSX.utils.sheet_add_aoa(
      sheet,
      [
        [
          'Ada Lovelace',
          'Deposit',
          25000,
          '10 September 2026',
          'Cash',
          '000123',
          '',
          '',
          '',
          '',
          'Opening'
        ]
      ],
      { origin: 'A2' }
    );
    const filled = XLSX.write(parsedWorkbook, { type: 'array', bookType: 'xlsx' });
    const parsed = parseSavingsTransactionsImportWorkbook(new Uint8Array(filled).buffer);
    assert.equal(parsed.ok, true);
    if (parsed.ok) {
      assert.equal(parsed.rows.length, 1);
      assert.equal(parsed.rows[0].values['Client Name'], 'Ada Lovelace');
      assert.equal(parsed.rows[0].values['Account No'], '000123');
    }
  });

  it('rejects files missing required columns', () => {
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.aoa_to_sheet([['Client Name', 'Amount']]),
      SAVINGS_TRANSACTIONS_IMPORT_SHEET_NAME
    );
    const buffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' }) as number[];
    const parsed = parseSavingsTransactionsImportWorkbook(new Uint8Array(buffer).buffer);
    assert.equal(parsed.ok, false);
    if (!parsed.ok) {
      assert.match(parsed.message, /Missing required column/);
    }
  });

  it('keeps the expected header order', () => {
    assert.deepEqual(SAVINGS_TRANSACTIONS_IMPORT_COLUMNS, [
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
    ]);
  });
});

describe('analyzeSavingsTransactionImportRows', () => {
  it('prepares a valid deposit', () => {
    const analysis = analyzeSavingsTransactionImportRows([validRow()], context);
    assert.equal(analysis.canPost, true);
    const prepared = prepareSavingsTransactionImportRows(analysis);
    assert.equal(prepared.ok, true);
    if (prepared.ok) {
      assert.equal(prepared.rows[0].command, 'deposit');
      assert.equal(prepared.rows[0].accountId, '88');
      assert.equal(prepared.rows[0].input.transactionAmount, 25000);
      assert.equal('accountNumber' in prepared.rows[0].input, false);
    }
  });

  it('rejects a customer name that does not match the account', () => {
    const analysis = analyzeSavingsTransactionImportRows(
      [validRow({ 'Client Name': 'Someone Else' })],
      context
    );
    assert.equal(analysis.canPost, false);
    assert.match(analysis.rows[0].errors.join(' '), /does not match/);
  });

  it('rejects an unknown transaction type', () => {
    const analysis = analyzeSavingsTransactionImportRows(
      [validRow({ 'Transaction Type': 'Transfer' })],
      context
    );
    assert.equal(analysis.canPost, false);
    assert.match(analysis.rows[0].errors.join(' '), /Deposit or Withdrawal/);
  });

  it('rejects a missing account number', () => {
    const analysis = analyzeSavingsTransactionImportRows(
      [validRow({ 'Account No': '' })],
      context
    );
    assert.equal(analysis.canPost, false);
    assert.match(analysis.rows[0].errors.join(' '), /Account number is required/);
  });

  it('rejects a date after the business date', () => {
    const analysis = analyzeSavingsTransactionImportRows(
      [validRow({ Date: '12 September 2026' })],
      context
    );
    assert.equal(analysis.canPost, false);
    assert.match(analysis.rows[0].errors.join(' '), /business date/);
  });

  it('rejects cash types when denominations are required', () => {
    const analysis = analyzeSavingsTransactionImportRows([validRow()], {
      ...context,
      cashDenominationsRequired: true
    });
    assert.equal(analysis.canPost, false);
    assert.equal(analysis.rows[0].errors.includes(CASH_DENOMINATION_IMPORT_MESSAGE), true);
  });

  it('rejects withdrawals when the role cannot withdraw', () => {
    const analysis = analyzeSavingsTransactionImportRows(
      [validRow({ 'Transaction Type': 'Withdrawal' })],
      { ...context, canWithdraw: false }
    );
    assert.equal(analysis.canPost, false);
    assert.match(analysis.rows[0].errors.join(' '), /cannot post withdrawals/);
  });
});
