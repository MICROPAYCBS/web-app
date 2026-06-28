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
  buildSavingsReceiptFromSubmission,
  buildSavingsReceiptFromTransaction
} from '@/components/clients/savings/receipt/savings-receipt-view-model';
import { emptyPaymentDetailFields } from '@/components/composites/payment-detail-fields';

describe('buildSavingsReceiptFromTransaction', () => {
  it('maps transaction and payment details for PDF display', () => {
    const receipt = buildSavingsReceiptFromTransaction(
      {
        id: 42,
        amount: 1500,
        date: [2026, 6, 23],
        runningBalance: 5000,
        transactionType: { deposit: true, value: 'Deposit' },
        note: 'Cash deposit',
        paymentDetailData: {
          paymentType: { name: 'Cash' },
          receiptNumber: 'RCPT-1'
        }
      } as FineractSavingsAccountTransaction,
      { accountNo: 'SA-001', clientName: 'Jane Doe' },
      'UGX',
      'Head Office'
    );

    assert.equal(receipt.transactionId, 42);
    assert.equal(receipt.clientName, 'Jane Doe');
    assert.equal(receipt.accountNo, 'SA-001');
    assert.equal(receipt.transactionTypeLabel, 'Deposit');
    assert.equal(receipt.paymentType, 'Cash');
    assert.equal(receipt.receiptNumber, 'RCPT-1');
    assert.equal(receipt.orgName, 'Head Office');
    assert.match(receipt.transactionAmountLabel, /UGX/);
    assert.match(receipt.runningBalanceLabel ?? '', /UGX/);
  });
});

describe('buildSavingsReceiptFromSubmission', () => {
  it('formats form submission data after deposit', () => {
    const receipt = buildSavingsReceiptFromSubmission({
      transactionId: 99,
      transactionDate: '2026-06-23',
      transactionAmount: '2500.50',
      transactionTypeLabel: 'Deposit',
      paymentTypeName: 'Cash',
      note: 'Monthly savings',
      paymentDetails: {
        ...emptyPaymentDetailFields(),
        receiptNumber: 'R-99'
      },
      account: { accountNo: 'SA-002', clientName: 'John Smith' },
      currencyCode: 'USD'
    });

    assert.equal(receipt.transactionId, 99);
    assert.equal(receipt.receiptNumber, 'R-99');
    assert.equal(receipt.transactionTypeLabel, 'Deposit');
    assert.match(receipt.transactionAmountLabel, /USD/);
  });
});
