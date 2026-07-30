/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  isCreateLoanCheckerCommand,
  loanAccountDraftFromCommandAsJson,
  loanSubjectFromCommandAsJson
} from './loan-command-review';

const SAMPLE_CREATE_PAYLOAD = {
  clientId: 42,
  productId: 7,
  principal: 1_500_000,
  loanOfficerId: 3,
  loanTermFrequency: 12,
  loanTermFrequencyType: 2,
  numberOfRepayments: 12,
  repaymentEvery: 1,
  repaymentFrequencyType: 2,
  interestRatePerPeriod: 2.5,
  amortizationType: 1,
  interestType: 0,
  interestCalculationPeriodType: 1,
  transactionProcessingStrategyCode: 'mifos-standard-strategy',
  submittedOnDate: '11 July 2026',
  expectedDisbursementDate: '15 July 2026',
  charges: [{ chargeId: 9, amount: 10000 }],
  collateral: [{ clientCollateralId: 5, quantity: 2 }]
};

describe('loan-command-review', () => {
  it('detects CREATE LOAN commands', () => {
    assert.equal(isCreateLoanCheckerCommand('CREATE', 'LOAN'), true);
    assert.equal(isCreateLoanCheckerCommand('APPROVE', 'LOAN'), false);
    assert.equal(isCreateLoanCheckerCommand('CREATE', 'CLIENT'), false);
  });

  it('builds a subject from principal and product', () => {
    assert.equal(
      loanSubjectFromCommandAsJson(JSON.stringify(SAMPLE_CREATE_PAYLOAD)),
      'Product #7 · 1500000'
    );
  });

  it('maps CREATE payload into a loan draft', () => {
    const draft = loanAccountDraftFromCommandAsJson(JSON.stringify(SAMPLE_CREATE_PAYLOAD));
    assert.ok(draft);
    assert.equal(draft?.productId, 7);
    assert.equal(draft?.principal, 1_500_000);
    assert.equal(draft?.loanOfficerId, 3);
    assert.equal(draft?.charges.length, 1);
    assert.equal(draft?.charges[0]?.chargeId, 9);
    assert.equal(draft?.collateral[0]?.collateralTypeId, 5);
    assert.equal(draft?.collateral[0]?.value, 2);
  });
});
