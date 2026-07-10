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
  loanAccountDraftFromEditTemplate,
  loanAccountIsModifiableStatus
} from '@/lib/fineract/client-loan-account-edit-draft';

describe('loanAccountIsModifiableStatus', () => {
  it('allows submitted and pending approval', () => {
    assert.equal(
      loanAccountIsModifiableStatus({
        value: 'Submitted and pending approval',
        submittedAndPendingApproval: true
      }),
      true
    );
  });

  it('rejects approved loans', () => {
    assert.equal(
      loanAccountIsModifiableStatus({
        value: 'Approved',
        pendingApproval: false
      }),
      false
    );
  });
});

describe('loanAccountDraftFromEditTemplate', () => {
  it('maps account values and defaults enableDownPayment when supported', () => {
    const draft = loanAccountDraftFromEditTemplate(
      {
        loanOfficerId: 3,
        loanPurposeId: 7,
        principal: 250_000,
        loanTermFrequency: 6,
        loanTermFrequencyType: { id: 2 },
        numberOfRepayments: 6,
        repaymentEvery: 1,
        repaymentFrequencyType: { id: 2 },
        interestRatePerPeriod: 12,
        amortizationType: { id: 1 },
        interestType: { id: 0 },
        interestCalculationPeriodType: { id: 1 },
        transactionProcessingStrategyCode: 'mifos-standard-strategy',
        submittedOnDate: [2026, 7, 1],
        expectedDisbursementDate: [2026, 7, 15],
        enableDownPayment: true,
        charges: [
          {
            id: 44,
            chargeId: 12,
            amount: 5000
          }
        ]
      },
      {
        product: { id: 2, name: 'Progressive loan' },
        enableDownPayment: true,
        currency: { code: 'UGX', name: 'Ugandan Shilling' }
      }
    );

    assert.equal(draft.productId, 2);
    assert.equal(draft.loanOfficerId, 3);
    assert.equal(draft.loanPurposeId, 7);
    assert.equal(draft.principal, 250_000);
    assert.equal(draft.enableDownPayment, true);
    assert.equal(draft.charges?.[0]?.id, 44);
    assert.equal(draft.charges?.[0]?.chargeId, 12);
    assert.match(draft.submittedOnDate, /2026/);
  });
});
