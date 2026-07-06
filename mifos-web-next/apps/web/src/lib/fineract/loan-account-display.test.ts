/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildLoanAccountSummaryMatrix, loanAccountHasPayoutConfiguration, loanAccountLinkedAccountLabel, loanAccountStandingInstructionAtDisbursementLabel } from '@/lib/fineract/loan-account-display';
import type { FineractLoanAccountDetail } from '@/lib/fineract/loan-account-types';

function sampleAccount(summary: FineractLoanAccountDetail['summary']): FineractLoanAccountDetail {
  return {
    id: 1,
    accountNo: '0001',
    status: { id: 300, value: 'Active', code: 'loanStatusType.active', active: true },
    currency: { code: 'USD', name: 'US Dollar' },
    createStandingInstructionAtDisbursement: false,
    summary
  };
}

describe('buildLoanAccountSummaryMatrix', () => {
  it('builds principal through total rows from summary', () => {
    const rows = buildLoanAccountSummaryMatrix(
      sampleAccount({
        totalPrincipal: 1000,
        principalPaid: 200,
        principalOutstanding: 800,
        interestCharged: 50,
        interestPaid: 10,
        interestOutstanding: 40,
        feeChargesCharged: 5,
        feeChargesPaid: 5,
        feeChargesOutstanding: 0,
        penaltyChargesCharged: 0,
        penaltyChargesPaid: 0,
        penaltyChargesOutstanding: 0,
        totalExpectedRepayment: 1055,
        totalRepayment: 215,
        totalOutstanding: 840,
        totalOverdue: 0
      })
    );

    assert.equal(rows.length, 5);
    assert.equal(rows[0]?.property, 'Principal');
    assert.equal(rows[0]?.original, 1000);
    assert.equal(rows[4]?.property, 'Total');
    assert.equal(rows[4]?.outstanding, 840);
  });

  it('returns empty array when summary is missing', () => {
    assert.deepEqual(buildLoanAccountSummaryMatrix(sampleAccount(undefined)), []);
  });
});

describe('loanAccountHasPayoutConfiguration', () => {
  it('is true when a linked savings account is configured', () => {
    assert.equal(
      loanAccountHasPayoutConfiguration({
        ...sampleAccount(undefined),
        linkedAccount: { id: 12, accountNo: '000000045', productName: 'Passbook' }
      }),
      true
    );
  });

  it('is true when standing instruction at disbursement is enabled', () => {
    assert.equal(
      loanAccountHasPayoutConfiguration({
        ...sampleAccount(undefined),
        createStandingInstructionAtDisbursement: true
      }),
      true
    );
  });

  it('is false when payout fields are absent', () => {
    assert.equal(loanAccountHasPayoutConfiguration(sampleAccount(undefined)), false);
  });
});

describe('loanAccountLinkedAccountLabel', () => {
  it('formats linked account product and account number', () => {
    assert.equal(
      loanAccountLinkedAccountLabel({
        ...sampleAccount(undefined),
        linkedAccount: { id: 12, accountNo: '000000045', productName: 'Passbook' }
      }),
      'Passbook · 000000045'
    );
  });
});

describe('loanAccountStandingInstructionAtDisbursementLabel', () => {
  it('returns No when the flag is false or absent from the payload', () => {
    assert.equal(loanAccountStandingInstructionAtDisbursementLabel(sampleAccount(undefined)), 'No');
    assert.equal(
      loanAccountStandingInstructionAtDisbursementLabel({
        ...sampleAccount(undefined),
        createStandingInstructionAtDisbursement: false
      }),
      'No'
    );
  });

  it('returns Yes when standing instruction at disbursement is enabled', () => {
    assert.equal(
      loanAccountStandingInstructionAtDisbursementLabel({
        ...sampleAccount(undefined),
        createStandingInstructionAtDisbursement: true
      }),
      'Yes'
    );
  });
});
